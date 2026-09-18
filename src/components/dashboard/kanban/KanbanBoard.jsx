import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./KanbanBoard.module.css";

const COLUMNS = [
  { id: "creada", label: "Creada", colorClass: styles.dotCreada },
  { id: "en_proceso", label: "En Mecanizado", colorClass: styles.dotMecanizado },
  { id: "control_calidad", label: "Control Calidad", colorClass: styles.dotCalidad },
  { id: "liberada", label: "Liberada", colorClass: styles.dotLiberada },
];

export default function KanbanBoard({ ots = [], onMove, onCardClick }) {
  const navigate = useNavigate();
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = (e, otId) => {
    e.dataTransfer.setData("text/plain", String(otId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const otId = e.dataTransfer.getData("text/plain");
    const ot = ots.find((o) => String(o.id) === String(otId));
    if (ot && ot.estado !== targetStatus && onMove) {
      onMove(ot, targetStatus);
    }
  };

  const handleClick = (ot) => {
    if (onCardClick) {
      onCardClick(ot);
    } else {
      navigate(`/ordenes/${ot.id}`);
    }
  };

  return (
    <div className={styles.boardContainer}>
      {COLUMNS.map((col) => {
        const columnOts = ots.filter((ot) => {
          if (col.id === "en_proceso") {
            return ["en_proceso", "mecanizado"].includes(ot.estado);
          }
          if (col.id === "control_calidad") {
            return ["control_calidad", "calidad"].includes(ot.estado);
          }
          if (col.id === "liberada") {
            return ["liberada", "finalizada", "entregada"].includes(ot.estado);
          }
          return ot.estado === col.id;
        });

        return (
          <div
            key={col.id}
            className={`${styles.column} ${dragOverCol === col.id ? styles.columnDraggingOver : ""}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Cabecera de la columna */}
            <div className={styles.columnHeader}>
              <div className={styles.columnTitleWrap}>
                <span className={`${styles.statusDot} ${col.colorClass}`} />
                <span className={styles.columnTitle}>{col.label}</span>
              </div>
              <span className={styles.countBadge}>{columnOts.length}</span>
            </div>

            {/* Lista de tarjetas */}
            <div className={styles.cardList}>
              {columnOts.length === 0 ? (
                <div className={styles.emptyCol}>Sin órdenes</div>
              ) : (
                columnOts.map((ot) => {
                  const prio = (ot.prioridad || "media").toLowerCase();
                  const priorityClass =
                    prio === "alta" || prio === "urgente"
                      ? styles.priorityHigh
                      : prio === "baja"
                      ? styles.priorityLow
                      : styles.priorityMed;

                  return (
                    <div
                      key={ot.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ot.id)}
                      onClick={() => handleClick(ot)}
                      className={styles.card}
                    >
                      <div className={styles.cardTop}>
                        <span className={styles.otNumber}>
                          {ot.numero || `OT-${String(ot.id).padStart(4, "0")}`}
                        </span>
                        <span className={styles.clientName}>
                          {ot.cliente_nombre || ot.cliente || "S/C"}
                        </span>
                      </div>

                      <h4 className={styles.pieceTitle}>{ot.pieza || "Pieza en proceso"}</h4>

                      <div className={styles.cardMeta}>
                        <span>
                          Cant: <strong>{ot.cantidad || 1}</strong>
                        </span>
                        <span className={`${styles.priorityPill} ${priorityClass}`}>
                          {ot.prioridad || "media"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}