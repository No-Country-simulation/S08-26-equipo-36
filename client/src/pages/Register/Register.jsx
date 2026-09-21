import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";
import GoogleIcon from "../../components/auth/GoogleIcon";
import { useAuth } from "../../context/AuthContext";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe contener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await signUp(email.trim(), password);
      setLoading(false);
      // Redirección directa al login
      navigate("/login");
    } catch (err) {
      setLoading(false);
      if (err.message?.includes("User already registered")) {
        setError("Ya existe una cuenta registrada con este correo electrónico.");
      } else {
        setError(err.message || "Ocurrió un error al registrar la cuenta.");
      }
    }
  };

  const handleGoogle = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crea tu cuenta"
      subtitle="Regístrate para empezar"
      footer={
        <>
          ¿Ya tenés una cuenta?{" "}
          <Link to="/login" className={styles.linkLogin}>
            Iniciar sesión
          </Link>
        </>
      }
    >
      <button
        type="button"
        className={styles.btnGoogle}
        onClick={handleGoogle}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <Spinner size="sm" isButton />
        ) : (
          <GoogleIcon size={18} />
        )}
        Continúa con Google
      </button>

      <div className={styles.dividerWrapper}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>o</span>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

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

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Contraseña
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.input} ${styles.inputPassword}`}
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
              className={`${styles.input} ${styles.inputPassword}`}
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

        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={loading || googleLoading}
        >
          {loading ? <Spinner size="sm" isButton /> : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
}