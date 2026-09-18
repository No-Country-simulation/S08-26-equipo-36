import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ClipboardList, Wrench, ShieldCheck, CheckCircle2, Box } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import NewOrderModal from "../../components/dashboard/NewOrderModal/NewOrderModal";
import { api } from "../../api/apiClient";
import styles from "./Dashboard.module.css";

const COLUMNS = [
  { id: "creada", label: "Creada", colorClass: styles.colCreada },
  { id: "en_proceso", label: "En Mecanizado", colorClass: styles.colMecanizado },
  { id: "control_calidad", label: "Control de Calidad", colorClass: styles.colCalidad },
  { id: "liberada", label: "Liberada", colorClass: styles.colLiberada }
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ots, setOts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Cargar órdenes y clientes desde MySQL
  const loadDashboardData = useCallback(async () => {
    try {
      const [resOts, resClientes] = await Promise.all([
        api.getOrdenes(),
        typeof api.getClientes === "function" ? api.getClientes() : Promise.resolve({ data: [] })
      ]);

      if (resOts?.status === "success" && Array.isArray(resOts.data)) {
        const ordenesFormateadas = resOts.data.map((o) => ({
          ...o,
          id: o.id_ot || o.id,
          cliente: o.cliente_nombre || "Cliente General",
          estado: o.estado_actual || o.estado || "creada",
          prioridad: (o.prioridad || "Media").charAt(0).toUpperCase() + (o.prioridad || "Media").slice(1).toLowerCase()
        }));
        setOts(ordenesFormateadas);
      }

      if (resClientes?.status === "success" && Array.isArray(resClientes.data)) {
        setClientes(
          resClientes.data.map((c) => ({
            id: c.id_cliente || c.id,
            nombre: c.razon_social || c.nombre
          }))
        );
      }
    } catch (err) {
      console.error("[Dashboard] Error al cargar datos del centro de operaciones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (isMounted) await loadDashboardData();
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  // Drag & Drop con persistencia directa a MySQL
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDragLeave = (colId) => {
    if (dragOverCol === colId) setDragOverCol(null);
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    setDragOverCol(null);
    const otId = e.dataTransfer.getData("text/plain");
    if (!otId) return;

    // Actualización optimista en la interfaz
    setOts((prev) =>
      prev.map((ot) => (String(ot.id) === String(otId) ? { ...ot, estado: targetColId } : ot))
    );

    try {
      if (typeof api.actualizarEstadoOrden === "function") {
        await api.actualizarEstadoOrden(otId, targetColId);
      }
    } catch (err) {
      console.error("[Dashboard] Error actualizando estado de orden vía drag & drop:", err);
      loadDashboardData();
    }
  };

  const handleCardClick = (ot) => {
    navigate(`/ordenes/${ot.id}`);
  };

  const handleCreateOT = async () => {
    setIsModalOpen(false);
    loadDashboardData();
  };

  if (loading) {
    return <Spinner fullScreen text="Cargando centro de operaciones..." />;
  }

  // Contadores normalizados
  const enMecanizado = ots.filter((o) => o.estado === "en_proceso" || o.estado === "mecanizado").length;
  const controlCalidad = ots.filter((o) => o.estado === "control_calidad" || o.estado === "calidad").length;
  const liberadas = ots.filter((o) => o.estado === "liberada" || o.estado === "finalizada").length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Centro de Operaciones</h1>
          <p className={styles.subtitle}>Flujo de órdenes en tiempo real · arrastrá las tarjetas para cambiar de estado.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className={styles.btnPrimary}>
          <Plus size={16} strokeWidth={2.5} /> Nueva Orden de Trabajo
        </button>
      </header>

      {/* Métricas Superiores */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.glow} ${styles.glowSlate}`} />
          <div className={styles.statContent}>
            <div>
              <p className={styles.statLabel}>OTs Totales</p>
              <p className={styles.statValue}>{ots.length}</p>
            </div>
            <div className={`${styles.statIconBox} ${styles.iconSlate}`}>
              <ClipboardList size={20} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.glow} ${styles.glowOrange}`} />
          <div className={styles.statContent}>
            <div>
              <p className={styles.statLabel}>En Mecanizado</p>
              <p className={styles.statValue}>{enMecanizado}</p>
            </div>
            <div className={`${styles.statIconBox} ${styles.iconOrange}`}>
              <Wrench size={20} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.glow} ${styles.glowAmber}`} />
          <div className={styles.statContent}>
            <div>
              <p className={styles.statLabel}>Control de Calidad</p>
              <p className={styles.statValue}>{controlCalidad}</p>
            </div>
            <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.glow} ${styles.glowGreen}`} />
          <div className={styles.statContent}>
            <div>
              <p className={styles.statLabel}>Liberadas</p>
              <p className={styles.statValue}>{liberadas}</p>
            </div>
            <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className={styles.kanbanGrid}>
        {COLUMNS.map((col) => {
          const colOts = ots.filter((o) => {
            if (col.id === "en_proceso") return o.estado === "en_proceso" || o.estado === "mecanizado";
            if (col.id === "control_calidad") return o.estado === "control_calidad" || o.estado === "calidad";
            if (col.id === "liberada") return o.estado === "liberada" || o.estado === "finalizada";
            return o.estado === col.id;
          });

          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`${styles.column} ${isOver ? styles.columnDragOver : ""}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={styles.colHeader}>
                <div className={styles.colTitleRow}>
                  <span className={`${styles.dot} ${col.colorClass}`} />
                  <span className={styles.colTitle}>{col.label}</span>
                </div>
                <span className={styles.colBadge}>{colOts.length}</span>
              </div>

              <div className={styles.cardList}>
                {colOts.length === 0 ? (
                  <div className={styles.emptyCol}>Sin órdenes</div>
                ) : (
                  colOts.map((ot) => (
                    <div
                      key={ot.id}
                      className={styles.otCard}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ot.id)}
                      onClick={() => handleCardClick(ot)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.otCode}>
                          {ot.numero || `OT-${String(ot.id).padStart(4, "0")}`}
                        </span>
                        <span className={`${styles.cornerDot} ${col.colorClass}`} />
                      </div>

                      <h4 className={styles.pieceName}>{ot.pieza || "Pieza en proceso"}</h4>
                      <p className={styles.client}>{ot.cliente}</p>

                      <div className={styles.cardFooter}>
                        <span className={styles.qtyRow}>
                          <Box size={13} /> {Number(ot.cantidad) || 1} u.
                        </span>
                        <span
                          className={`${styles.priorityBadge} ${
                            ot.prioridad === "Alta" || ot.prioridad === "Urgente"
                              ? styles.prioAlta
                              : styles.prioMedia
                          }`}
                        >
                          • {ot.prioridad}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOT}
        clientes={clientes}
      />
    </div>
  );
}