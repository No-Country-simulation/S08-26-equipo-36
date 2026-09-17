import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./RequestModal.module.css";

const PRIORIDADES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

function getTodayString() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const emptyForm = {
  id_cliente: "",
  fecha: getTodayString(),
  pieza: "",
  descripcion: "",
  especificaciones: "",
  cantidad: 1,
  material: "",
  prioridad: "media",
};

function normalizeData(data) {
  if (!data) return emptyForm;
  return {
    id_cliente: String(data.id_cliente || data.client_id || data.cliente_id || ""),
    fecha: data.fecha || data.date || getTodayString(),
    pieza: data.pieza || data.piece || "",
    descripcion: data.descripcion || data.description || "",
    especificaciones: data.especificaciones || data.specifications || "",
    cantidad: Number(data.cantidad || data.quantity) || 1,
    material: data.material || "",
    prioridad: (data.prioridad || data.priority || "media").toLowerCase(),
  };
}

// Subcomponente de formulario montado con key para evitar efectos y re-renders en cascada
function RequestFormContent({ initialData, clients, onSave, onClose }) {
  const [form, setForm] = useState(() => normalizeData(initialData));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_cliente || !form.pieza.trim()) {
      return;
    }

    try {
      setSaving(true);
      const selectedClient = clients.find(
        (c) => String(c.id) === String(form.id_cliente)
      );

      await onSave({
        ...form,
        cliente_nombre: selectedClient
          ? selectedClient.nombre || selectedClient.razon_social
          : "",
        cantidad: Number(form.cantidad) || 1,
      });

      onClose();
    } catch (err) {
      console.error("[RequestModal] Error al guardar solicitud:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.modal}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          {initialData ? "Editar solicitud" : "Nueva solicitud"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Cliente */}
        <div className={styles.field}>
          <label className={styles.label}>
            Cliente <span className={styles.req}>*</span>
          </label>
          <select
            required
            className={styles.select}
            value={form.id_cliente}
            onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre || c.razon_social}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y Cantidad */}
        <div className={styles.rowTwo}>
          <div className={styles.field}>
            <label className={styles.label}>
              Fecha <span className={styles.req}>*</span>
            </label>
            <input
              type="date"
              required
              className={styles.input}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Cantidad</label>
            <input
              type="number"
              min="1"
              className={styles.input}
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            />
          </div>
        </div>

        {/* Pieza */}
        <div className={styles.field}>
          <label className={styles.label}>
            Pieza <span className={styles.req}>*</span>
          </label>
          <input
            required
            className={styles.input}
            placeholder="Nombre o plano de la pieza"
            value={form.pieza}
            onChange={(e) => setForm({ ...form, pieza: e.target.value })}
          />
        </div>

        {/* Material y Prioridad */}
        <div className={styles.rowTwo}>
          <div className={styles.field}>
            <label className={styles.label}>Material</label>
            <input
              className={styles.input}
              placeholder="Ej. Acero SAE 1045"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Prioridad</label>
            <select
              className={styles.select}
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea
            rows={2}
            className={styles.textarea}
            placeholder="Descripción funcional de la pieza..."
            value={form.descripcion}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
          />
        </div>

        {/* Especificaciones */}
        <div className={styles.field}>
          <label className={styles.label}>Especificaciones técnicas</label>
          <textarea
            rows={3}
            className={styles.textarea}
            placeholder="Material, tolerancias, normas..."
            value={form.especificaciones}
            onChange={(e) =>
              setForm({ ...form, especificaciones: e.target.value })
            }
          />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className={styles.btnSubmit}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RequestModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  clients = [],
}) {
  // Manejo de tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <RequestFormContent
        key={initialData ? initialData.id : "new-request"}
        initialData={initialData}
        clients={clients}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
}