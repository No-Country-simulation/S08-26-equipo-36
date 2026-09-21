import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";
import GoogleIcon from "../../components/auth/GoogleIcon";
import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);

    try {
      await signIn(email.trim(), password);
      setLoading(false);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setLoading(false);
      if (err.message?.includes("Invalid login credentials")) {
        setError("Correo electrónico o contraseña incorrectos.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    }
  };

  const handleGoogleLogin = async () => {
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
      icon={LogIn}
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión en tu cuenta"
      footer={
        <>
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className={styles.linkRegister}>
            Regístrate aquí
          </Link>
        </>
      }
    >
      <button
        type="button"
        className={styles.btnGoogle}
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <Spinner size="sm" isButton color="orange" />
        ) : (
          <GoogleIcon size={18} />
        )}
        Continuar con Google
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
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldHeader}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
              aria-label={
                showPassword ? "Ocultar contraseña" : "Ver contraseña"
              }
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={loading || googleLoading}
        >
          {loading ? <Spinner size="sm" isButton /> : "Iniciar sesión"}
        </button>
      </form>
    </AuthLayout>
  );
}
