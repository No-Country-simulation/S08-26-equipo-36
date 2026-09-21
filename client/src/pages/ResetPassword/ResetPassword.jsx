import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import styles from "./ResetPassword.module.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(newPassword);
      setLoading(false);
      setSuccess(true);

      // Breve pausa para mostrar confirmación y redirigir
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Error al restablecer la contraseña.");
    }
  };

  return (
    <AuthLayout
      icon={Lock}
      title="Nueva contraseña"
      subtitle="Ingresa tu nueva contraseña a continuación"
      footer={
        <Link to="/login" className={styles.backLink}>
          <ArrowLeft size={14} />
          Volver a iniciar sesión
        </Link>
      }
    >
      {error && <div className={styles.errorAlert}>{error}</div>}

      {success ? (
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            padding: "12px 16px",
            borderRadius: "8px",
            fontFamily: "var(--font-sans)",
            fontSize: "13.5px",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          ¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              Nueva contraseña
            </label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={16} />
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePasswordBtn}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar contraseña
            </label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={16} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.togglePasswordBtn}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" isButton /> : "Restablecer contraseña"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}