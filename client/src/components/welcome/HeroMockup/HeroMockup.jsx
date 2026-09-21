import { FileText, CheckCircle2, Ruler, AlertTriangle } from "lucide-react";
import styles from "./HeroMockup.module.css";

const OPERATIONS = [
  { icon: CheckCircle2, label: "Torneado", tone: "emerald" },
  { icon: CheckCircle2, label: "Fresado", tone: "emerald" },
  { icon: Ruler, label: "Rectificado", tone: "orange" },
  { icon: AlertTriangle, label: "Inspección", tone: "slate" },
];

const SPECS = ["⌀12 H7", "Ra 1.6", "C45 · ACERO"];

export default function HeroMockup() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.glow} />

      <div className={styles.card}>
        <div className={styles.windowBar}>
          <div className={styles.dots}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <p className={styles.windowTitle}>OT-0042 · expediente.json</p>
          <span className={styles.statusBadge}>
            <span className={styles.statusPulse} /> EN PROCESO
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.blueprintColumn}>
            <div className={styles.blueprintMeta}>
              <FileText size={14} />
              <span>plano_42_revC.pdf</span>
            </div>

            <div className={styles.canvasWrapper}>
              <div className={styles.gridPattern} />
              <svg viewBox="0 0 200 150" className={styles.partSvg}>
                <g stroke="#fd9f12" strokeWidth="1.5" fill="none">
                  <path d="M40 45 H160 V95 H100 V110 H40 Z" />
                  <circle cx="130" cy="70" r="12" />
                  <circle cx="130" cy="70" r="4" fill="#fd9f12" fillOpacity="0.3" />
                </g>
                <g stroke="#2A9D6F" strokeWidth="1" strokeDasharray="3 3">
                  <line x1="40" y1="125" x2="160" y2="125" />
                  <line x1="40" y1="120" x2="40" y2="130" />
                  <line x1="160" y1="120" x2="160" y2="130" />
                </g>
                <text x="100" y="140" textAnchor="middle" fill="#2A9D6F" fontSize="7" fontFamily="monospace">
                  120 ±0.05
                </text>
              </svg>
            </div>

            <div className={styles.specsTags}>
              {SPECS.map((spec) => (
                <span key={spec} className={styles.specTag}>
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.progressColumn}>
            <div className={styles.progressHeader}>
              <p className={styles.progressLabel}>Progreso</p>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} />
              </div>
              <p className={styles.progressCount}>3 / 5 operaciones</p>
            </div>

            <div className={styles.operationsList}>
              {OPERATIONS.map((item) => (
                <div key={item.label} className={styles.operationRow}>
                  <item.icon
                    size={14}
                    className={
                      item.tone === "emerald"
                        ? styles.iconEmerald
                        : item.tone === "orange"
                        ? styles.iconOrange
                        : styles.iconSlate
                    }
                  />
                  <span className={styles.operationLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.floatingBadge}>
        <CheckCircle2 size={20} className={styles.badgeIcon} />
        <div className={styles.badgeText}>
          <p className={styles.badgeTitle}>Calidad Aprobada</p>
          <span className={styles.badgeSubtitle}>ISO 9001 · conforme</span>
        </div>
      </div>
    </div>
  );
}