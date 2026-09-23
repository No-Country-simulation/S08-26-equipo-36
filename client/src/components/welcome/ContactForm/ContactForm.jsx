import { useState } from "react";
import { Send, CheckCircle2, RefreshCw } from "lucide-react";
import styles from "./ContactForm.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const INITIAL_FORM_STATE = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  piece: "",
  message: "",
};

export default function ContactForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Payload con los campos exactos validados por app.py
    const payload = {
      fullName: formData.fullName.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      piece: formData.piece.trim(),
      message: formData.message.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al procesar la consulta en el servidor");
      }

      setSubmitted(true);
      setFormData(INITIAL_FORM_STATE);
    } catch (error) {
      console.error("Error al enviar consulta:", error);
      alert(error.message || "Hubo un error al conectar con el servidor. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.glowOrange} />
          <div className={styles.glowEmerald} />

          <div className={styles.header}>
            <p className={styles.eyebrow}>Contacto Comercial & Técnico</p>
            <h2 className={styles.title}>¿Tenés un proyecto o pieza para mecanizar?</h2>
            <p className={styles.description}>
              Envianos tus requerimientos o dudas iniciales. Nuestro equipo técnico
              evaluará la factibilidad y se pondrá en contacto a la brevedad.
            </p>
          </div>

          {submitted ? (
            <div className={styles.successMessage}>
              <CheckCircle2 size={36} className={styles.successIcon} />
              <div>
                <h3>¡Consulta recibida con éxito!</h3>
                <p>
                  Nuestro equipo de ingeniería revisará el requerimiento técnico y
                  se comunicará a la brevedad.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className={styles.btnReset}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "1rem",
                    background: "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    color: "var(--text-white, #ffffff)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={14} /> Enviar otra consulta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Fila 1: Contacto Principal */}
              <div className={styles.inputRow}>
                <div className={styles.field}>
                  <label htmlFor="fullName" className={styles.label}>
                    Nombre y apellido *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="company" className={styles.label}>
                    Empresa / Taller *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    placeholder="Ej: Mecánica Sur S.A."
                    value={formData.company}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>
                    Email de contacto *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="nombre@empresa.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Fila 2: Teléfono y Pieza/Requerimiento */}
              <div className={styles.inputRow2}>
                <div className={styles.field}>
                  <label htmlFor="phone" className={styles.label}>
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+54 9 351..."
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="piece" className={styles.label}>
                    Pieza o trabajo a cotizar *
                  </label>
                  <input
                    type="text"
                    id="piece"
                    name="piece"
                    required
                    placeholder="Ej: Eje estriado, Buje de bronce, Brida..."
                    value={formData.piece}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Fila 3: Mensaje detallado */}
              <div className={styles.field}>
                <label htmlFor="message" className={styles.label}>
                  Detalles o especificaciones *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Detallá cantidad estimada, material si lo conocés, tolerancias o dudas generales..."
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.actionWrapper}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.btnPrimary}
                >
                  {loading ? "Enviando consulta..." : "Enviar Consulta"}
                  <Send size={16} className={styles.sendIcon} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}