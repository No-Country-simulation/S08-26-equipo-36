import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner/Spinner";
import {
  ArrowLeft,
  Factory,
  User,
  Package,
  Calendar,
  Settings2,
  Wrench,
  ChevronDown,
  Check,
  ClipboardList,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Pencil,
  X,
  Lock,
} from "lucide-react";
import RoadmapTab from "../../components/workOrders/tabs/RoadmapTab/RoadmapTab";
import DocumentsTab from "../../components/workOrders/tabs/DocumentsTab/DocumentsTab";
import QualityTab from "../../components/workOrders/tabs/QualityTab/QualityTab";
import NonConformitiesTab from "../../components/workOrders/tabs/NonConformitiesTab/NonConformitiesTab";
import DeliveryTab from "../../components/workOrders/tabs/DeliveryTab/DeliveryTab";
import { api } from "../../api/apiClient";
import styles from "./WorkOrderDetails.module.css";

const TABS_CONFIG = [
  { id: "hoja-de-ruta", label: "Hoja de Ruta", icon: ClipboardList },
  { id: "documentacion", label: "Documentación", icon: FileText },
  { id: "calidad", label: "Control de Calidad", icon: ShieldCheck },
  { id: "nc", label: "No Conformidades", icon: AlertTriangle },
  { id: "entrega", label: "Entrega", icon: Truck },
];

const OT_HEADER_STATUSES = [
  { value: "creada", label: "Creada", className: styles.statusCreada },
  {
    value: "mecanizado",
    label: "En Mecanizado",
    className: styles.statusMecanizado,
  },
  {
    value: "calidad",
    label: "Control Calidad",
    className: styles.statusCalidad,
  },
  { value: "liberada", label: "Liberada", className: styles.statusLiberada },
  { value: "entregada", label: "Entregada", className: styles.statusEntregada },
  { value: "cancelada", label: "Cancelada", className: styles.statusCancelada },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("T")[0].split(" ")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

const normalizeDbToUiStatus = (dbStatus) => {
  const s = (dbStatus || "creada").toLowerCase();
  if (s === "en_proceso") return "mecanizado";
  if (s === "control_calidad") return "calidad";
  if (s === "finalizada") return "liberada";
  return s;
};

const normalizeUiToDbStatus = (uiStatus) => {
  if (uiStatus === "mecanizado") return "en_proceso";
  if (uiStatus === "calidad") return "control_calidad";
  if (uiStatus === "liberada") return "finalizada";
  return uiStatus;
};

export default function WorkOrderDetails() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [ot, setOt] = useState(null);
  const [operations, setOperations] = useState([]);
  const [activeTab, setActiveTab] = useState("hoja-de-ruta");

  const [isOtStatusMenuOpen, setIsOtStatusMenuOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Edición inline del Responsable
  const [isEditingResp, setIsEditingResp] = useState(false);
  const [respValue, setRespValue] = useState("");
  const [savingResp, setSavingResp] = useState(false);

  const otMenuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchOtDetail() {
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 400));

        // 1. Buscamos el detalle de la OT (soporta tanto 'OT-0004' como 7)
        const [res] = await Promise.all([api.getDetalleOrden(id), minDelay]);

        if (!isMounted) return;

        if (res?.status === "success" && res.data) {
          const dbData = res.data;
          const realId = dbData.id_ot || dbData.id;

          setOt({
            ...dbData,
            id: realId,
            estado: normalizeDbToUiStatus(dbData.estado_actual),
          });
          setRespValue(dbData.responsable || "");

          // 2. Traemos las operaciones usando SIEMPRE el ID numérico técnico
          try {
            if (typeof api.getOperacionesOrden === "function") {
              const opsRes = await api.getOperacionesOrden(realId);
              if (opsRes?.status === "success" && Array.isArray(opsRes.data)) {
                const mappedOps = opsRes.data.map((item, index) => ({
                  id: item.id_operacion || item.id,
                  step: item.secuencia || (index + 1) * 10,
                  name: item.descripcion_tarea || item.nombre || "Operación",
                  type: item.tipo || "Torneado",
                  operator: item.operario_asignado || item.operario || "—",
                  time: item.tiempo_estimado
                    ? `${item.tiempo_estimado} min`
                    : "—",
                  machine: item.maquina || "Taller General",
                  status: (item.estado || "pendiente").toLowerCase(),
                  description: item.descripcion_tarea || item.descripcion || "",
                  estimatedTime: item.tiempo_estimado || 0,
                  realTime: item.tiempo_real || 0,
                }));
                setOperations(mappedOps);
                return;
              }
            }
          } catch (opErr) {
            console.warn(
              "[WorkOrderDetails] Error al cargar operaciones por API:",
              opErr,
            );
          }

          // Fallback a localStorage si fallara la API de operaciones
          const storageKey = `qt_ops_${realId}`;
          const storedOps = localStorage.getItem(storageKey);
          setOperations(storedOps ? JSON.parse(storedOps) : []);
        } else {
          setOt(null);
        }
      } catch (err) {
        console.error("[WorkOrderDetails] Error al cargar la OT:", err);
        setOt(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOtDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (otMenuRef.current && !otMenuRef.current.contains(e.target)) {
        setIsOtStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validación de Gate 1: Requiere operaciones existentes y 100% completadas
  const isMachiningComplete =
    operations.length > 0 &&
    operations.every((op) => op.status === "completada");

  const handleSelectStatus = async (newUiStatus) => {
    const dbStatus = normalizeUiToDbStatus(newUiStatus);
    setOt((prev) => ({
      ...prev,
      estado: newUiStatus,
      estado_actual: dbStatus,
    }));
    setIsOtStatusMenuOpen(false);

    try {
      await api.actualizarEstadoOrden(ot.id, dbStatus);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600);
    } catch (err) {
      console.error(
        "[WorkOrderDetails] Error al actualizar estado en la base de datos:",
        err,
      );
    }
  };

  const handleSaveResponsable = async () => {
    try {
      setSavingResp(true);
      const cleanVal = respValue.trim();
      await api.actualizarResponsableOrden(ot.id, cleanVal);
      setOt((prev) => ({ ...prev, responsable: cleanVal }));
      setIsEditingResp(false);
    } catch (err) {
      console.error("[WorkOrderDetails] Error al actualizar responsable:", err);
    } finally {
      setSavingResp(false);
    }
  };

  const handleOpStatusChange = (opId, newStatus) => {
    setOperations((prev) => {
      const updated = prev.map((o) =>
        o.id === opId ? { ...o, status: newStatus.toLowerCase() } : o,
      );
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddOperation = (newOp) => {
    setOperations((prev) => {
      const updated = [
        ...prev,
        { ...newOp, status: (newOp.status || "pendiente").toLowerCase() },
      ];
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateOperation = (opId, updatedData) => {
    setOperations((prev) => {
      const updated = prev.map((op) =>
        op.id === opId
          ? {
              ...op,
              ...updatedData,
              status: (updatedData.status || op.status).toLowerCase(),
            }
          : op,
      );
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteOperation = (opId) => {
    setOperations((prev) => {
      const updated = prev.filter((op) => op.id !== opId);
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return <Spinner fullScreen text="Cargando orden de trabajo..." />;
  }

  if (!ot) {
    return (
      <div className={styles.container}>
        <Link to="/ordenes" className={styles.backLink}>
          <ArrowLeft size={15} /> Órdenes de Trabajo
        </Link>
        <p className={styles.notFoundText}>Orden de Trabajo no encontrada.</p>
      </div>
    );
  }

  const currentOtStatusObj =
    OT_HEADER_STATUSES.find((s) => s.value === (ot.estado || "creada")) ||
    OT_HEADER_STATUSES[0];

  return (
    <div className={styles.container}>
      <Link to="/ordenes" className={styles.backLink}>
        <ArrowLeft size={15} /> Órdenes de Trabajo
      </Link>

      <div className={styles.topHeader}>
        <div className={styles.identityArea}>
          <div className={styles.factoryIconBox}>
            <Factory size={22} />
          </div>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.otNumber}>
                {ot.numero ||
                  `OT-${String(ot.id_ot || ot.id).padStart(4, "0")}`}
              </h1>
              <span
                className={`${styles.badge} ${currentOtStatusObj.className}`}
              >
                <span className={styles.dot} />
                {currentOtStatusObj.label}
              </span>
              <span className={`${styles.badge} ${styles.prioAlta}`}>
                <span className={styles.dot} />
                {ot.prioridad || "media"}
              </span>
            </div>

            <p className={styles.pieceTitle}>
              {ot.pieza || "Pieza no especificada"}
            </p>

            <p className={styles.descriptionText}>
              {ot.descripcion || "Sin descripción de requerimiento registrada."}
            </p>
          </div>
        </div>

        <div className={styles.otStatusWrapper} ref={otMenuRef}>
          <Settings2 size={16} className={styles.settingsIcon} />
          <button
            type="button"
            className={`${styles.otStatusTriggerBtn} ${
              isFlashing ? styles.otStatusTriggerFlash : ""
            }`}
            onClick={() => setIsOtStatusMenuOpen(!isOtStatusMenuOpen)}
          >
            <span>{currentOtStatusObj.label}</span>
            <ChevronDown size={14} className={styles.chevronIcon} />
          </button>

          {isOtStatusMenuOpen && (
            <div className={styles.otStatusDropdownMenu}>
              {OT_HEADER_STATUSES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  className={`${styles.otStatusOptionItem} ${
                    ot.estado === st.value ? styles.otStatusOptionSelected : ""
                  }`}
                  onClick={() => handleSelectStatus(st.value)}
                >
                  <span>{st.label}</span>
                  {ot.estado === st.value && (
                    <Check size={14} className={styles.checkIcon} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <User size={12} /> Cliente
          </p>
          <p className={styles.metaValue}>{ot.cliente_nombre || "—"}</p>
        </div>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <Package size={12} /> Cantidad
          </p>
          <p className={styles.metaValue}>{Number(ot.cantidad) || 1}</p>
        </div>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <Wrench size={12} /> Material
          </p>
          <p className={styles.metaValue}>{ot.material || "—"}</p>
        </div>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <Calendar size={12} /> Creación
          </p>
          <p className={styles.metaValue}>{formatDate(ot.fecha_creacion)}</p>
        </div>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <Calendar size={12} /> Inicio
          </p>
          <p className={styles.metaValue}>{formatDate(ot.fecha_inicio)}</p>
        </div>
        <div className={styles.metaCard}>
          <p className={styles.metaLabel}>
            <Calendar size={12} /> Entrega estimada
          </p>
          <p className={styles.metaValue}>
            {formatDate(ot.fecha_entrega_estimada)}
          </p>
        </div>

        {/* Tarjeta Responsable Editable */}
        <div
          className={`${styles.metaCard} ${!isEditingResp ? styles.metaCardInteractive : ""}`}
          onClick={() => {
            if (!isEditingResp) {
              setRespValue(ot.responsable || "");
              setIsEditingResp(true);
            }
          }}
          title={!isEditingResp ? "Clic para editar responsable" : ""}
        >
          <p className={styles.metaLabel}>
            <User size={12} /> Responsable
          </p>

          {isEditingResp ? (
            <div
              className={styles.respForm}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                autoFocus
                disabled={savingResp}
                value={respValue}
                placeholder="Ej. Ing. Juan Pérez"
                onChange={(e) => setRespValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveResponsable();
                  if (e.key === "Escape") setIsEditingResp(false);
                }}
                className={styles.respInput}
              />
              <button
                type="button"
                disabled={savingResp}
                onClick={handleSaveResponsable}
                className={styles.respActionBtn}
                title="Guardar"
              >
                <Check size={11} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={savingResp}
                onClick={() => setIsEditingResp(false)}
                className={styles.respCancelBtn}
                title="Cancelar"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <div className={styles.respValueWrapper}>
              <span className={styles.metaValue}>{ot.responsable || "—"}</span>
              <span className={styles.editIconBtn}>
                <Pencil size={11} />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.subPanelsGrid}>
        <div className={styles.specsBox}>
          <p className={styles.specsTitle}>Especificaciones Técnicas</p>
          <p className={styles.specsBody}>
            {ot.especificaciones || "Sin especificaciones técnicas adjuntas."}
          </p>
        </div>
        <div className={styles.quoteBox}>
          <p className={styles.quoteTitle}>Cotización Origen</p>
          <p className={styles.quoteBody}>
            {ot.precio_cotizado} · {formatDate(ot.fecha_cotizacion)}
          </p>
        </div>
      </div>

      {/* Tabs con Quality Gate 1 */}
      <div className={styles.tabsContainer}>
        {TABS_CONFIG.map((tab) => {
          const Icon = tab.icon;

          // Documentación y Hoja de Ruta siempre libres. Control, NC y Entrega se bloquean si la fabricación no concluyó.
          const isTabBlocked =
            (tab.id === "calidad" || tab.id === "nc" || tab.id === "entrega") &&
            !isMachiningComplete;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={isTabBlocked}
              onClick={() => !isTabBlocked && setActiveTab(tab.id)}
              title={
                isTabBlocked
                  ? "Pestaña bloqueada: Deben completarse todas las operaciones de la Hoja de Ruta antes de avanzar"
                  : ""
              }
              className={`${styles.tabBtn} ${
                activeTab === tab.id ? styles.tabBtnActive : ""
              } ${isTabBlocked ? styles.tabBtnDisabled : ""}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {isTabBlocked && (
                <Lock size={12} className={styles.tabLockIcon} />
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.tabContentCard}>
        {activeTab === "hoja-de-ruta" && (
          <RoadmapTab
            otId={ot.id}
            ot={ot}
            operations={operations}
            onOpStatusChange={handleOpStatusChange}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            onDeleteOperation={handleDeleteOperation}
          />
        )}
        {activeTab === "documentacion" && <DocumentsTab otId={ot.id} ot={ot} />}
        {activeTab === "calidad" && (
          <QualityTab otId={ot.id} ot={ot} operations={operations} />
        )}
        {activeTab === "nc" && (
          <NonConformitiesTab otId={ot.id} ot={ot} operations={operations} />
        )}
        {activeTab === "entrega" && <DeliveryTab otId={ot.id} ot={ot} />}
      </div>
    </div>
  );
}
