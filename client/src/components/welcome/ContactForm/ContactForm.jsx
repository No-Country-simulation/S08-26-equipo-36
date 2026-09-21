import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
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
      // Endpoint pensado para alimentar la bandeja de /consultas
      // const res = await fetch("/api/consultas", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulación inmediata para validar flujo
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
              <div className={styles.inputRow}>
                <div className={styles.field}>
                  <label htmlFor="nombre" className={styles.label}>Nombre / Empresa *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    placeholder="Ej: Juan Pérez - Mecánica Sur"
                    value={formData.nombre}
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

                <div className={styles.field}>
                  <label htmlFor="telefono" className={styles.label}>Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    placeholder="+54 9 ..."
                    value={formData.telefono}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="mensaje" className={styles.label}>Consulta o requerimiento *</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  required
                  rows={4}
                  placeholder="Detallá tu pieza, material, tolerancias estimadas o dudas generales..."
                  value={formData.mensaje}
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