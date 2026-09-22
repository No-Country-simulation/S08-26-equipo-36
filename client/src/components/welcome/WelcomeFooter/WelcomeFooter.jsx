import styles from "./WelcomeFooter.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          {/* Marca */}
          <div className={styles.brandCol}>
            <div className={styles.logoRow}>
              <img src="/Imagotipo-Sidebar.svg" alt="QualityTrack" className={styles.logo} />
            </div>
            <p className={styles.tagline}>
              Mecanizado CNC de precisión, fresado y torneado industrial bajo plano con trazabilidad de procesos.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <nav className={styles.linksCol} aria-label="Navegación del footer">
            <a href="#como-trabajamos" className={styles.link}>Cómo trabajamos</a>
            <a href="#capacidades" className={styles.link}>Capacidades</a>
            <a href="#seguimiento" className={styles.link}>Seguimiento OT</a>
            <a href="#contacto" className={styles.link}>Contacto</a>
          </nav>
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.copy}>
            © {currentYear} QualityTrack · Mecanizado CNC de precisión y control dimensional bajo plano.
          </p>
        </div>
      </div>
    </footer>
  );
}