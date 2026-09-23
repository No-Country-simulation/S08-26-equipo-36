import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Bell,
} from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import NewOrderModal from "../../components/dashboard/NewOrderModal/NewOrderModal";
import KanbanBoard from "../../components/dashboard/kanban/KanbanBoard";
import { api } from "../../api/apiClient";
import styles from "./Dashboard.module.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ots, setOts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);

  // Cargar órdenes, clientes y consultas nuevas
  const loadDashboardData = useCallback(async () => {
    try {
      const [resOts, resClientes] = await Promise.all([
        api.getOrdenes(),
        typeof api.getClientes === "function"
          ? api.getClientes()
          : Promise.resolve({ data: [] }),
      ]);

      if (resOts?.status === "success" && Array.isArray(resOts.data)) {
        const ordenesFormateadas = resOts.data.map((o) => ({
          ...o,
          id: o.id_ot || o.id,
          cliente: o.cliente_nombre || "Cliente General",
          estado: o.estado_actual || o.estado || "creada",
          prioridad:
            (o.prioridad || "Media").charAt(0).toUpperCase() +
            (o.prioridad || "Media").slice(1).toLowerCase(),
        }));
        setOts(ordenesFormateadas);
      }

      if (
        resClientes?.status === "success" &&
        Array.isArray(resClientes.data)
      ) {
        setClientes(
          resClientes.data.map((c) => ({
            id: c.id_cliente || c.id,
            nombre: c.razon_social || c.nombre,
          })),
        );
      }

      // Consultar leads con status 'new' para la campanita
      try {
        const resInq = await fetch(`${API_BASE}/inquiries?status=new`);
        const dataInq = await resInq.json();
        if (dataInq?.status === "success" && Array.isArray(dataInq.data)) {
          setNewInquiriesCount(dataInq.data.length);
        }
      } catch (err) {
        console.warn(
          "[Dashboard] No se pudieron cargar las consultas para la notificación:",
          err,
        );
      }
    } catch (err) {
      console.error(
        "[Dashboard] Error al cargar datos del centro de operaciones:",
        err,
      );
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

  const handleMove = async (ot, targetStatus) => {
    setOts((prev) =>
      prev.map((o) =>
        String(o.id) === String(ot.id) ? { ...o, estado: targetStatus } : o,
      ),
    );

    const backendStatus =
      targetStatus === "liberada" ? "finalizada" : targetStatus;

    try {
      if (typeof api.actualizarEstadoOrden === "function") {
        await api.actualizarEstadoOrden(ot.id, backendStatus);
      }
    } catch (err) {
      console.error(
        "[Dashboard] Error actualizando estado de orden vía drag & drop:",
        err,
      );
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

  const enMecanizado = ots.filter(
    (o) => o.estado === "en_proceso" || o.estado === "mecanizado",
  ).length;
  const controlCalidad = ots.filter(
    (o) => o.estado === "control_calidad" || o.estado === "calidad",
  ).length;
  const liberadas = ots.filter(
    (o) =>
      o.estado === "liberada" ||
      o.estado === "finalizada" ||
      o.estado === "entregada",
  ).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Centro de Operaciones</h1>
          <p className={styles.subtitle}>
            Flujo de órdenes en tiempo real (arrastrá las tarjetas para cambiar
            de estado).
          </p>
        </div>

        {/* Grupo de acciones: Campanita de notificaciones + Botón Crear OT */}
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={styles.btnPrimary}
          >
            <Plus size={16} strokeWidth={2.5} /> Nueva Orden de Trabajo
          </button>
          <button
            type="button"
            className={styles.notificationBtn}
            onClick={() => navigate("/consultas")}
            title={
              newInquiriesCount > 0
                ? `${newInquiriesCount} consultas nuevas`
                : "Bandeja de Consultas"
            }
          >
            <Bell size={18} />
            {newInquiriesCount > 0 && (
              <span className={styles.notificationBadge}>
                {newInquiriesCount > 99 ? "99+" : newInquiriesCount}
              </span>
            )}
          </button>
        </div>
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

      {/* Tablero Kanban modular */}
      <KanbanBoard
        ots={ots}
        onMove={handleMove}
        onCardClick={handleCardClick}
      />

      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateOT}
        clientes={clientes}
      />
    </div>
  );
}
