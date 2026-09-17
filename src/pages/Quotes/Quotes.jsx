import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileCheck, Search, Check, X, ArrowRightCircle, Pencil, Trash2 } from "lucide-react";
import QuoteModal from "../../components/quotes/QuoteModal/QuoteModal";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Spinner from "../../components/common/Spinner/Spinner";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { api } from "../../api/apiClient";
import styles from "./Quotes.module.css";

function currency(val) {
  const n = Number(val) || 0;
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const parts = String(dateString).split("T")[0].split(" ")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

const formatQuote = (c) => ({
  ...c,
  id: c.id_cotizacion || c.id,
  solicitud_id: c.solicitud_id,
  cliente_id: c.id_cliente,
  fecha: c.fecha_emision || c.fecha,
});

const formatSolicitud = (s) => ({
  ...s,
  id: s.id_solicitud || s.id,
  pieza: s.pieza || s.piece,
  cliente_nombre: s.cliente_nombre || s.client_name,
});

const STATUS_CONFIG = {
  pendiente: { label: "Pendiente", className: styles.statusPendiente },
  aprobada: { label: "Aprobada", className: styles.statusAprobada },
  rechazada: { label: "Rechazada", className: styles.statusRechazada },
};

export default function Quotes() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch] = useState("");

  const reloadData = async () => {
    try {
      const [resCot, resSol] = await Promise.all([
        api.getCotizaciones(),
        api.getSolicitudes(),
      ]);

      if (resCot?.status === "success" && Array.isArray(resCot.data)) {
        setItems(resCot.data.map(formatQuote));
      }

      if (resSol?.status === "success" && Array.isArray(resSol.data)) {
        setSolicitudes(resSol.data.map(formatSolicitud));
      }
    } catch (err) {
      console.error("[Quotes] Error al recargar cotizaciones/solicitudes:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
        const [resCot, resSol] = await Promise.all([
          api.getCotizaciones(),
          api.getSolicitudes(),
          minDelay,
        ]);

        if (!isMounted) return;

        if (resCot?.status === "success" && Array.isArray(resCot.data)) {
          setItems(resCot.data.map(formatQuote));
        }

        if (resSol?.status === "success" && Array.isArray(resSol.data)) {
          setSolicitudes(resSol.data.map(formatSolicitud));
        }
      } catch (err) {
        console.error("[Quotes] Error al cargar cotizaciones iniciales:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableRequests = solicitudes.filter(
    (s) =>
      !items.some((c) => String(c.solicitud_id) === String(s.id)) ||
      (editingItem && String(editingItem.solicitud_id) === String(s.id))
  );

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (quote) => {
    setEditingItem(quote);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      const sol = solicitudes.find((s) => String(s.id) === String(formData.solicitud_id));
      const precio_unitario = Number(formData.precio_unitario) || 0;
      const qty = Number(sol?.cantidad || formData.cantidad || 1);
      const precio_total = precio_unitario * qty;

      if (editingItem) {
        await api.actualizarCotizacion(editingItem.id, {
          precio_unitario,
          precio_total,
          fecha: formData.fecha,
          validez: formData.validez,
          detalle: formData.detalle,
        });
      } else {
        const payload = {
          solicitud_id: formData.solicitud_id,
          id_cliente: sol?.id_cliente,
          cliente_nombre: sol?.cliente_nombre || "",
          pieza: sol?.pieza || formData.pieza || "",
          cantidad: qty,
          descripcion_requerimiento: sol?.descripcion || "",
          precio_unitario,
          precio_total,
          fecha: formData.fecha || new Date().toISOString().split("T")[0],
          validez: formData.validez || "30 días",
          detalle: formData.detalle || "",
        };
        await api.crearCotizacion(payload);
      }

      await reloadData();
      setIsModalOpen(false);
    } catch (err) {
      console.error("[Quotes] Error al guardar cotización:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.eliminarCotizacion(toDelete.id);
      setToDelete(null);
      await reloadData();
    } catch (err) {
      console.error("[Quotes] Error al eliminar cotización:", err);
    }
  };

  const setEstado = async (c, nuevoEstado) => {
    try {
      const res = await api.actualizarEstadoCotizacion(c.id, nuevoEstado);
      if (res?.status === "success") {
        await reloadData();
        if (nuevoEstado === "aprobada") {
          navigate("/ordenes");
        }
      }
    } catch (err) {
      console.error("[Quotes] Error al actualizar estado de cotización:", err);
    }
  };

  const filtered = items.filter((c) =>
    [c.pieza, c.cliente_nombre]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <Spinner fullScreen text="Cargando cotizaciones..." />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Cotizaciones</h1>
          <p className={styles.subtitle}>
            Ofertas generadas a partir de solicitudes de clientes.
          </p>
        </div>
        <button type="button" onClick={handleOpenNew} className={styles.btnPrimary}>
          <Plus size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
          Nueva cotización
        </button>
      </header>

      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cotización..."
          className={styles.searchInput}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={search ? "Sin cotizaciones encontradas" : "Sin cotizaciones"}
          description={
            search
              ? "No se encontraron cotizaciones con ese criterio de búsqueda."
              : "Genera tu primera cotización a partir de una solicitud registrada."
          }
          actionLabel={!search && availableRequests.length > 0 ? "Nueva cotización" : null}
          onAction={!search && availableRequests.length > 0 ? handleOpenNew : null}
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((c) => {
            const statusKey = (c.estado || "pendiente").toLowerCase();
            const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendiente;

            return (
              <article key={c.id} className={styles.card}>
                <div>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIdentity}>
                      <div className={styles.iconBox}>
                        <FileCheck size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className={styles.pieceName}>{c.pieza}</p>
                        <p className={styles.clientName}>{c.cliente_nombre}</p>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${statusObj.className}`}>
                      <span className={styles.dot} />
                      {statusObj.label}
                    </span>
                  </div>

                  <div className={styles.priceRow}>
                    <div>
                      <p className={styles.totalPrice}>{currency(c.precio_total)}</p>
                      <p className={styles.unitDetail}>
                        {c.cantidad} u. · {currency(c.precio_unitario)} c/u
                      </p>
                    </div>
                    <span className={styles.dateText}>{formatDate(c.fecha)}</span>
                  </div>
                </div>

                <footer className={styles.cardFooter}>
                  {statusKey === "pendiente" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEstado(c, "aprobada")}
                        className={styles.btnApprove}
                      >
                        <Check size={14} style={{ marginRight: 4 }} />
                        Aprobar → OT
                      </button>
                      <button
                        type="button"
                        onClick={() => setEstado(c, "rechazada")}
                        className={styles.btnReject}
                      >
                        <X size={14} style={{ marginRight: 4 }} />
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className={styles.iconBtn}
                        title="Editar cotización"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(c)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger || ""}`}
                        title="Eliminar cotización"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : statusKey === "aprobada" && c.orden_trabajo_id ? (
                    <button
                      type="button"
                      onClick={() => navigate("/ordenes")}
                      className={styles.btnViewOt}
                    >
                      <ArrowRightCircle size={14} style={{ marginRight: 4 }} />
                      Ver OT
                    </button>
                  ) : (
                    <span className={styles.validityText}>
                      Validez: {c.validez || "30 días"}
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <QuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        availableRequests={availableRequests}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar cotización"
        description={
          toDelete ? (
            <>
              ¿Eliminar la cotización de <strong>"{toDelete.pieza}"</strong>? Esta acción no se puede deshacer.
            </>
          ) : (
            ""
          )
        }
      />
    </div>
  );
}