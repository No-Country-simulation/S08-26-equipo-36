import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Spinner from "../../components/common/Spinner/Spinner";
import {
  ArrowLeft,
  Factory,
  User,
  Package,
  Calendar,
  Wrench,
  Check,
  ClipboardList,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Pencil,
  X,
  Lock,
  Ban,
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
  const [qualityControls, setQualityControls] = useState([]);
  const [nonConformities, setNonConformities] = useState([]);
  const [activeTab, setActiveTab] = useState("hoja-de-ruta");

  // Edición inline del Responsable
  const [isEditingResp, setIsEditingResp] = useState(false);
  const [respValue, setRespValue] = useState("");
  const [savingResp, setSavingResp] = useState(false);

  // Carga inicial y datos vinculados
  useEffect(() => {
    let isMounted = true;

    const fetchOtDetail = async () => {
      try {
        const res = await api.getDetalleOrden(id);

        if (!isMounted) return;

        if (res?.status === "success" && res.data) {
          const dbData = res.data;
          const rawId = dbData.id_ot || dbData.id;
          const realId = !isNaN(Number(rawId)) ? Number(rawId) : rawId;

          setOt({
            ...dbData,
            id: realId,
            estado: normalizeDbToUiStatus(dbData.estado_actual),
          });
          setRespValue(dbData.responsable || "");

          // 1. Cargar Operaciones
          try {
            if (typeof api.getOperacionesOrden === "function") {
              const opsRes = await api.getOperacionesOrden(realId);
              if (
                isMounted &&
                opsRes?.status === "success" &&
                Array.isArray(opsRes.data)
              ) {
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
              }
            }
          } catch (opErr) {
            console.warn(
              "[WorkOrderDetails] Fallback localStorage operaciones:",
              opErr,
            );
            if (isMounted) {
              const storageKey = `qt_ops_${realId}`;
              const storedOps = localStorage.getItem(storageKey);
              setOperations(storedOps ? JSON.parse(storedOps) : []);
            }
          }

          // 2. Cargar Controles de Calidad
          try {
            if (typeof api.getControlesOrden === "function") {
              const qcRes = await api.getControlesOrden(realId);
              if (
                isMounted &&
                qcRes?.status === "success" &&
                Array.isArray(qcRes.data)
              ) {
                setQualityControls(qcRes.data);
              }
            }
          } catch (qcErr) {
            console.warn(
              "[WorkOrderDetails] Error al sincronizar controles:",
              qcErr,
            );
          }

          // 3. Cargar No Conformidades
          try {
            if (typeof api.getNoConformidadesOrden === "function") {
              const ncRes = await api.getNoConformidadesOrden(realId);
              if (
                isMounted &&
                ncRes?.status === "success" &&
                Array.isArray(ncRes.data)
              ) {
                setNonConformities(ncRes.data);
              }
            }
          } catch (ncErr) {
            console.warn(
              "[WorkOrderDetails] Error al sincronizar no conformidades:",
              ncErr,
            );
          }
        } else {
          setOt(null);
        }
      } catch (err) {
        console.error("[WorkOrderDetails] Error al cargar la OT:", err);
        if (isMounted) setOt(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOtDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // --- REGLAS TERMINALES Y QUALITY GATE INDUSTRIAL ---
  const isCancelled = ot?.estado === "cancelada";
  const isDelivered = ot?.estado === "entregada";
  const isTerminal = isCancelled || isDelivered;

  const isMachiningComplete =
    operations.length > 0 &&
    operations.every(
      (op) => (op.status || op.estado || "").toLowerCase() === "completada",
    );

  const hasReworkQuality = qualityControls.some((c) => {
    const res = (c.resultado || c.status || "").toLowerCase();
    return res === "retrabajo";
  });

  const hasRejectedQuality = qualityControls.some((c) => {
    const res = (c.resultado || c.status || "").toLowerCase();
    return res === "rechazado";
  });

  const hasActiveNc = nonConformities.some((nc) => {
    const st = (
      nc.estado_resolucion ||
      nc.estado ||
      nc.status ||
      ""
    ).toLowerCase();
    return st === "abierta" || st === "en_analisis";
  });

  const handleSelectStatus = async (newUiStatus) => {
    if (isTerminal && newUiStatus !== ot?.estado) return;

    const dbStatus = normalizeUiToDbStatus(newUiStatus);
    setOt((prev) => ({
      ...prev,
      estado: newUiStatus,
      estado_actual: dbStatus,
    }));

    try {
      if (typeof api.actualizarEstadoOrden === "function") {
        await api.actualizarEstadoOrden(ot?.id, dbStatus);
      }
    } catch (err) {
      console.error("[WorkOrderDetails] Error al actualizar estado:", err);
    }
  };

  const handleOpStatusChange = (opId, newStatus) => {
    if (isTerminal) return;
    setOperations((prev) => {
      const updated = prev.map((o) =>
        o.id === opId ? { ...o, status: newStatus.toLowerCase() } : o,
      );
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddOperation = (newOp) => {
    if (isTerminal) return;
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
    if (isTerminal) return;
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
    if (isTerminal) return;
    setOperations((prev) => {
      const updated = prev.filter((op) => op.id !== opId);
      localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleQualityChange = async (updatedControls) => {
    if (isTerminal) return;
    setQualityControls(updatedControls);

    const anyRework = updatedControls.some((c) => {
      const r = (c.resultado || c.status || "").toLowerCase();
      return r === "retrabajo";
    });
    const anyRejected = updatedControls.some((c) => {
      const r = (c.resultado || c.status || "").toLowerCase();
      return r === "rechazado";
    });
    const allApproved =
      updatedControls.length > 0 &&
      updatedControls.every((c) => {
        const r = (c.resultado || c.status || "").toLowerCase();
        return r === "aprobado";
      });

    if (anyRework) {
      await handleSelectStatus("mecanizado");
      setOperations((prev) => {
        if (prev.length === 0) return prev;
        const lastOp = prev[prev.length - 1];
        const updated = prev.map((o) =>
          o.id === lastOp.id ? { ...o, status: "pendiente" } : o,
        );
        localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
        return updated;
      });
      setActiveTab("hoja-de-ruta");
    } else if (anyRejected) {
      await handleSelectStatus("cancelada");
    } else if (allApproved && !hasActiveNc) {
      await handleSelectStatus("liberada");
    }
  };

  const handleNcChange = (updatedNcs) => {
    if (isTerminal) return;
    setNonConformities(updatedNcs);
  };

  const isCreatingReworkRef = useRef(false);

  const handleNcReworkTrigger = async ({
    severity,
    title,
    correctiveAction,
    status,
  }) => {
    if (isTerminal) return;

    if (severity === "critica") {
      await handleSelectStatus("cancelada");
      return;
    }
    if (status === "cerrada" || status === "corregida") return;
    if (severity === "moderada") {
      if (isCreatingReworkRef.current) return;
      isCreatingReworkRef.current = true;
      setTimeout(() => {
        isCreatingReworkRef.current = false;
      }, 1000);

      const taskDescription = `[Retrabajo] ${correctiveAction || title}`;

      const alreadyExists = operations.some(
        (op) =>
          (op.name === taskDescription ||
            op.descripcion_tarea === taskDescription) &&
          op.status === "pendiente",
      );
      if (alreadyExists) {
        await handleSelectStatus("mecanizado");
        setActiveTab("hoja-de-ruta");
        return;
      }

      const maxStep = operations.reduce(
        (max, op) => Math.max(max, op.step || 0),
        0,
      );
      const nextStep = maxStep > 0 ? maxStep + 10 : 10;

      const newOpPayload = {
        secuencia: nextStep,
        descripcion_tarea: taskDescription,
        tipo: "Ajuste / Retrabajo",
        operario_asignado: ot?.responsable || "Taller Mecanizado",
        maquina: "Taller General",
        tiempo_estimado: 30,
        estado: "pendiente",
      };

      if (typeof api.crearOperacionOrden === "function" && ot?.id) {
        api
          .crearOperacionOrden(ot.id, newOpPayload)
          .catch((err) =>
            console.warn("[WorkOrderDetails] Fallback backend retrabajo:", err),
          );
      }

      const newOpObj = {
        id: Date.now(),
        step: nextStep,
        name: newOpPayload.descripcion_tarea,
        type: newOpPayload.tipo,
        operator: newOpPayload.operario_asignado,
        time: `${newOpPayload.tiempo_estimado} min`,
        machine: newOpPayload.maquina,
        status: "pendiente",
      };

      setOperations((prev) => {
        const updated = [...prev, newOpObj];
        localStorage.setItem(`qt_ops_${ot?.id || id}`, JSON.stringify(updated));
        return updated;
      });

      await handleSelectStatus("mecanizado");
      setActiveTab("hoja-de-ruta");
    }
  };

  const handleSaveResponsable = async () => {
    if (isTerminal) return;
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
      </div>

      {/* Banner de bloqueo para OT Cancelada */}
      {isCancelled && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#f87171",
            fontSize: "0.875rem",
          }}
        >
          <Ban size={18} style={{ flexShrink: 0 }} />
          <span>
            Esta orden de trabajo se encuentra <strong>Cancelada por Scrap</strong>. 
            El expediente técnico permanece bloqueado en modo de solo lectura para auditoría y trazabilidad histórica.
          </span>
        </div>
      )}

      {isDelivered && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.35)",
            color: "#4ade80",
            fontSize: "0.875rem",
          }}
        >
          <Check size={18} style={{ flexShrink: 0 }} />
          <span>
            Esta orden de trabajo ha sido <strong>Entregada</strong> al cliente.
            El expediente se encuentra archivado en modo lectura.
          </span>
        </div>
      )}

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

        {/* Responsable (Bloqueado si está cancelada o entregada) */}
        <div
          className={`${styles.metaCard} ${
            !isEditingResp && !isTerminal ? styles.metaCardInteractive : ""
          }`}
          onClick={() => {
            if (!isEditingResp && !isTerminal) {
              setRespValue(ot.responsable || "");
              setIsEditingResp(true);
            }
          }}
          title={
            isTerminal
              ? "Edición no permitida en órdenes finalizadas o canceladas"
              : !isEditingResp
              ? "Clic para editar responsable"
              : ""
          }
        >
          <p className={styles.metaLabel}>
            <User size={12} /> Responsable
          </p>

          {isEditingResp && !isTerminal ? (
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
              {!isTerminal && (
                <span className={styles.editIconBtn}>
                  <Pencil size={11} />
                </span>
              )}
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

      {/* Tabs con Quality Gate Multinivel */}
      <div className={styles.tabsContainer}>
        {TABS_CONFIG.map((tab) => {
          const Icon = tab.icon;

          let isTabBlocked = false;
          let blockTitle = "";

          // Gate 1: Calidad y NC se bloquean durante fabricación normal si no concluyó al 100%
          // (Si la OT está cancelada, permitimos visualización de auditoría pero en solo lectura)
          if ((tab.id === "calidad" || tab.id === "nc") && !isCancelled) {
            if (!isMachiningComplete) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: Deben completarse todas las operaciones de la Hoja de Ruta antes de iniciar inspecciones de calidad.";
            }
          }

          // Gate 2: Entrega se bloquea si la orden fue cancelada, rechazada, o si hay retrabajo/NC abierta
          if (tab.id === "entrega") {
            if (isCancelled) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: La orden fue cancelada por defecto crítico (Scrap). Pieza descartada.";
            } else if (!isMachiningComplete) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: Se requiere completar todas las operaciones en Hoja de Ruta.";
            } else if (hasReworkQuality) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: Existen controles de calidad en estado 'Retrabajo'. Corrija la pieza antes de entregar.";
            } else if (hasRejectedQuality) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: Control de calidad rechazado. La pieza no cumple requisitos para entrega.";
            } else if (hasActiveNc) {
              isTabBlocked = true;
              blockTitle =
                "Pestaña bloqueada: Existen No Conformidades abiertas o en análisis asociadas a esta orden.";
            }
          }

          return (
            <button
              key={tab.id}
              type="button"
              disabled={isTabBlocked}
              onClick={() => !isTabBlocked && setActiveTab(tab.id)}
              title={blockTitle}
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
            readOnly={isTerminal}
            onOpStatusChange={handleOpStatusChange}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            onDeleteOperation={handleDeleteOperation}
          />
        )}
        {activeTab === "documentacion" && (
          <DocumentsTab otId={ot.id} ot={ot} readOnly={isTerminal} />
        )}
        {activeTab === "calidad" && (
          <QualityTab
            otId={ot.id}
            ot={ot}
            operations={operations}
            readOnly={isTerminal}
            onControlsChange={handleQualityChange}
          />
        )}
        {activeTab === "nc" && (
          <NonConformitiesTab
            otId={ot.id}
            ot={ot}
            operations={operations}
            readOnly={isTerminal}
            onNcChange={handleNcChange}
            onReworkTrigger={handleNcReworkTrigger}
          />
        )}
        {activeTab === "entrega" && (
          <DeliveryTab otId={ot.id} ot={ot} readOnly={isTerminal} />
        )}
      </div>
    </div>
  );
}