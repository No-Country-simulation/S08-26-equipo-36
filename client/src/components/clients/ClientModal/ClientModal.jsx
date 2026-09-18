import { useState, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./ClientModal.module.css";

const emptyForm = {
  nombre: "",
  contacto: "",
  email: "",
  telefono: "",
  ruc_nit: "",
  direccion: "",
  notas: "",
};

// Subcomponente interno que inicializa el estado directamente sin useEffect
function ClientFormContent({ initialData, onSave, onClose }) {
  const [form, setForm] = useState(() => (initialData ? { ...emptyForm, ...initialData } : emptyForm));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (err) {
      console.error("[ClientModal] Error al guardar cliente:", err);
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
          {initialData ? "Editar cliente" : "Nuevo cliente"}
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
        <div className={styles.field}>
          <label className={styles.label}>
            Nombre / Razón social <span className={styles.req}>*</span>
          </label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={styles.input}
            placeholder="Ej. Metalúrgica Rossi"
          />
        </div>

        <div className={styles.rowTwo}>
          <div className={styles.field}>
            <label className={styles.label}>Contacto</label>
            <input
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              className={styles.input}
              placeholder="Persona de contacto"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>ID Fiscal (CUIT / RUT / RFC / NIT)</label>
            <input
              value={form.ruc_nit}
              onChange={(e) => setForm({ ...form, ruc_nit: e.target.value })}
              className={styles.input}
              placeholder="Ej. 30-xxxxxxxx-x"
            />
          </div>
        </div>

        <div className={styles.rowTwo}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={styles.input}
              placeholder="correo@empresa.com"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className={styles.input}
              placeholder="+54 ..."
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Dirección</label>
          <input
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className={styles.input}
            placeholder="Planta o dirección de entrega"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notas</label>
          <textarea
            rows={2}
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className={styles.textarea}
            placeholder="Observaciones de pago, horarios de entrega..."
          />
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className={styles.btnSubmit}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  // Manejo de eventos del modal (tecla Escape y overflow del body)
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
      <ClientFormContent
        key={initialData ? initialData.id : "new-client"}
        initialData={initialData}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
}