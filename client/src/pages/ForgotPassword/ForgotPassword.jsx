import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setLoading(false);
      setSent(true);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Ocurrió un error al solicitar el restablecimiento.");
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Restablecer contraseña"
      subtitle="Te enviaremos un enlace para restablecerla"
      footer={
        <Link to="/login" className={styles.backLink}>
          <ArrowLeft size={14} />
          Volver a iniciar sesión
        </Link>
      }
    >
      {error && <div className={styles.errorAlert}>{error}</div>}

      {sent ? (
        <p className={styles.successMessage}>
          Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un
          enlace de restablecimiento en breve.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo electrónico
            </label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={16} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" isButton /> : "Enviar enlace de restablecimiento"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}