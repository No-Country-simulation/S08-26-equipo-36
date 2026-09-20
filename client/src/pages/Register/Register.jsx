import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import AuthLayout from "../../components/auth/AuthLayout/AuthLayout";
import GoogleIcon from "../../components/auth/GoogleIcon";
import styles from "./Register.module.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Flujo OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpInputsRef = useRef([]);

  const handleSubmit = (e) => {
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

    setTimeout(() => {
      setInfoMessage("Código de verificación enviado.");
      setLoading(false);
      setShowOtp(true);
    }, 600);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    setError("");
    const enteredCode = otp.join("");

    if (enteredCode.length < 6) {
      setError("Ingresá el código completo de 6 dígitos.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 600);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setInfoMessage("Nuevo código de verificación enviado.");
    otpInputsRef.current[0]?.focus();
  };

  const handleGoogle = () => {
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 600);
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verificá tu correo"
        subtitle={`Enviamos un código a ${email}`}
      >
        {infoMessage && <div className={styles.successAlert}>{infoMessage}</div>}
        {error && <div className={styles.errorAlert}>{error}</div>}

        <div className={styles.otpInputsContainer}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (otpInputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              className={styles.otpInputSlot}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.btnSubmit}
          onClick={handleVerify}
          disabled={loading || otp.join("").length < 6}
        >
          {loading ? <Spinner size="sm" /> : "Verificar"}
        </button>

        <p className={styles.otpFooterText}>
          ¿No recibiste el código?{" "}
          <button type="button" onClick={handleResend} className={styles.btnResend}>
            Reenviar
          </button>
        </p>
      </AuthLayout>
    );
  }

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
        disabled={loading}
      >
        <GoogleIcon size={18} />
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

        <button type="submit" className={styles.btnSubmit} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
}