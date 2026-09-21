import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import styles from "./TrackingWidget.module.css";

export default function TrackingWidget() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const term = value.trim().toUpperCase();
    if (!term) return;
    navigate(`/seguimiento?ot=${encodeURIComponent(term)}`);
  };

  return (
    <form onSubmit={submit} id="seguimiento" className={styles.widgetForm}>
      <div className={styles.card}>
        <p className={styles.label}>
          <span className={styles.iconWrapper}>
            <Search size={14} />
          </span>
          ¿Sos cliente? Consultá el estado de tu pieza:
        </p>

        <div className={styles.inputGroup}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: OT-0004"
            className={styles.input}
          />
          <button type="submit" className={styles.btnSubmit}>
            Consultar Seguimiento
            <ArrowRight size={16} className={styles.arrowIcon} />
          </button>
        </div>
      </div>
    </form>
  );
}