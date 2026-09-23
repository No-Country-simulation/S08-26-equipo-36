import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";
import RequestModal from "../../components/requests/RequestModal/RequestModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Spinner from "../../components/common/Spinner/Spinner";
import { api } from "../../api/apiClient";
import styles from "./Requests.module.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function formatDate(dateString) {
  if (!dateString) return "—";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

const formatRequest = (s) => ({
  ...s,
  id: s.id_solicitud || s.id,
  piece: s.pieza || s.piece || "",
  client_name: s.cliente_nombre || s.client_name || "",
  date: s.fecha || s.date || "",
  quantity: s.cantidad || s.quantity || 1,
  priority: s.prioridad || s.priority || "Media",
  status: s.estado || s.status || "Pendiente",
  material: s.material || "",
});

const formatClient = (c) => ({
  ...c,
  id: c.id_cliente || c.id,
  nombre: c.razon_social || c.nombre || "",
});

const STATUS_CONFIG = {
  aprobada: { label: "Aprobada", className: styles.statusAprobada },
  cotizada: { label: "Cotizada", className: styles.statusCotizada },
  pendiente: { label: "Pendiente", className: styles.statusPendiente },
};

const PRIORITY_CONFIG = {
  alta: { label: "Alta", className: styles.prioAlta },
  urgente: { label: "Urgente", className: styles.prioAlta },
  media: { label: "Media", className: styles.prioMedia },
  baja: { label: "Baja", className: styles.prioBaja },
};

export default function Requests() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [pendingInquiryId, setPendingInquiryId] = useState(null);

  // Recarga tras acciones del usuario (crear, editar, eliminar)
  const reloadSolicitudes = async () => {
    try {
      const res = await api.getSolicitudes();
      if (res?.status === "success" && Array.isArray(res.data)) {
        setItems(res.data.map(formatRequest));
      }
    } catch (err) {
      console.error("[Requests] Error al recargar solicitudes:", err);
    }
  };

  const reloadClients = async () => {
    try {
      const res = await api.getClientes();
      if (res?.status === "success" && Array.isArray(res.data)) {
        const formatted = res.data.map(formatClient);
        setClients(formatted);
        return formatted;
      }
    } catch (err) {
      console.error("[Requests] Error al recargar lista de clientes:", err);
    }
    return [];
  };

  // Carga inicial sincronizada
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
        const [resSol, resCli] = await Promise.all([
          api.getSolicitudes(),
          api.getClientes(),
          minDelay,
        ]);

        if (!isMounted) return;

        if (resSol?.status === "success" && Array.isArray(resSol.data)) {
          setItems(resSol.data.map(formatRequest));
        }

        if (resCli?.status === "success" && Array.isArray(resCli.data)) {
          setClients(resCli.data.map(formatClient));
        }
      } catch (err) {
        console.error("[Requests] Error al cargar datos iniciales:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detectar navegación desde "Convertir a Solicitud" en Inquiries
  useEffect(() => {
    let isMounted = true;

    async function handlePrefillFromInquiry() {
      if (!loading && location.state?.openModal && location.state?.prefillData) {
        const prefill = location.state.prefillData;

        // Guardamos el ID de la consulta para marcarla como convertida únicamente tras guardar
        if (prefill.inquiry_id) {
          setPendingInquiryId(prefill.inquiry_id);
        }

        // 1. Forzar recarga de clientes para garantizar que el nuevo figure en el desplegable
        let currentClients = clients;
        try {
          const resCli = await api.getClientes();
          if (resCli?.status === "success" && Array.isArray(resCli.data)) {
            currentClients = resCli.data.map(formatClient);
            if (isMounted) setClients(currentClients);
          }
        } catch (e) {
          console.error("[Requests] Error actualizando clientes para prefill:", e);
        }

        // 2. Resolver id_cliente (por ID enviado o por coincidencia de nombre)
        let resolvedClientId = prefill.id_cliente ? String(prefill.id_cliente) : "";
        if (!resolvedClientId && prefill.cliente_nombre) {
          const match = currentClients.find(
            (c) =>
              c.nombre.toLowerCase().includes(prefill.cliente_nombre.toLowerCase()) ||
              prefill.cliente_nombre.toLowerCase().includes(c.nombre.toLowerCase())
          );
          if (match) resolvedClientId = String(match.id);
        }

        // 3. Inicializar el modal como CREACIÓN (sin id de solicitud)
        if (isMounted) {
          setEditingItem({
            id_cliente: resolvedClientId,
            pieza: prefill.pieza || "",
            cantidad: prefill.cantidad || 1,
            material: prefill.material || "",
            prioridad: prefill.prioridad || "Media",
            descripcion: prefill.descripcion || "",
            especificaciones: prefill.especificaciones || "",
            fecha: new Date().toISOString().split("T")[0],
          });

          setIsModalOpen(true);
        }

        // 4. Limpiar el state del router
        window.history.replaceState({}, document.title);
      }
    }

    handlePrefillFromInquiry();

    return () => {
      isMounted = false;
    };
  }, [loading, location.state]);

  const handleOpenNew = () => {
    reloadClients();
    setEditingItem(null);
    setPendingInquiryId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    reloadClients();
    setEditingItem(item);
    setPendingInquiryId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setPendingInquiryId(null);
  };

  const handleSave = async (formData) => {
    try {
      // Si tiene id de solicitud persistido, es edición
      if (editingItem && (editingItem.id_solicitud || editingItem.id)) {
        if (typeof api.actualizarSolicitud === "function") {
          await api.actualizarSolicitud(editingItem.id || editingItem.id_solicitud, formData);
          await reloadSolicitudes();
        } else {
          setItems((prev) =>
            prev.map((it) =>
              it.id === (editingItem.id || editingItem.id_solicitud)
                ? { ...it, ...formData, id: editingItem.id || editingItem.id_solicitud }
                : it
            )
          );
        }
      } else {
        // Creación de nueva solicitud
        const clienteObj = clients.find(
          (c) => String(c.id) === String(formData.id_cliente)
        );

        const payload = {
          id_cliente: formData.id_cliente,
          cliente_nombre: clienteObj ? clienteObj.nombre : formData.cliente_nombre || "",
          fecha: formData.fecha || new Date().toISOString().split("T")[0],
          pieza: formData.pieza,
          cantidad: Number(formData.cantidad) || 1,
          material: formData.material || "",
          prioridad: formData.prioridad || "Media",
          descripcion: formData.descripcion || "",
          especificaciones: formData.especificaciones || "",
          estado: "Pendiente",
        };

        const res = await api.crearSolicitud(payload);
        if (res?.status === "success") {
          // Si venía desde una consulta web, la marcamos convertida en MySQL
          if (pendingInquiryId) {
            try {
              await fetch(`${API_BASE}/inquiries/${pendingInquiryId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "converted" }),
              });
            } catch (statusErr) {
              console.warn("[Requests] No se pudo actualizar estado de la consulta a convertida:", statusErr);
            }
            setPendingInquiryId(null);
          }
          await reloadSolicitudes();
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("[Requests] Error al guardar solicitud:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (typeof api.eliminarSolicitud === "function") {
        await api.eliminarSolicitud(toDelete.id);
        await reloadSolicitudes();
      } else {
        setItems((prev) => prev.filter((it) => it.id !== toDelete.id));
      }
    } catch (err) {
      console.error("[Requests] Error al eliminar solicitud:", err);
    } finally {
      setToDelete(null);
    }
  };

  const filtered = items.filter((s) => {
    const piece = s.piece || s.pieza || "";
    const client = s.client_name || s.cliente_nombre || "";
    const mat = s.material || "";
    return [piece, client, mat].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <Spinner fullScreen text="Cargando solicitudes..." />;
  }

  return (
    <div className={styles.container}>
      {/* Cabecera */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Solicitudes</h1>
          <p className={styles.subtitle}>
            Requerimientos de clientes que inician el circuito de un trabajo.
          </p>
        </div>
        <button type="button" onClick={handleOpenNew} className={styles.btnPrimary}>
          <Plus size={16} strokeWidth={2.5} /> Nueva solicitud
        </button>
      </header>

      {/* Buscador */}
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar solicitud..."
          className={styles.searchInput}
        />
      </div>

      {/* Tabla o Estado Vacío */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? "Sin solicitudes encontradas" : "Sin solicitudes"}
          description={
            search
              ? "No hay solicitudes que coincidan con la búsqueda."
              : "Agrega tu primera solicitud para empezar a registrar solicitudes."
          }
          actionLabel={!search ? "Nueva solicitud" : null}
          onAction={!search ? handleOpenNew : null}
        />
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Cant.</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const prioKey = (s.priority || "media").toLowerCase();
                  const prio = PRIORITY_CONFIG[prioKey] || PRIORITY_CONFIG.media;

                  const statusKey = (s.status || "pendiente").toLowerCase();
                  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendiente;

                  return (
                    <tr key={s.id}>
                      <td>
                        <div className={styles.pieceCell}>
                          <FileText size={16} className={styles.pieceIcon} />
                          <div>
                            <p className={styles.pieceName}>{s.piece}</p>
                            {s.material && (
                              <p className={styles.pieceMaterial}>{s.material}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{s.client_name || "—"}</td>
                      <td>{formatDate(s.date)}</td>
                      <td>{s.quantity}</td>
                      <td>
                        <span className={`${styles.badge} ${prio.className}`}>
                          <span className={styles.dot} />
                          {prio.label}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${status.className}`}>
                          <span className={styles.dot} />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className={styles.iconBtn}
                            title="Editar solicitud"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(s)}
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Eliminar solicitud"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <RequestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingItem}
        clients={clients}
      />

      {/* Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar solicitud"
        description={
          toDelete
            ? `¿Eliminar la solicitud de "${toDelete.piece || toDelete.pieza}"? Esta acción no se puede deshacer.`
            : ""
        }
      />
    </div>
  );
}