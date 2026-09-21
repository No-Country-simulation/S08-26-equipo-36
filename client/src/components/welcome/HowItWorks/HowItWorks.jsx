import { FileText, ClipboardList, Cog, ShieldCheck, PackageCheck } from "lucide-react";
import styles from "./HowItWorks.module.css";

const STAGES = [
  {
    n: "01",
    icon: FileText,
    title: "Solicitud & Cotización",
    desc: "Recepción de planos, definición de material (SAE 4140, 1045, etc.) y envío de presupuesto técnico.",
  },
  {
    n: "02",
    icon: ClipboardList,
    title: "Orden de Trabajo (OT)",
    desc: "Asignación de código único de seguimiento con fecha pactada y hoja de ruta de fabricación.",
  },
  {
    n: "03",
    icon: Cog,
    title: "Mecanizado CNC",
    desc: "Torneado y fresado de precisión bajo plano con registro continuo del avance en planta.",
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Control de Calidad",
    desc: "Inspección dimensional y validación rigurosa de tolerancias antes de la liberación final.",
  },
  {
    n: "05",
    icon: PackageCheck,
    title: "Liberada & Entregada",
    desc: "Despacho puntual de la pieza terminada con documentación técnica y respaldo de trazabilidad.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-trabajamos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>¿Cómo trabajamos?</p>
          <h2 className={styles.title}>
            El ciclo de fabricación de tu pieza, en 5 etapas.
          </h2>
          <p className={styles.description}>
           Desde la recepción de los requerimientos técnicos y planos hasta el despacho final
    con control de tolerancias e historial completo.
          </p>
        </div>

        <div className={styles.stagesGrid}>
          {STAGES.map((stage) => (
            <div key={stage.n} className={styles.stageItem}>
                          <div className={styles.stageCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <stage.icon size={20} strokeWidth={2} />
                  </div>
                  <span className={styles.stageNumber}>{stage.n}</span>
                </div>
                <h3 className={styles.stageTitle}>{stage.title}</h3>
                <p className={styles.stageDesc}>{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}