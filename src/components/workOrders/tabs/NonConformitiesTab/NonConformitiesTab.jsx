import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  Plus,
  Inbox,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import ConfirmDialog from "../../../common/ConfirmDialog/ConfirmDialog";
import { api } from "../../../../api/apiClient";
import styles from "./NonConformitiesTab.module.css";

const SEVERITY_OPTIONS = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "critica", label: "Crítica" },
];

const STATUS_OPTIONS = [
  { value: "abierta", label: "Abierta" },
  { value: "en_analisis", label: "En Análisis" },
  { value: "corregida", label: "Corregida" },
  { value: "cerrada", label: "Cerrada" },
];

const ORIGIN_OPTIONS = [
  "Producción",
  "Control de Calidad",
  "Cliente",
  "Auditoría",
  "Otro",
];

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  const raw = String(dateString).split("T")[0].split(" ")[0];
  const parts = raw.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
}

function parseToIso(dateStr) {
  if (!dateStr) return getTodayIso();
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return String(dateStr).split("T")[0].split(" ")[0];
}

// Subcomponente modal aislado para creación y edición
function NonConformityModal({
  isOpen,
  onClose,
  onSave,
  editingNc,
  defaultReporter,
}) {
  const [form, setForm] = useState(() => ({
    title: editingNc?.title || "",
    description: editingNc?.description || "",
    severity: editingNc?.severity || "moderada",
    status: editingNc?.status || "abierta",
    origin: editingNc?.origin || "Producción",
    reporter: editingNc?.reporter || defaultReporter || "Responsable",
    correctiveAction: editingNc?.correctiveAction || "",
    date: editingNc ? parseToIso(editingNc.date) : getTodayIso(),
  }));

  const [isSevMenuOpen, setIsSevMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isOriginMenuOpen, setIsOriginMenuOpen] = useState(false);

  const sevMenuRef = useRef(null);
  const statusMenuRef = useRef(null);
  const originMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sevMenuRef.current && !sevMenuRef.current.contains(e.target)) {
        setIsSevMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
      if (originMenuRef.current && !originMenuRef.current.contains(e.target)) {
        setIsOriginMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentSevOption =
    SEVERITY_OPTIONS.find((s) => s.value === form.severity) || SEVERITY_OPTIONS[1];
  const currentStatusOption =
    STATUS_OPTIONS.find((s) => s.value === form.status) || STATUS_OPTIONS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editingNc ? "Editar no conformidad" : "Nueva no conformidad"}
          </h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Título <span className={styles.reqStar}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Dimensión fuera de tolerancia"
              className={styles.formInput}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalle de la no conformidad observada..."
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup} ref={sevMenuRef}>
              <label className={styles.formLabel}>Severidad</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isSevMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsSevMenuOpen(!isSevMenuOpen)}
              >
                <span>{currentSevOption.label}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isSevMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.severity === opt.value
                          ? styles.customDropdownOptionSelected
                          : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, severity: opt.value });
                        setIsSevMenuOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {form.severity === opt.value && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup} ref={statusMenuRef}>
              <label className={styles.formLabel}>Estado</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isStatusMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              >
                <span>{currentStatusOption.label}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isStatusMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.status === opt.value
                          ? styles.customDropdownOptionSelected
                          : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, status: opt.value });
                        setIsStatusMenuOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {form.status === opt.value && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup} ref={originMenuRef}>
              <label className={styles.formLabel}>Origen</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isOriginMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsOriginMenuOpen(!isOriginMenuOpen)}
              >
                <span>{form.origin}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isOriginMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  {ORIGIN_OPTIONS.map((orig) => (
                    <button
                      key={orig}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.origin === orig
                          ? styles.customDropdownOptionSelected
                          : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, origin: orig });
                        setIsOriginMenuOpen(false);
                      }}
                    >
                      <span>{orig}</span>
                      {form.origin === orig && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Responsable</label>
              <input
                type="text"
                placeholder="Nombre del responsable"
                className={styles.formInput}
                value={form.reporter}
                onChange={(e) =>
                  setForm({ ...form, reporter: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Acción correctiva</label>
            <textarea
              rows={2}
              placeholder="Acción inmediata o correctiva definida..."
              className={styles.formTextarea}
              value={form.correctiveAction}
              onChange={(e) =>
                setForm({ ...form, correctiveAction: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Fecha de detección</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NonConformitiesTab({ otId, ot }) {
  const params = useParams();
  const currentOtId =
    otId ||
    ot?.id_ot ||
    ot?.id ||
    params.id ||
    params.idOt ||
    params.numero;

  const [ncList, setNcList] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNc, setEditingNc] = useState(null);

  const loadNcList = useCallback(async () => {
    if (!currentOtId) {
      setNcList([]);
      return;
    }
    try {
      if (typeof api.getNoConformidadesOrden === "function") {
        const res = await api.getNoConformidadesOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          const mapped = res.data.map((item) => ({
            id: item.id_falla || item.id_nc || item.id,
            title: item.titulo || item.title || "Desvío sin título",
            description: item.descripcion || item.description || "",
            severity: (item.severidad || item.severity || "moderada").toLowerCase(),
            status: (item.estado_resolucion || item.estado || item.status || "abierta").toLowerCase(),
            origin: item.tipo_falla || item.origen || item.origin || "Producción",
            reporter: item.responsable || item.reporter || "Operario",
            correctiveAction: item.accion_correctiva || item.correctiveAction || null,
            date: formatDateDisplay(item.fecha_reporte || item.fecha_deteccion || item.date),
          }));
          setNcList(mapped);
          return;
        }
      }
      setNcList([]);
    } catch (err) {
      console.error("[NonConformitiesTab] Error al cargar no conformidades:", err);
      setNcList([]);
    }
  }, [currentOtId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchNcs() {
      if (isMounted) await loadNcList();
    }
    fetchNcs();
    return () => {
      isMounted = false;
    };
  }, [loadNcList]);

  const handleOpenCreateModal = () => {
    setEditingNc(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (nc) => {
    setEditingNc(nc);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    const payloadBackend = {
      titulo: formData.title.trim(),
      descripcion: formData.description.trim(),
      severidad: formData.severity,
      estado: formData.status,
      estado_resolucion: formData.status,
      origen: formData.origin,
      tipo_falla: formData.origin,
      responsable: formData.reporter.trim() || "Responsable",
      accion_correctiva: formData.correctiveAction.trim() || null,
      fecha_reporte: formData.date,
    };

    try {
      if (editingNc) {
        if (typeof api.actualizarNoConformidad === "function") {
          await api.actualizarNoConformidad(editingNc.id, payloadBackend);
        }
      } else {
        if (typeof api.crearNoConformidadOrden === "function") {
          await api.crearNoConformidadOrden(currentOtId, payloadBackend);
        }
      }
      await loadNcList();
      setIsModalOpen(false);
    } catch (err) {
      console.error("[NonConformitiesTab] Error al guardar no conformidad:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (typeof api.eliminarNoConformidad === "function") {
        await api.eliminarNoConformidad(toDelete.id);
      }
      setNcList((prev) => prev.filter((item) => item.id !== toDelete.id));
    } catch (err) {
      console.error("[NonConformitiesTab] Error al eliminar no conformidad:", err);
    } finally {
      setToDelete(null);
    }
  };

  const openCount = ncList.filter((nc) => nc.status === "abierta").length;

  const renderSeverityBadge = (sev) => {
    if (sev === "leve") {
      return (
        <span className={`${styles.badge} ${styles.sevLeve}`}>
          <span className={styles.badgeDot} /> Leve
        </span>
      );
    }
    if (sev === "critica") {
      return (
        <span className={`${styles.badge} ${styles.sevCritica}`}>
          <span className={styles.badgeDot} /> Crítica
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.sevModerada}`}>
        <span className={styles.badgeDot} /> Moderada
      </span>
    );
  };

  const renderStatusBadge = (st) => {
    if (st === "corregida") {
      return (
        <span className={`${styles.badge} ${styles.statusCorregida}`}>
          <span className={styles.badgeDot} /> Corregida
        </span>
      );
    }
    if (st === "en_analisis") {
      return (
        <span className={`${styles.badge} ${styles.statusEnAnalisis}`}>
          <span className={styles.badgeDot} /> En Análisis
        </span>
      );
    }
    if (st === "cerrada") {
      return (
        <span className={`${styles.badge} ${styles.statusCerrada}`}>
          <span className={styles.badgeDot} /> Cerrada
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.statusAbierta}`}>
        <span className={styles.badgeDot} /> Abierta
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>No Conformidades</h3>
          <p className={styles.subtitle}>
            {ncList.length} registradas · {openCount} abiertas
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={styles.btnAddNC}
        >
          <Plus size={15} strokeWidth={2.5} /> No conformidad
        </button>
      </div>

      {ncList.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin no conformidades</h4>
          <p className={styles.emptySubtitle}>
            Registra desvíos, errores de producción o reclamos vinculados a esta
            OT.
          </p>
        </div>
      ) : (
        <div className={styles.ncList}>
          {ncList.map((item) => (
            <div key={item.id} className={styles.ncCard}>
              <div className={styles.alertIconBox}>
                <AlertTriangle size={18} strokeWidth={2.2} />
              </div>

              <div className={styles.ncInfo}>
                <div className={styles.headerLine}>
                  <div className={styles.headerLeftTags}>
                    <p className={styles.ncTitle}>{item.title}</p>
                    {renderSeverityBadge(item.severity)}
                    {renderStatusBadge(item.status)}
                    {item.origin && (
                      <span className={styles.originChip}>{item.origin}</span>
                    )}
                  </div>

                  <span className={styles.metaReporter}>
                    {item.date} · {item.reporter}
                  </span>
                </div>

                {item.description && (
                  <p className={styles.descriptionText}>{item.description}</p>
                )}

                {item.correctiveAction && (
                  <div className={styles.correctiveActionBox}>
                    <strong>Acción correctiva:</strong> {item.correctiveAction}
                  </div>
                )}
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className={styles.btnRowAction}
                  title="Editar no conformidad"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(item)}
                  className={`${styles.btnRowAction} ${styles.btnRowDelete}`}
                  title="Eliminar no conformidad"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar montado con key */}
      <NonConformityModal
        key={editingNc ? editingNc.id : "create-nc"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingNc={editingNc}
        defaultReporter={ot?.responsable || ""}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar no conformidad"
        description={
          toDelete ? (
            <>
              ¿Eliminar el registro <strong>"{toDelete.title}"</strong>? Esta
              acción no se puede deshacer.
            </>
          ) : (
            ""
          )
        }
      />
    </div>
  );
}