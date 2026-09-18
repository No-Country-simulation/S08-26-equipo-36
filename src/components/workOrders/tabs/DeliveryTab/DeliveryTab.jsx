import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Truck,
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
import styles from "./DeliveryTab.module.css";

const STATUS_OPTIONS = [
  { value: "programada", label: "Programada" },
  { value: "parcial", label: "Parcial" },
  { value: "completa", label: "Completa" },
  { value: "rechazada", label: "Rechazada" },
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
  return String(dateStr).split("T")[0];
}

// Subcomponente modal aislado para creación y edición
function DeliveryModal({
  isOpen,
  onClose,
  onSave,
  editingDelivery,
  defaultQuantity,
}) {
  const [form, setForm] = useState(() => ({
    date: editingDelivery ? parseToIso(editingDelivery.date) : getTodayIso(),
    quantity: editingDelivery ? editingDelivery.quantity ?? 0 : defaultQuantity || 1,
    remito: editingDelivery
      ? editingDelivery.remito === "Pendiente de generar" ? "" : editingDelivery.remito || ""
      : "",
    status: editingDelivery?.status || "programada",
    receiver: editingDelivery?.receiver || "",
    notes: editingDelivery?.notes || "",
  }));

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentStatusOption =
    STATUS_OPTIONS.find((s) => s.value === form.status) || STATUS_OPTIONS[0];

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
            {editingDelivery ? "Editar entrega" : "Nueva entrega"}
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
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha</label>
              <input
                type="date"
                className={styles.formInput}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cantidad entregada</label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.formRow2Col}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Remito / Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. R-0001-00004523"
                className={styles.formInput}
                value={form.remito}
                onChange={(e) =>
                  setForm({ ...form, remito: e.target.value })
                }
              />
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Recibido por</label>
            <input
              type="text"
              placeholder="Nombre de quien recibe la entrega"
              className={styles.formInput}
              value={form.receiver}
              onChange={(e) =>
                setForm({ ...form, receiver: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Observaciones</label>
            <textarea
              rows={2}
              placeholder="Notas de transporte, recepción o desvíos..."
              className={styles.formTextarea}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

export default function DeliveryTab({ otId, ot }) {
  const params = useParams();
  const currentOtId =
    otId ||
    ot?.id_ot ||
    ot?.id ||
    params.id ||
    params.idOt ||
    params.numero;

  const [deliveries, setDeliveries] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);

  const loadDeliveries = useCallback(async () => {
    if (!currentOtId) {
      setDeliveries([]);
      return;
    }
    try {
      if (typeof api.getEntregasOrden === "function") {
        const res = await api.getEntregasOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          const mapped = res.data.map((item) => ({
            id: item.id_entrega || item.id,
            date: formatDateDisplay(item.fecha),
            quantity: item.cantidad_entregada ?? item.cantidad,
            status: item.estado || "programada",
            remito: item.remito || "Pendiente de generar",
            client:
              item.cliente_nombre ||
              ot?.cliente_nombre ||
              ot?.cliente ||
              "—",
            receiver: item.recibido_por || "—",
            notes: item.observaciones || "",
          }));
          setDeliveries(mapped);
          return;
        }
      }
      setDeliveries([]);
    } catch (err) {
      console.error("[DeliveryTab] Error al cargar entregas:", err);
      setDeliveries([]);
    }
  }, [currentOtId, ot?.cliente_nombre, ot?.cliente]);

  useEffect(() => {
    let isMounted = true;
    async function fetchEntregas() {
      if (isMounted) await loadDeliveries();
    }
    fetchEntregas();
    return () => {
      isMounted = false;
    };
  }, [loadDeliveries]);

  const handleOpenCreateModal = () => {
    setEditingDelivery(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (del) => {
    setEditingDelivery(del);
    setIsModalOpen(true);
  };

  const handleSubmitSave = async (formData) => {
    const payloadBackend = {
      fecha: formData.date,
      cantidad: Number(formData.quantity) || 0,
      remito: formData.remito.trim() || "Pendiente de generar",
      estado: formData.status,
      cliente_nombre: ot?.cliente_nombre || ot?.cliente || "",
      recibido_por: formData.receiver.trim() || "",
      observaciones: formData.notes.trim() || null,
    };

    try {
      if (editingDelivery) {
        if (typeof api.actualizarEntrega === "function") {
          await api.actualizarEntrega(editingDelivery.id, payloadBackend);
        }
      } else {
        if (typeof api.crearEntregaOrden === "function") {
          await api.crearEntregaOrden(currentOtId, payloadBackend);
        }
      }
      await loadDeliveries();
      setIsModalOpen(false);
    } catch (err) {
      console.error("[DeliveryTab] Error al guardar entrega:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (typeof api.eliminarEntrega === "function") {
        await api.eliminarEntrega(toDelete.id);
      }
      setDeliveries((prev) => prev.filter((item) => item.id !== toDelete.id));
    } catch (err) {
      console.error("[DeliveryTab] Error al eliminar entrega:", err);
    } finally {
      setToDelete(null);
    }
  };

  const completedCount = deliveries.filter(
    (d) => d.status === "completa"
  ).length;

  const renderBadge = (status) => {
    if (status === "completa") {
      return (
        <span className={`${styles.badge} ${styles.badgeCompleta}`}>
          <span className={styles.badgeDot} /> Completa
        </span>
      );
    }
    if (status === "parcial") {
      return (
        <span className={`${styles.badge} ${styles.badgeParcial}`}>
          <span className={styles.badgeDot} /> Parcial
        </span>
      );
    }
    if (status === "rechazada") {
      return (
        <span className={`${styles.badge} ${styles.badgeRechazada}`}>
          <span className={styles.badgeDot} /> Rechazada
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.badgeProgramada}`}>
        <span className={styles.badgeDot} /> Programada
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Entregas</h3>
          <p className={styles.subtitle}>
            {deliveries.length} registros · {completedCount} completas
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={styles.btnAddDelivery}
        >
          <Plus size={15} strokeWidth={2.5} /> Entrega
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin entregas</h4>
          <p className={styles.emptySubtitle}>
            Registra la entrega de la pieza al cliente, con remito y cantidades.
          </p>
        </div>
      ) : (
        <div className={styles.deliveryList}>
          {deliveries.map((item) => (
            <div key={item.id} className={styles.deliveryCard}>
              <div className={styles.truckIconBox}>
                <Truck size={18} strokeWidth={2} />
              </div>

              <div className={styles.deliveryInfo}>
                <div className={styles.headerLine}>
                  <p className={styles.deliveryDate}>{item.date}</p>
                  {renderBadge(item.status)}
                  <span className={styles.remitoText}>
                    Remito: <strong>{item.remito}</strong>
                  </span>
                </div>

                <p className={styles.clientText}>{item.client}</p>

                {item.notes && <p className={styles.notesText}>{item.notes}</p>}
              </div>

              <div className={styles.deliveryRightMeta}>
                <span className={styles.qtyTag}>{item.quantity ?? 0} u.</span>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className={styles.btnRowAction}
                    title="Editar entrega"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(item)}
                    className={`${styles.btnRowAction} ${styles.btnRowDelete}`}
                    title="Eliminar entrega"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar montado con key */}
      <DeliveryModal
        key={editingDelivery ? editingDelivery.id : "create-delivery"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSubmitSave}
        editingDelivery={editingDelivery}
        defaultQuantity={Number(ot?.cantidad) || 1}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar entrega"
        description="¿Eliminar este registro de entrega? Esta acción no se puede deshacer."
      />
    </div>
  );
}