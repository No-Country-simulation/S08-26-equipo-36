import styles from "./WelcomeFooter.module.css";

export default function WelcomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandWrapper}>
          <img
            src="/Imagotipo-Sidebar.svg"
            alt="QualityTrack Logo"
            className={styles.logo}
          />
        </div>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} QualityTrack · Ingeniería de trazabilidad metalmecánica.
        </p>
      </div>
    </footer>
  );
}