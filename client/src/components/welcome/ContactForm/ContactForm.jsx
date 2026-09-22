import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    piece: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST pensado para alimentar la bandeja de /inquiries
      // const res = await fetch("/api/inquiries", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });
      
      setTimeout(() => {
        setSubmitted(true);
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error("Error al enviar consulta:", error);
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
              <CheckCircle2 size={32} className={styles.successIcon} />
              <div>
                <h3>¡Consulta recibida con éxito!</h3>
                <p>Nuestro equipo de ingeniería revisará el requerimiento y se comunicará pronto.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Fila 1: Contacto Principal */}
              <div className={styles.inputRow}>
                <div className={styles.field}>
                  <label htmlFor="fullName" className={styles.label}>Nombre y apellido *</label>
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
                  <label htmlFor="company" className={styles.label}>Empresa / Taller *</label>
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
                  <label htmlFor="email" className={styles.label}>Email de contacto *</label>
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
                  <label htmlFor="phone" className={styles.label}>Teléfono / WhatsApp</label>
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
                  <label htmlFor="piece" className={styles.label}>Pieza o trabajo a cotizar *</label>
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
                <label htmlFor="message" className={styles.label}>Detalles o especificaciones *</label>
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
                <button type="submit" disabled={loading} className={styles.btnPrimary}>
                  {loading ? "Enviando..." : "Enviar Consulta"}
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