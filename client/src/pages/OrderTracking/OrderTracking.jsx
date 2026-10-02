import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Cog,
  ShieldCheck,
  PackageCheck,
  Truck,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";
import styles from "./OrderTracking.module.css";

// Detección automática: en desarrollo local usa localhost:5000, en Vercel usa Render
// const API_BASE =
//   import.meta.env.VITE_API_BASE ||
//   (typeof window !== "undefined" && window.location.hostname === "localhost"
//     ? "http://localhost:5000/api"
//     : "https://qualitytrack-backend-rks5.onrender.com/api");

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://qualitytrack-backend-rks5.onrender.com/api";

// 5 pasos secuenciales del ciclo de vida de la orden
const STEPS = [
  {
    key: "creada",
    label: "Orden Creada",
    icon: FileText,
    desc: "Ingreso formal de la orden al sistema",
  },
  {
    key: "en_mecanizado",
    label: "En Mecanizado",
    icon: Cog,
    desc: "Torneado, fresado y operaciones en taller",
  },
  {
    key: "control_calidad",
    label: "Control de Calidad",
    icon: ShieldCheck,
    desc: "Verificación dimensional y tolerancias bajo plano",
  },
  {
    key: "liberada",
    label: "Liberada",
    icon: PackageCheck,
    desc: "Aprobada por calidad, lista para retiro o despacho",
  },
  {
    key: "entregada",
    label: "Entregada",
    icon: Truck,
    desc: "Pieza despachada y recibida conforme por el cliente",
  },
];

function getStatusIndex(status = "") {
  const s = status
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "_");

  if (s === "cancelada") return -1;
  if (["creada", "recibida", "pendiente"].includes(s)) return 0;
  if (["en_mecanizado", "mecanizado", "en_proceso", "taller"].includes(s))
    return 1;
  if (["control_calidad", "control_de_calidad", "calidad"].includes(s))
    return 2;
  if (["liberada", "finalizada", "lista"].includes(s)) return 3;
  if (["entregada", "completada"].includes(s)) return 4;
  return 0;
}

export default function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  const otQuery = searchParams.get("ot") || searchParams.get("codigo") || "";
  const [inputValue, setInputValue] = useState(otQuery);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrder = async (code) => {
    if (!code || !code.trim()) {
      setOrder(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const searchCode = code.toUpperCase().trim();

    try {
      // 1. Intento con endpoint público específico de seguimiento
      let res = await fetch(`${API_BASE}/ordenes/seguimiento/${encodeURIComponent(searchCode)}`);
      
      if (res.ok) {
        const data = await res.json();
        const found = data?.data || data;
        if (found && (found.numero || found.id_ot || found.pieza)) {
          setOrder(found);
          return;
        }
      }

      // 2. Consulta al listado general de órdenes
      res = await fetch(`${API_BASE}/ordenes`);
      if (!res.ok) {
        throw new Error(`Error del servidor (${res.status})`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.data || []);

      const found = list.find((o) => {
        const numCol = String(o.numero || o.numero_ot || o.nro_ot || o.codigo || "").toUpperCase().trim();
        const idOt = String(o.id_ot || o.id || "");
        return numCol === searchCode || idOt === searchCode;
      });

      if (found) {
        setOrder(found);
      } else {
        setError(`No encontramos ninguna orden registrada con el código "${code}". Verificá la numeración.`);
        setOrder(null);
      }
    } catch (err) {
      console.error("[Tracking] Error al consultar orden:", err);
      setError("No pudimos consultar el estado de la orden en este momento. Verificá la conexión con el servidor.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (otQuery) {
      Promise.resolve().then(() => {
        if (isMounted) {
          fetchOrder(otQuery);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [otQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSearchParams({ ot: inputValue.trim().toUpperCase() });
  };

  const rawStatus = order ? order.estado || order.estado_actual || "" : "";
  const statusIdx = getStatusIndex(rawStatus);
  const isCancelled = statusIdx === -1;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/landing" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver al Inicio
        </Link>
        <span className={styles.badgePortal}>Portal de Trazabilidad</span>
      </header>

      <main className={styles.content}>
        <section className={styles.hero}>
          <h1 className={styles.title}>Seguimiento de Producción</h1>
          <p className={styles.subtitle}>
            Consultá el estado y avance de tu pieza mecanizada en tiempo real
            con tu número de Orden de Trabajo.
          </p>

          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.inputWrap}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Ingresá tu código (ej: OT-0004)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={styles.input}
              />
            </div>
            <button
              type="submit"
              className={styles.btnSearch}
              disabled={loading}
            >
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </form>
        </section>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {order && !loading && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.otBadge}>
                  {order.numero || order.numero_ot || `OT-${String(order.id_ot).padStart(4, "0")}`}
                </span>
                <h2 className={styles.pieceTitle}>
                  {order.pieza ||
                    order.descripcion ||
                    "Pieza técnica en mecanizado"}
                </h2>
              </div>
              <div
                className={`${styles.statusPill} ${isCancelled ? styles.statusCancelled : ""}`}
              >
                {isCancelled ? <XCircle size={16} /> : <Clock size={16} />}
                <span>
                  {isCancelled ? "Orden Cancelada" : STEPS[statusIdx]?.label}
                </span>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <Layers size={16} />
                <div>
                  <label>Cantidad</label>
                  <p>{order.cantidad ? `${order.cantidad} u.` : "1 u."}</p>
                </div>
              </div>
              <div className={styles.detailItem}>
                <FileText size={16} />
                <div>
                  <label>Material</label>
                  <p>{order.material || "Acero según especificación"}</p>
                </div>
              </div>
              <div className={styles.detailItem}>
                <Calendar size={16} />
                <div>
                  <label>Entrega Estimada</label>
                  <p>
                    {order.fecha_estimada_fin ||
                      order.fecha_entrega ||
                      "A coordinar"}
                  </p>
                </div>
              </div>
            </div>

            {isCancelled ? (
              <div className={styles.cancelledNotice}>
                <XCircle size={24} />
                <div>
                  <h4>Esta orden de trabajo ha sido cancelada</h4>
                  <p>
                    Por favor comunicate con nuestro equipo técnico o comercial
                    para más detalles o consultas sobre este expediente.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.stepperContainer}>
                <div className={styles.timeline}>
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < statusIdx;
                    const isCurrent = idx === statusIdx;

                    return (
                      <div
                        key={step.key}
                        className={`${styles.stepItem} ${isCompleted ? styles.completed : ""} ${isCurrent ? styles.active : ""}`}
                      >
                        <div className={styles.iconCircle}>
                          {isCompleted ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Icon size={20} />
                          )}
                        </div>
                        <div className={styles.stepInfo}>
                          <h4 className={styles.stepLabel}>{step.label}</h4>
                          <p className={styles.stepDesc}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}