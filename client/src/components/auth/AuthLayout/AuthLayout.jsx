import styles from "./AuthLayout.module.css";

export default function AuthLayout({ icon: Icon, title, subtitle, children, footer }) {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authContent}>
        {Icon && (
          <div className={styles.iconBox}>
            <Icon size={26} strokeWidth={2.5} />
          </div>
        )}

        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        <div className={styles.card}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}