import { Inbox } from "lucide-react";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconBox}>
        <Icon className={styles.icon} size={24} strokeWidth={1.5} />
      </div>

      <p className={styles.title}>{title}</p>
      {description && <p className={styles.subtitle}>{description}</p>}

      {/* Slot genérico de Base44 */}
      {action && <div className={styles.actionSlot}>{action}</div>}

      {/* Botón rápido por props */}
      {!action && actionLabel && onAction && (
        <button type="button" onClick={onAction} className={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}