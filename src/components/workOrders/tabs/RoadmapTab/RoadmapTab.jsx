import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  GripVertical,
  Clock,
  User,
  ChevronDown,
  Check,
  Inbox,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../../../common/ConfirmDialog/ConfirmDialog";
import { api } from "../../../../api/apiClient";
import styles from "./RoadmapTab.module.css";

const OP_STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En Proceso" },
  { value: "completada", label: "Completada" },
  { value: "rechazada", label: "Rechazada" },
];

const OP_TYPES = [
  "Torneado",
  "Fresado",
  "Rectificado",
  "Taladrado",
  "Soldadura",
  "Tratamiento Térmico",
  "Montaje",
  "Control",
  "Otro",
];

// Subcomponente desacoplado para el formulario modal
function RoadmapOpModal({
  isOpen,
  onClose,
  onSave,
  editingOp,
  defaultSeq,
  defaultOperator,
}) {
  const [form, setForm] = useState(() => ({
    secuencia: editingOp ? editingOp.step || 10 : defaultSeq,
    name: editingOp?.name || "",
    type: editingOp?.type || "Torneado",
    status: editingOp?.status || "pendiente",
    operator: editingOp ? (editingOp.operator === "—" ? "" : editingOp.operator || "") : defaultOperator || "",
    machine: editingOp ? (editingOp.machine === "—" ? "" : editingOp.machine || "") : "Torno CNC",
    estimatedTime: editingOp?.estimatedTime || 45,
    realTime: editingOp?.realTime || 0,
    description: editingOp?.description || "",
  }));

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const typeMenuRef = useRef(null);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) {
        setIsTypeMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentModalStatus =
    OP_STATUS_OPTIONS.find((s) => s.value === form.status) || OP_STATUS_OPTIONS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
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
            {editingOp ? "Editar operación" : "Nueva operación"}
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
          <div className={styles.formRowSecuencia}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Secuencia</label>
              <input
                type="number"
                min="1"
                className={styles.formInput}
                value={form.secuencia}
                onChange={(e) =>
                  setForm({ ...form, secuencia: Number(e.target.value) })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Nombre <span className={styles.reqStar}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Torneado exterior"
                className={styles.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup} ref={typeMenuRef}>
              <label className={styles.formLabel}>Tipo</label>
              <button
                type="button"
                className={`${styles.customModalTrigger} ${
                  isTypeMenuOpen ? styles.customModalTriggerActive : ""
                }`}
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
              >
                <span>{form.type}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isTypeMenuOpen && (
                <div className={styles.customModalMenu}>
                  {OP_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.customModalOption} ${
                        form.type === t ? styles.customModalOptionSelected : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, type: t });
                        setIsTypeMenuOpen(false);
                      }}
                    >
                      <span>{t}</span>
                      {form.type === t && <Check size={14} className={styles.checkIcon} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formGroup} ref={statusMenuRef}>
              <label className={styles.formLabel}>Estado</label>
              <button
                type="button"
                className={`${styles.customModalTrigger} ${
                  isStatusMenuOpen ? styles.customModalTriggerActive : ""
                }`}
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              >
                <span>{currentModalStatus.label}</span>
                <ChevronDown size={14} className={styles.chevronIcon} />
              </button>

              {isStatusMenuOpen && (
                <div className={styles.customModalMenu}>
                  {OP_STATUS_OPTIONS.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      className={`${styles.customModalOption} ${
                        form.status === st.value
                          ? styles.customModalOptionSelected
                          : ""
                      }`}
                      onClick={() => {
                        setForm({ ...form, status: st.value });
                        setIsStatusMenuOpen(false);
                      }}
                    >
                      <span>{st.label}</span>
                      {form.status === st.value && (
                        <Check size={14} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Operario</label>
              <input
                type="text"
                placeholder="Nombre del operario"
                className={styles.formInput}
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Máquina</label>
              <input
                type="text"
                placeholder="Ej. Torno CNC"
                className={styles.formInput}
                value={form.machine}
                onChange={(e) => setForm({ ...form, machine: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tiempo estimado (min)</label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.estimatedTime}
                onChange={(e) =>
                  setForm({ ...form, estimatedTime: Number(e.target.value) })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tiempo real (min)</label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.realTime}
                onChange={(e) =>
                  setForm({ ...form, realTime: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalle o parámetros de la operación..."
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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

export default function RoadmapTab({
  otId,
  ot,
  operations: initialOperations = [],
  onOpStatusChange,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
}) {
  const { id } = useParams();
  const currentOtId = id || otId || ot?.id_ot || ot?.id;

  const [opsList, setOpsList] = useState(initialOperations);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Cargar operaciones desde la BD
  const loadOperations = useCallback(async () => {
    if (!currentOtId) {
      setOpsList([]);
      return;
    }
    try {
      if (typeof api.getOperacionesOrden === "function") {
        const res = await api.getOperacionesOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          const mapped = res.data.map((item, index) => ({
            id: item.id_operacion || item.id,
            step: item.secuencia || (index + 1) * 10,
            name: item.descripcion_tarea || item.nombre || "Operación",
            type: item.tipo || "Torneado",
            operator: item.operario_asignado || item.operario || "—",
            time: item.tiempo_estimado ? `${item.tiempo_estimado} min` : "—",
            machine: item.maquina || "Taller General",
            status: item.estado || "pendiente",
            description: item.descripcion_tarea || item.descripcion || "",
            estimatedTime: item.tiempo_estimado || 0,
            realTime: item.tiempo_real || 0,
          }));
          setOpsList(mapped);
          return;
        }
      }
      setOpsList([]);
    } catch (err) {
      console.error("[RoadmapTab] Error al cargar operaciones:", err);
      setOpsList([]);
    }
  }, [currentOtId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchOps() {
      if (isMounted) await loadOperations();
    }
    fetchOps();
    return () => {
      isMounted = false;
    };
  }, [loadOperations]);

  const completedOps = opsList.filter((o) => o.status === "completada").length;
  const progressPercent =
    opsList.length > 0 ? Math.round((completedOps / opsList.length) * 100) : 0;

  const calculateNextSeq = () => {
    if (opsList.length === 0) return 10;
    const lastOp = opsList[opsList.length - 1];
    return (Number(lastOp.step) || opsList.length * 10) + 10;
  };

  const handleOpenCreateModal = () => {
    setEditingOp(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (op) => {
    setEditingOp(op);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData) => {
    const payloadBackend = {
      nombre: formData.name.trim(),
      operario: formData.operator.trim() || ot?.responsable || "",
      estado: formData.status,
      secuencia: Number(formData.secuencia) || 10,
      tipo: formData.type,
      maquina: formData.machine.trim(),
      tiempo_estimado: Number(formData.estimatedTime) || 0,
      tiempo_real: Number(formData.realTime) || 0,
      descripcion: formData.description.trim(),
    };

    try {
      if (editingOp) {
        if (typeof api.actualizarOperacionOrden === "function") {
          await api.actualizarOperacionOrden(editingOp.id, payloadBackend);
          await loadOperations();
        } else if (onUpdateOperation) {
          onUpdateOperation(editingOp.id, {
            step: payloadBackend.secuencia,
            name: payloadBackend.nombre,
            type: payloadBackend.tipo,
            operator: payloadBackend.operario || "—",
            machine: payloadBackend.maquina || "—",
            status: payloadBackend.estado,
            description: payloadBackend.descripcion,
          });
        }
      } else {
        if (typeof api.crearOperacionOrden === "function") {
          await api.crearOperacionOrden(currentOtId, payloadBackend);
          await loadOperations();
        } else if (onAddOperation) {
          onAddOperation({
            id: Date.now(),
            step: payloadBackend.secuencia,
            name: payloadBackend.nombre,
            type: payloadBackend.tipo,
            operator: payloadBackend.operario || "—",
            time: payloadBackend.tiempo_estimado ? `${payloadBackend.tiempo_estimado} min` : "—",
            machine: payloadBackend.maquina || "—",
            status: payloadBackend.estado,
          });
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("[RoadmapTab] Error al guardar operación:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (typeof api.eliminarOperacionOrden === "function") {
        await api.eliminarOperacionOrden(toDelete.id);
        await loadOperations();
      } else if (onDeleteOperation) {
        onDeleteOperation(toDelete.id);
      }
      setOpsList((prev) => prev.filter((o) => o.id !== toDelete.id));
    } catch (err) {
      console.error("[RoadmapTab] Error al eliminar operación:", err);
    } finally {
      setToDelete(null);
    }
  };

  const handleStatusChangeLocal = async (opId, newStatus) => {
    setOpsList((prev) =>
      prev.map((o) => (o.id === opId ? { ...o, status: newStatus } : o))
    );
    setOpenMenuId(null);

    try {
      if (typeof api.actualizarEstadoOperacion === "function") {
        await api.actualizarEstadoOperacion(opId, newStatus);
      }
      if (onOpStatusChange) {
        onOpStatusChange(opId, newStatus);
      }
    } catch (err) {
      console.error("[RoadmapTab] Error al actualizar estado de la operación:", err);
      loadOperations();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabHeaderRow}>
        <div>
          <h3 className={styles.tabMainTitle}>Hoja de Ruta</h3>
          <p className={styles.tabProgressSub}>
            {opsList.length} operaciones · {completedOps} completadas · {progressPercent}%
          </p>
        </div>
        <button
          type="button"
          className={styles.btnAddOp}
          onClick={handleOpenCreateModal}
        >
          <Plus size={15} strokeWidth={2.5} /> Operación
        </button>
      </div>

      {opsList.length === 0 ? (
        <div className={styles.emptyRoadmapBox}>
          <div className={styles.emptyRoadmapIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyRoadmapTitle}>Sin operaciones</h4>
          <p className={styles.emptyRoadmapDesc}>
            Agrega las operaciones de la hoja de ruta para esta OT.
          </p>
        </div>
      ) : (
        <div className={styles.opsList}>
          {opsList.map((op) => {
            const currentOption =
              OP_STATUS_OPTIONS.find((o) => o.value === op.status) || OP_STATUS_OPTIONS[0];

            return (
              <div key={op.id} className={styles.opRow}>
                <div className={styles.opLeft}>
                  <GripVertical size={16} className={styles.dragHandle} />
                  <div className={styles.opBadgeNumber}>{op.step}</div>
                  <div className={styles.opInfo}>
                    <div className={styles.opNameLine}>
                      <p className={styles.opName}>{op.name}</p>
                      <span className={styles.typeBadge}>{op.type}</span>
                    </div>
                    <div className={styles.opSubline}>
                      <span className={styles.opSubItem}>
                        <User size={13} /> {op.operator}
                      </span>
                      <span className={styles.opSubItem}>
                        <Clock size={13} /> {op.time}
                      </span>
                      <span>{op.machine}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.opRightActions}>
                  <div className={styles.customSelectWrapper}>
                    <button
                      type="button"
                      className={styles.customTriggerBtn}
                      onClick={() => setOpenMenuId(openMenuId === op.id ? null : op.id)}
                    >
                      <span>{currentOption.label}</span>
                      <ChevronDown size={14} className={styles.chevronIcon} />
                    </button>

                    {openMenuId === op.id && (
                      <div className={styles.customDropdownMenu}>
                        {OP_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`${styles.customOptionItem} ${
                              op.status === opt.value ? styles.customOptionSelected : ""
                            }`}
                            onClick={() => handleStatusChangeLocal(op.id, opt.value)}
                          >
                            <span>{opt.label}</span>
                            {op.status === opt.value && (
                              <Check size={14} className={styles.checkIcon} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(op)}
                      className={styles.btnRowAction}
                      title="Editar operación"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(op)}
                      className={`${styles.btnRowAction} ${styles.btnRowDelete}`}
                      title="Eliminar operación"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva / Editar Operación montado por key */}
      <RoadmapOpModal
        key={editingOp ? editingOp.id : `create-${calculateNextSeq()}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingOp={editingOp}
        defaultSeq={calculateNextSeq()}
        defaultOperator={ot?.responsable || ""}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar operación"
        description={
          toDelete ? (
            <>
              ¿Eliminar la operación <strong>"{toDelete.name}"</strong>? Esta acción no se puede deshacer.
            </>
          ) : (
            ""
          )
        }
      />
    </div>
  );
}