import { ShieldCheck, FileText, AlertTriangle, Box } from 'lucide-react';
import styles from './ShopFloorCard.module.css';

export default function ShopFloorCard({
  order,
  onSelect,
  onEscalate,
  onOpenBlueprint,
  onReportIncident,
}) {
  if (!order) return null;

  const orderId = order.numero || order.id || 'S/N';
  const partName = order.pieza || order.partName || 'Pieza sin denominación';
  const clientName = order.cliente_nombre || order.cliente || 'Metalúrgica del Plata S.A.';
  const quantity = order.cantidad || order.quantity || 1;
  const priority = (order.prioridad || 'media').toLowerCase();

  const isMachining = order.estado === 'en_proceso' || order.estado === 'mecanizado';
  const isHighPriority = priority === 'alta';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(order);
    }
  };

  return (
    <article className={styles.card}>
      <div
        className={styles.clickableArea}
        onClick={() => onSelect?.(order)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className={styles.headerRow}>
          <span className={styles.orderNumber}>{orderId}</span>
          <span
            className={`${styles.badge} ${
              isMachining ? styles.badgeMachining : styles.badgeQc
            }`}
          >
            <span className={styles.badgeDot} />
            {isMachining ? 'En Mecanizado' : 'Control Calidad'}
          </span>
        </div>

        <p className={styles.partTitle}>{partName}</p>
        <p className={styles.clientText}>{clientName}</p>

        <div className={styles.metaRow}>
          <span className={styles.qtyBox}>
            <Box size={13} /> {quantity} u.
          </span>
          <span
            className={`${styles.badge} ${
              isHighPriority ? styles.prioHigh : styles.prioMed
            }`}
          >
            <span className={styles.badgeDot} />
            {isHighPriority ? 'Alta' : 'Media'}
          </span>
        </div>
      </div>

      <footer className={styles.cardActions}>
        {isMachining && (
          <button
            type="button"
            className={styles.btnEscalate}
            onClick={(e) => {
              e.stopPropagation();
              onEscalate?.(order);
            }}
          >
            <ShieldCheck size={16} /> Derivar a Calidad
          </button>
        )}

        <div className={styles.secondaryRow}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={(e) => {
              e.stopPropagation();
              onOpenBlueprint?.(order);
            }}
          >
            <FileText size={15} /> Ver Plano
          </button>

          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.btnIncident}`}
            onClick={(e) => {
              e.stopPropagation();
              onReportIncident?.(order);
            }}
          >
            <AlertTriangle size={15} /> Falla
          </button>
        </div>
      </footer>
    </article>
  );
}