import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "../../../api/apiClient";
import styles from "./MissingFiscalDataModal.module.css";

export default function MissingFiscalDataModal({
  isOpen,
  client,
  onClose,
  onClientUpdated,
}) {
  const [fiscalId, setFiscalId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fiscalId.trim()) return;

    setLoading(true);
    try {
      if (typeof api.actualizarCliente === "function") {
        await api.actualizarCliente(client.id_cliente || client.id, {
          ...client,
          ruc_nit: fiscalId.trim(),
        });
      }

      if (onClientUpdated) {
        onClientUpdated({
          ...client,
          ruc_nit: fiscalId.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error("[MissingFiscalDataModal] Error guardando ID fiscal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <AlertTriangle size={20} />
          </div>
          <h3 className={styles.title}>Identificación Fiscal Pendiente</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <p className={styles.description}>
          El cliente <strong>{client.razon_social || client.nombre}</strong> aún
          no tiene CUIT / CUIL registrado. Para emitir facturas y avanzar con las
          órdenes de trabajo, es recomendable cargarlo ahora.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              CUIT / CUIL / ID Fiscal <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="Ej. 30-71234567-8"
              className={styles.input}
              value={fiscalId}
              onChange={(e) => setFiscalId(e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
            >
              Completar luego
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !fiscalId.trim()}
            >
              {loading ? "Guardando..." : "Guardar y Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}