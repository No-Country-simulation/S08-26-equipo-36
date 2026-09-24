import { useState } from "react";
import { Mail, Send, X, Loader2, Check } from "lucide-react";
import styles from "./ReplyInquiryModal.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ReplyInquiryModal({ isOpen, onClose, inquiry, onEmailSent }) {
  if (!isOpen || !inquiry) return null;

  return (
    <ReplyInquiryContent
      key={inquiry.id}
      onClose={onClose}
      inquiry={inquiry}
      onEmailSent={onEmailSent}
    />
  );
}

function ReplyInquiryContent({ onClose, inquiry, onEmailSent }) {
  const [subject, setSubject] = useState(
    () => `Respuesta a consulta sobre ${inquiry.piece || "mecanizado"} - QualityTrack`
  );
  const [message, setMessage] = useState(
    () =>
      `Estimado/a ${inquiry.fullName},\n\nGracias por contactarse con QualityTrack. Con respecto a su consulta sobre la pieza "${inquiry.piece || "solicitada"}", le informamos que...\n\nQuedamos a su entera disposición.`
  );
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Por favor escriba un mensaje de respuesta.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/inquiries/responder-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inquiry.email,
          cliente: inquiry.fullName,
          asunto: subject,
          mensaje: message,
          consulta_original: inquiry.description,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setSentSuccess(true);
        if (onEmailSent) {
          onEmailSent(inquiry.id);
        }
        setTimeout(() => {
          setSentSuccess(false);
          onClose();
        }, 1600);
      } else {
        setError(data.message || "No se pudo despachar el correo.");
      }
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <Mail size={18} />
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>Responder Consulta</h3>
            <span className={styles.clientTag}>{inquiry.company || inquiry.fullName}</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {inquiry.description && (
            <div className={styles.inquirySnapshot}>
              <span className={styles.snapshotLabel}>Consulta original:</span>
              <p className={styles.snapshotText}>{inquiry.description}</p>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Destinatario</label>
            <input
              type="text"
              readOnly
              value={`${inquiry.fullName} <${inquiry.email}>`}
              className={styles.inputDisabled}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Mensaje de respuesta (texto libre)</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.textarea}
              required
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={sending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={sending || sentSuccess}
            >
              {sending ? (
                <>
                  <Loader2 size={15} className={styles.spin} /> Enviando...
                </>
              ) : sentSuccess ? (
                <>
                  <Check size={15} color="#10b981" /> ¡Enviado!
                </>
              ) : (
                <>
                  <Send size={15} /> Enviar Respuesta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}