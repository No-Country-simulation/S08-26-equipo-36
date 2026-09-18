import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import styles from './QuickQcModal.module.css';

const INITIAL_FORM_STATE = {
  type: 'Dimensional',
  result: 'approved',
  measurement: '',
  inspector: '',
  notes: '',
};

export default function QuickQcModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(INITIAL_FORM_STATE);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    handleClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <header className={styles.header}>
          <h3 className={styles.title}>
            <ShieldCheck size={18} /> Registrar Control de Calidad
          </h3>
          <button
            type="button"
            className={styles.btnClose}
            onClick={handleClose}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </header>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="qc-type" className={styles.label}>
                Tipo de control
              </label>
              <select
                id="qc-type"
                name="type"
                className={styles.select}
                value={form.type}
                onChange={handleChange}
              >
                <option value="Dimensional">Dimensional</option>
                <option value="Surface">Superficial / Rugosidad</option>
                <option value="Visual">Visual</option>
                <option value="Hardness">Dureza</option>
                <option value="Final">Inspección Final</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="qc-result" className={styles.label}>
                Resultado
              </label>
              <select
                id="qc-result"
                name="result"
                className={styles.select}
                value={form.result}
                onChange={handleChange}
              >
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="rework">Retrabajo</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="qc-measurement" className={styles.label}>
              Medición / Valor obtenido
            </label>
            <input
              id="qc-measurement"
              type="text"
              name="measurement"
              placeholder="Ej. Ø 50.02 mm"
              className={styles.input}
              value={form.measurement}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="qc-inspector" className={styles.label}>
              Inspector / Operario
            </label>
            <input
              id="qc-inspector"
              type="text"
              name="inspector"
              placeholder="Nombre del responsable"
              className={styles.input}
              value={form.inspector}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="qc-notes" className={styles.label}>
              Observaciones
            </label>
            <textarea
              id="qc-notes"
              name="notes"
              rows={3}
              className={styles.textarea}
              placeholder="Notas técnicas o desviaciones detectadas..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {/* Acciones */}
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              Guardar Registro
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}