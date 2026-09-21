import { ArrowRight } from "lucide-react";
import HeroMockup from "../HeroMockup/HeroMockup";
import TrackingWidget from "../TrackingWidget/TrackingWidget";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        <div className={styles.contentColumn}>
          <div className={styles.tagBadge}>
            <span className={styles.tagPulse} />
            <span>
              Mecanizado de precisión y torneado CNC con trazabilidad industrial
            </span>
          </div>

          <h1 className={styles.title}>
            Mecanizado industrial bajo plano.{" "}
            <span className={styles.titleHighlight}>
              Trazabilidad técnica y control dimensional en cada pieza.
            </span>
          </h1>

          <p className={styles.description}>
            Fabricamos piezas unitarias y series de precisión con materiales
            certificados. Monitoreá el estado de tu fabricación en tiempo real
            sin demoras ni llamadas.
          </p>

          <div className={styles.actions}>
            <a href="#contacto" className={styles.btnPrimary}>
              Solicitar Cotización
              <ArrowRight size={16} className={styles.arrowIcon} />
            </a>
          </div>

          <TrackingWidget />
        </div>

        <div className={styles.mockupColumn}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
