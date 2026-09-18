import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Shield,
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
import styles from "./QualityTab.module.css";

const CONTROL_TYPES = [
  "Dimensional",
  "Superficial",
  "Visual",
  "Dureza",
  "Final",
];

const RESULT_OPTIONS = [
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
  { value: "retrabajo", label: "Retrabajo" },
];

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  const parts = String(dateString).split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
}

function parseToIso(dateStr) {
  if (!dateStr) return getTodayIso();
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr.split("T")[0];
}

// Subcomponente modal aislado para creación y edición
function QualityControlModal({
  isOpen,
  onClose,
  onSave,
  editingControl,
  dbOperations,
  defaultInspector,
}) {
  const matchedOp = dbOperations.find((o) => o.id === editingControl?.operacionId);

  const [form, setForm] = useState(() => ({
    type: editingControl?.type || "Dimensional",
    resultado: editingControl?.status || "aprobado",
    operacionId: editingControl?.operacionId || null,
    operacionLabel: matchedOp ? matchedOp.label : editingControl?.operacion || "Ninguna",
    inspector: editingControl?.inspector || defaultInspector || "Inspector de Calidad",
    medicion: editingControl?.medicion || "",
    tolerancia: editingControl?.tolerancia || "",
    observaciones: editingControl?.observaciones || "",
    fecha: editingControl ? parseToIso(editingControl.fecha) : getTodayIso(),
  }));

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isResultMenuOpen, setIsResultMenuOpen] = useState(false);
  const [isOpMenuOpen, setIsOpMenuOpen] = useState(false);

  const typeMenuRef = useRef(null);
  const resultMenuRef = useRef(null);
  const opMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) {
        setIsTypeMenuOpen(false);
      }
      if (resultMenuRef.current && !resultMenuRef.current.contains(e.target)) {
        setIsResultMenuOpen(false);
      }
      if (opMenuRef.current && !opMenuRef.current.contains(e.target)) {
        setIsOpMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentResultOption =
    RESULT_OPTIONS.find((r) => r.value === form.resultado) || RESULT_OPTIONS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
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
            {editingControl ? "Editar control de calidad" : "Nuevo control de calidad"}
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
          <div className={styles.formRow2Col}>
            <div className={styles.formGroup} ref={typeMenuRef}>
              <label className={styles.formLabel}>Tipo</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isTypeMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
              >
                <span>{form.type}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isTypeMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  {CONTROL_TYPES.map((typeOption) => (
                    <button
                      key={typeOption}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.type === typeOption ? styles.customDropdownOptionSelected : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, type: typeOption });
                        setIsTypeMenuOpen(false);
                      }}
                    >
                      <span>{typeOption}</span>
                      {form.type === typeOption && <Check size={14} className={styles.checkIcon} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup} ref={resultMenuRef}>
              <label className={styles.formLabel}>Resultado</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isResultMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsResultMenuOpen(!isResultMenuOpen)}
              >
                <span>{currentResultOption.label}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isResultMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  {RESULT_OPTIONS.map((resOption) => (
                    <button
                      key={resOption.value}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.resultado === resOption.value ? styles.customDropdownOptionSelected : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, resultado: resOption.value });
                        setIsResultMenuOpen(false);
                      }}
                    >
                      <span>{resOption.label}</span>
                      {form.resultado === resOption.value && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup} ref={opMenuRef}>
              <label className={styles.formLabel}>Operación asociada</label>
              <button
                type="button"
                className={`${styles.customTrigger} ${
                  isOpMenuOpen ? styles.customTriggerActive : ""
                }`}
                onClick={() => setIsOpMenuOpen(!isOpMenuOpen)}
              >
                <span className={styles.selectLabelText}>
                  {form.operacionLabel}
                </span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isOpMenuOpen && (
                <div className={styles.customDropdownMenu}>
                  <button
                    type="button"
                    className={`${styles.customDropdownOption} ${
                      form.operacionId === null ? styles.customDropdownOptionSelected : ""
                    }`}
                    onClick={() => {
                      setForm({
                        ...form,
                        operacionId: null,
                        operacionLabel: "Ninguna",
                      });
                      setIsOpMenuOpen(false);
                    }}
                  >
                    <span>Ninguna</span>
                    {form.operacionId === null && <Check size={14} className={styles.checkIcon} />}
                  </button>

                  {dbOperations.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      className={`${styles.customDropdownOption} ${
                        form.operacionId === op.id ? styles.customDropdownOptionSelected : ""
                      }`}
                      onClick={() => {
                        setForm({
                          ...form,
                          operacionId: op.id,
                          operacionLabel: op.label,
                        });
                        setIsOpMenuOpen(false);
                      }}
                    >
                      <span>{op.label}</span>
                      {form.operacionId === op.id && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Inspector</label>
              <input
                type="text"
                placeholder="Nombre del inspector"
                className={styles.formInput}
                value={form.inspector}
                onChange={(e) => setForm({ ...form, inspector: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Medición</label>
              <input
                type="text"
                placeholder="Ej. Ø 50.02 mm"
                className={styles.formInput}
                value={form.medicion}
                onChange={(e) => setForm({ ...form, medicion: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tolerancia</label>
              <input
                type="text"
                placeholder="Ej. ±0.05 mm"
                className={styles.formInput}
                value={form.tolerancia}
                onChange={(e) => setForm({ ...form, tolerancia: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Observaciones</label>
            <textarea
              rows={2}
              placeholder="Desviaciones observadas, condiciones o notas..."
              className={styles.formTextarea}
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Fecha</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
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

export default function QualityTab({ otId, ot }) {
  const { id } = useParams();
  const currentOtId = id || otId || ot?.id_ot || ot?.id;

  const [controls, setControls] = useState([]);
  const [dbOperations, setDbOperations] = useState([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const loadDbOperations = useCallback(async () => {
    if (!currentOtId) return;
    try {
      if (typeof api.getOperacionesOrden === "function") {
        const res = await api.getOperacionesOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          const ops = res.data.map((item, index) => ({
            id: item.id_operacion || item.id,
            step: item.secuencia || (index + 1) * 10,
            name: item.descripcion_tarea || item.nombre,
            label: `${item.secuencia || (index + 1) * 10}. ${item.descripcion_tarea || item.nombre}`,
          }));
          setDbOperations(ops);
        }
      }
    } catch (err) {
      console.error("[QualityTab] Error al cargar operaciones:", err);
    }
  }, [currentOtId]);

  const loadControls = useCallback(async () => {
    if (!currentOtId) {
      setControls([]);
      return;
    }
    try {
      if (typeof api.getControlesOrden === "function") {
        const res = await api.getControlesOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          setControls(
            res.data.map((c) => ({
              id: c.id_control || c.id,
              type: c.tipo
                ? c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)
                : "Dimensional",
              status: (c.resultado || "aprobado").toLowerCase(),
              operacionId: c.operacion_id,
              operacion: c.operacion_id ? `Operación ${c.operacion_id}` : null,
              medicion: c.medicion,
              tolerancia: c.tolerancia,
              observaciones: c.observaciones,
              fecha: formatDateDisplay(c.fecha),
              inspector: c.inspector || "Inspector de Calidad",
            }))
          );
          return;
        }
      }
      setControls([]);
    } catch (err) {
      console.error("[QualityTab] Error al cargar controles:", err);
      setControls([]);
    }
  }, [currentOtId]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      if (isMounted) {
        await loadControls();
        await loadDbOperations();
      }
    };
    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [loadControls, loadDbOperations]);

  const handleOpenCreateModal = () => {
    loadDbOperations();
    setEditingControl(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (control) => {
    loadDbOperations();
    setEditingControl(control);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    const payloadBackend = {
      tipo: formData.type.toLowerCase(),
      resultado: formData.resultado.toLowerCase(),
      operacion_id: formData.operacionId,
      medicion: formData.medicion.trim() || null,
      tolerancia: formData.tolerancia.trim() || null,
      observaciones: formData.observaciones.trim() || null,
      fecha: formData.fecha,
      inspector: formData.inspector.trim() || "Inspector de Calidad",
    };

    try {
      if (editingControl) {
        if (typeof api.actualizarControlOrden === "function") {
          await api.actualizarControlOrden(editingControl.id, payloadBackend);
        }
      } else {
        if (typeof api.crearControlOrden === "function") {
          await api.crearControlOrden(currentOtId, payloadBackend);
        }
      }
      await loadControls();
      setIsModalOpen(false);
    } catch (err) {
      console.error("[QualityTab] Error al guardar control:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (typeof api.eliminarControlOrden === "function") {
        await api.eliminarControlOrden(toDelete.id);
      }
      setControls((prev) => prev.filter((c) => c.id !== toDelete.id));
    } catch (err) {
      console.error("[QualityTab] Error al eliminar control:", err);
    } finally {
      setToDelete(null);
    }
  };

  const renderBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === "aprobado") {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeAprobado}`}>
          <span className={styles.badgeDot} /> Aprobado
        </span>
      );
    }
    if (s === "rechazado") {
      return (
        <span className={`${styles.statusBadge} ${styles.badgeRechazado}`}>
          <span className={styles.badgeDot} /> Rechazado
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.badgeRetrabajo}`}>
        <span className={styles.badgeDot} /> Retrabajo
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Controles de Calidad</h3>
          <p className={styles.subtitle}>
            {controls.length} controles registrados
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={styles.btnAddControl}
        >
          <Plus size={15} strokeWidth={2.5} /> Control
        </button>
      </div>

      {controls.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin controles de calidad</h4>
          <p className={styles.emptySubtitle}>
            Registra inspecciones dimensionales, superficiales y finales de la pieza.
          </p>
        </div>
      ) : (
        <div className={styles.controlsList}>
          {controls.map((item) => (
            <div key={item.id} className={styles.controlCard}>
              <div className={styles.iconShieldBox}>
                <Shield size={18} strokeWidth={2} />
              </div>

              <div className={styles.controlInfo}>
                <div className={styles.controlHeaderLine}>
                  <div className={styles.controlHeaderLeft}>
                    <p className={styles.controlTypeName}>{item.type}</p>
                    {renderBadge(item.status)}
                  </div>
                  <span className={styles.inspectorMeta}>
                    {item.fecha} · {item.inspector}
                  </span>
                </div>

                <div className={styles.metricsLine}>
                  {item.medicion && (
                    <span className={styles.metricItem}>
                      <span className={styles.metricLabel}>Medición:</span>
                      <span className={styles.metricValue}>{item.medicion}</span>
                    </span>
                  )}
                  {item.tolerancia && (
                    <span className={styles.metricItem}>
                      <span className={styles.metricLabel}>Tolerancia:</span>
                      <span className={styles.metricValue}>{item.tolerancia}</span>
                    </span>
                  )}
                </div>

                {item.observaciones && (
                  <p className={styles.notesText}>{item.observaciones}</p>
                )}
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className={styles.btnRowAction}
                  title="Editar control"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(item)}
                  className={`${styles.btnRowAction} ${styles.btnRowDelete}`}
                  title="Eliminar control"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar aislado por key */}
      <QualityControlModal
        key={editingControl ? editingControl.id : "create-control"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingControl={editingControl}
        dbOperations={dbOperations}
        defaultInspector={ot?.responsable || ""}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar control"
        description="¿Eliminar este control de calidad? Esta acción no se puede deshacer."
      />
    </div>
  );
}