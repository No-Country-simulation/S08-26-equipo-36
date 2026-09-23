import { useState, useEffect } from "react";
import { X } from "lucide-react";
import MissingFiscalDataModal from "../MissingFiscalDataModal/MissingFiscalDataModal";
import styles from "./QuoteModal.module.css";

function getTodayString() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const emptyForm = {
  solicitud_id: "",
  fecha: getTodayString(),
  detalle: "",
  precio_unitario: "",
  validez: "30 días",
};

function normalizeQuoteData(data) {
  if (!data) return emptyForm;
  return {
    ...emptyForm,
    ...data,
    solicitud_id: String(data.solicitud_id || ""),
    precio_unitario: data.precio_unitario ?? "",
    fecha: data.fecha || getTodayString(),
    validez: data.validez || "30 días",
    detalle: data.detalle || "",
  };
}

function QuoteFormContent({
  initialData,
  availableRequests,
  clients = [],
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(() => normalizeQuoteData(initialData));
  const [saving, setSaving] = useState(false);
  const [clientMissingFiscal, setClientMissingFiscal] = useState(null);

  const handleSelectSolicitud = (solicitudId) => {
    setForm((prev) => ({ ...prev, solicitud_id: solicitudId }));

    if (!solicitudId) return;

    // Buscar la solicitud elegida
    const selectedReq = availableRequests.find(
      (s) => String(s.id) === String(solicitudId)
    );

    if (selectedReq) {
      // Buscar el cliente por ID o por coincidencia de nombre
      const foundClient = clients.find(
        (c) =>
          String(c.id_cliente || c.id) === String(selectedReq.id_cliente) ||
          (c.razon_social &&
            c.razon_social.toLowerCase() ===
              (selectedReq.cliente_nombre || "").toLowerCase())
      );

      // Si el cliente no tiene CUIT/RUC cargado, abrimos el modal de aviso
      const fiscalId = foundClient?.ruc_nit || foundClient?.cuit;
      if (foundClient && (!fiscalId || fiscalId.trim() === "")) {
        setClientMissingFiscal(foundClient);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.solicitud_id) return;

    try {
      setSaving(true);
      await onSave({
        ...form,
        precio_unitario: Number(form.precio_unitario) || 0,
      });
      onClose();
    } catch (err) {
      console.error("[QuoteModal] Error al guardar cotización:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>
            {initialData ? "Editar cotización" : "Nueva cotización"}
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
              Solicitud <span className={styles.req}>*</span>
            </label>
            <select
              required
              disabled={Boolean(initialData)}
              className={styles.select}
              value={form.solicitud_id}
              onChange={(e) => handleSelectSolicitud(e.target.value)}
            >
              <option value="">Seleccionar solicitud...</option>
              {availableRequests.map((s) => {
                const pieza = s.pieza || s.piece || "Pieza sin nombre";
                const cliente = s.cliente_nombre || s.client_name || "Cliente";
                const cantidad = s.cantidad || s.quantity || 1;

                return (
                  <option key={s.id} value={s.id}>
                    {pieza} — {cliente} ({cantidad} u.)
                  </option>
                );
              })}
            </select>
          </div>

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
              <label className={styles.label}>
                Precio unitario ($) <span className={styles.req}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                className={styles.input}
                value={form.precio_unitario}
                onChange={(e) =>
                  setForm({ ...form, precio_unitario: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Validez</label>
            <input
              className={styles.input}
              placeholder="Ej. 30 días"
              value={form.validez}
              onChange={(e) => setForm({ ...form, validez: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Detalle</label>
            <textarea
              rows={3}
              className={styles.textarea}
              placeholder="Items y operaciones cotizadas..."
              value={form.detalle}
              onChange={(e) => setForm({ ...form, detalle: e.target.value })}
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

      {/* Modal secundario para advertir CUIT/CUIL faltante */}
      <MissingFiscalDataModal
        isOpen={Boolean(clientMissingFiscal)}
        client={clientMissingFiscal}
        onClose={() => setClientMissingFiscal(null)}
        onClientUpdated={(updated) => {
          setClientMissingFiscal(null);
        }}
      />
    </>
  );
}

export default function QuoteModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  availableRequests = [],
  clients = [],
}) {
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
      <QuoteFormContent
        key={initialData ? initialData.id : "new-quote"}
        initialData={initialData}
        availableRequests={availableRequests}
        clients={clients}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  );
}