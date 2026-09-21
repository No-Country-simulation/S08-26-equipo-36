import { LayoutDashboard, Tablet, Ruler, Eye } from "lucide-react";
import styles from "./WhatWeDo.module.css";

const CAPACITIES = [
  {
    id: "mecanizado-cnc",
    icon: LayoutDashboard, // o Cog / Cpu
    title: "Torneado & Fresado CNC",
    subtitle: "Mecanizado de precisión",
    desc: "Capacidad de mecanizado para piezas unitarias y series medianas en aceros especiales, inoxidables y metales no ferrosos.",
  },
  {
    id: "operacion-digital",
    icon: Tablet,
    title: "Gestión Digital de Planta",
    subtitle: "Cero error documental",
    desc: "Planos y especificaciones técnicas en terminales directas de operario, asegurando cumplimiento estricto de tolerancias sin papeles extraviados.",
  },
  {
    id: "control-calidad",
    icon: Ruler,
    title: "Control Dimensional Riguroso",
    subtitle: "Conformidad técnica",
    desc: "Inspección exhaustiva de cotas y tolerancias geométricas para certificar cada pieza según los planos provistos por el cliente.",
  },
  {
    id: "portal-clientes",
    icon: Eye,
    title: "Trazabilidad & Monitoreo",
    subtitle: "Seguimiento transparente",
    desc: "Consultá en tiempo real el avance de tu orden de trabajo (OT) desde cualquier dispositivo, con fechas de entrega claras y sin demoras.",
  },
];

export default function WhatWeDo() {
  return (
    <section id="modulos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Capacidades Técnicas</p>
          <h2 className={styles.title}>
            Precisión milimétrica y trazabilidad en cada proceso.
          </h2>
          <p className={styles.description}>
            Combinamos maquinaria CNC de alta precisión, control de calidad dimensional y seguimiento digital integral para cada orden de fabricación.
          </p>
        </div>

        <div className={styles.grid}>
          {CAPACITIES.map((capacity) => (
            <div
              key={capacity.title}
              id={capacity.id === "modo-taller" ? "modo-taller" : undefined}
              className={styles.card}
            >
              <div className={styles.cardContent}>
                <div className={styles.iconWrapper}>
                  <capacity.icon size={24} strokeWidth={2} />
                </div>
                <div className={styles.info}>
                  <span className={styles.subtitle}>{capacity.subtitle}</span>
                  <h3 className={styles.moduleTitle}>{capacity.title}</h3>
                  <p className={styles.desc}>{capacity.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}