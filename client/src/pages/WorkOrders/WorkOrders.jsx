import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Factory, ChevronRight, Inbox, SearchX, FilterX } from "lucide-react";
import Spinner from "../../components/common/Spinner/Spinner";
import { api } from "../../api/apiClient";
import styles from "./WorkOrders.module.css";

function formatDate(dateString) {
  if (!dateString) return "—";
  const parts = String(dateString).split("T")[0].split(" ")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

const OT_ESTADOS = {
  creada: { label: "Creada", className: styles.statusCreada },
  mecanizado: { label: "En Mecanizado", className: styles.statusMecanizado },
  calidad: { label: "Control Calidad", className: styles.statusCalidad },
  liberada: { label: "Liberada", className: styles.statusLiberada },
  entregada: { label: "Entregada", className: styles.statusEntregada },
  cancelada: { label: "Cancelada", className: styles.statusCancelada },
};

const PRIORIDAD_CONFIG = {
  urgente: { label: "Urgente", className: styles.prioAlta },
  alta: { label: "Alta", className: styles.prioAlta },
  media: { label: "Media", className: styles.prioMedia },
  baja: { label: "Baja", className: styles.prioBaja },
};

const EMPTY_STATE_TITLES = {
  creada: "Sin órdenes Creadas",
  mecanizado: "Sin órdenes en Mecanizado",
  calidad: "Sin órdenes en Control Calidad",
  liberada: "Sin órdenes Liberadas",
  entregada: "Sin órdenes Entregadas",
  cancelada: "Sin órdenes Canceladas",
};

export default function WorkOrders() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Mapeo entre estados del backend y los tabs de la interfaz
  const normalizeEstado = (st) => {
    const s = (st || "creada").toLowerCase();
    if (s === "en_proceso") return "mecanizado";
    if (s === "control_calidad") return "calidad";
    if (s === "finalizada") return "liberada";
    return s;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadOrdenes() {
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
        const [res] = await Promise.all([api.getOrdenes(), minDelay]);

        if (isMounted && res?.status === "success" && Array.isArray(res.data)) {
          setItems(
            res.data.map((o) => ({
              ...o,
              id: o.id_ot || o.id,
              estado: o.estado_actual || o.estado,
            }))
          );
        }
      } catch (err) {
        console.error("[WorkOrders] Error al cargar órdenes de trabajo:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrdenes();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = items.filter((o) => {
    const num = o.numero || `OT-${o.id}`;
    const pieza = o.pieza || "";
    const cliente = o.cliente_nombre || "";

    const matchSearch = [num, pieza, cliente]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const estadoNormalizado = normalizeEstado(o.estado);
    const matchEstado = filtroEstado === "todos" || estadoNormalizado === filtroEstado;

    return matchSearch && matchEstado;
  });

  const estadosKeys = ["todos", ...Object.keys(OT_ESTADOS)];

  const renderEmptyState = () => {
    if (filtroEstado === "todos" && !search.trim()) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin órdenes de trabajo</h4>
          <p className={styles.emptySubtitle}>
            Aprueba una cotización para generar automáticamente la primera OT.
          </p>
        </div>
      );
    }

    if (search.trim() !== "") {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <SearchX size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin resultados</h4>
          <p className={styles.emptySubtitle}>
            No se encontraron órdenes que coincidan con "<strong>{search}</strong>".
          </p>
          <button
            type="button"
            className={styles.emptyClearBtn}
            onClick={() => setSearch("")}
          >
            Limpiar búsqueda
          </button>
        </div>
      );
    }

    const emptyTitle = EMPTY_STATE_TITLES[filtroEstado] || "Sin órdenes en este estado";

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIconCircle}>
          <FilterX size={22} strokeWidth={1.8} />
        </div>
        <h4 className={styles.emptyTitle}>{emptyTitle}</h4>
        <p className={styles.emptySubtitle}>
          No hay órdenes de trabajo en este estado actualmente.
        </p>
        <button
          type="button"
          className={styles.emptyClearBtn}
          onClick={() => setFiltroEstado("todos")}
        >
          Ver todas las órdenes
        </button>
      </div>
    );
  };

  if (loading) {
    return <Spinner fullScreen text="Cargando órdenes de trabajo..." />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Órdenes de Trabajo</h1>
          <p className={styles.subtitle}>
            Expedientes únicos de cada trabajo, con trazabilidad completa.
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por OT, pieza o cliente..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersScroll}>
          {estadosKeys.map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`${styles.filterBtn} ${
                filtroEstado === est ? styles.filterBtnActive : ""
              }`}
            >
              {est === "todos" ? "Todas" : OT_ESTADOS[est].label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "16%" }}>N° OT</th>
                  <th style={{ width: "24%" }}>Pieza</th>
                  <th style={{ width: "20%" }}>Cliente</th>
                  <th style={{ width: "8%" }}>Cant.</th>
                  <th style={{ width: "12%" }}>Entrega est.</th>
                  <th style={{ width: "10%" }}>Prioridad</th>
                  <th style={{ width: "10%" }}>Estado</th>
                  <th style={{ width: "4%", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const num = o.numero || `OT-${String(o.id).padStart(4, "0")}`;
                  const cant = Number(o.cantidad) || 1;
                  const fecha = o.fecha_entrega_estimada || o.fecha_creacion;

                  const prioKey = (o.prioridad || "media").toLowerCase();
                  const prio = PRIORIDAD_CONFIG[prioKey] || PRIORIDAD_CONFIG.media;

                  const estadoKey = normalizeEstado(o.estado);
                  const estado = OT_ESTADOS[estadoKey] || OT_ESTADOS.creada;

                  return (
                    <tr
                      key={o.id}
                      className={styles.rowLink}
                      onClick={() => navigate(`/ordenes/${o.id}`)}
                    >
                      <td>
                        <div className={styles.otCell}>
                          <div className={styles.otIconBox}>
                            <Factory size={16} />
                          </div>
                          <span className={styles.otNumber}>{num}</span>
                        </div>
                      </td>
                      <td className={styles.pieceName}>{o.pieza}</td>
                      <td>{o.cliente_nombre || "—"}</td>
                      <td>{cant}</td>
                      <td>{formatDate(fecha)}</td>
                      <td>
                        <span className={`${styles.badge} ${prio.className}`}>
                          <span className={styles.dot} />
                          {prio.label}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${estado.className}`}>
                          <span className={styles.dot} />
                          {estado.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <ChevronRight size={16} className={styles.chevronIcon} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}