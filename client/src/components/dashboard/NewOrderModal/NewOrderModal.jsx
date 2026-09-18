import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./NewOrderModal.module.css";

const PRIORIDADES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" }
];

const emptyForm = {
  cliente_id: "",
  pieza: "",
  cantidad: 1,
  material: "",
  prioridad: "media",
  fecha_entrega_estimada: "",
  responsable: "",
  descripcion: ""
};

export default function NewOrderModal({ isOpen, onClose, onSave, clientes = [] }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.cliente_id || !form.pieza.trim()) return;

    setSaving(true);
    const clienteSeleccionado = clientes.find((c) => String(c.id) === String(form.cliente_id));

    onSave({
      ...form,
      cliente_nombre: clienteSeleccionado ? clienteSeleccionado.nombre : "",
      cantidad: Number(form.cantidad) || 1
    });

    setSaving(false);
    setForm(emptyForm);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Nueva Orden de Trabajo</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Cliente */}
          <div className={styles.field}>
            <label className={styles.label}>
              Cliente <span className={styles.req}>*</span>
            </label>
            <select
              required
              className={styles.select}
              value={form.cliente_id}
              onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Pieza */}
          <div className={styles.field}>
            <label className={styles.label}>
              Pieza <span className={styles.req}>*</span>
            </label>
            <input
              required
              className={styles.input}
              placeholder="Nombre o descripción de la pieza"
              value={form.pieza}
              onChange={(e) => setForm({ ...form, pieza: e.target.value })}
            />
          </div>

          {/* Cantidad y Material */}
          <div className={styles.rowTwo}>
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
            <div className={styles.field}>
              <label className={styles.label}>Material</label>
              <input
                className={styles.input}
                placeholder="Ej. SAE 4140"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>
          </div>

          {/* Prioridad y Entrega Estimada */}
          <div className={styles.rowTwo}>
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
            <div className={styles.field}>
              <label className={styles.label}>Entrega Estimada</label>
              <input
                type="date"
                className={styles.input}
                value={form.fecha_entrega_estimada}
                onChange={(e) => setForm({ ...form, fecha_entrega_estimada: e.target.value })}
              />
            </div>
          </div>

          {/* Responsable */}
          <div className={styles.field}>
            <label className={styles.label}>Responsable</label>
            <input
              className={styles.input}
              placeholder="Operario o puesto de máquina asignado"
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            />
          </div>

          {/* Descripción */}
          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Observaciones de mecanizado o tolerancias especiales..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          {/* Footer de Acciones */}
          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={styles.btnSubmit}>
              {saving ? "Guardando..." : "Crear OT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}