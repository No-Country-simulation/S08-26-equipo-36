import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Mail, Phone, Search, Users } from "lucide-react";
import ClientModal from "../../components/clients/ClientModal/ClientModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Spinner from "../../components/common/Spinner/Spinner";
import { api } from "../../api/apiClient";
import styles from "./Clients.module.css";

// Normalizador de entidades de cliente
const formatClient = (c) => ({
  ...c,
  id: c.id_cliente || c.id,
  nombre: c.razon_social || c.nombre || "",
  ruc_nit: c.ruc_nit || c.cuit || "",
});

export default function Clientes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);

  // Recarga reactiva tras acciones del usuario (crear, editar o eliminar)
  const reloadClientes = async () => {
    try {
      const res = await api.getClientes();
      if (res?.status === "success" && Array.isArray(res.data)) {
        setItems(res.data.map(formatClient));
      }
    } catch (err) {
      console.error("[Clients] Error al recargar clientes:", err);
    }
  };

  // Carga inicial sincronizada para evitar advertencias de renderizado en cascada
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
        const [res] = await Promise.all([api.getClientes(), minDelay]);

        if (isMounted && res?.status === "success" && Array.isArray(res.data)) {
          setItems(res.data.map(formatClient));
        }
      } catch (err) {
        console.error("[Clients] Error al cargar clientes:", err);
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

  const handleOpenNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (formData) => {
    const payload = {
      razon_social: formData.nombre || formData.razon_social,
      contacto: formData.contacto || "",
      ruc_nit: formData.cuit || formData.ruc_nit || "",
      email: formData.email || "",
      telefono: formData.telefono || "",
      direccion: formData.direccion || "",
      notas: formData.notas || "",
    };

    try {
      if (editingClient) {
        if (typeof api.actualizarCliente === "function") {
          await api.actualizarCliente(editingClient.id, payload);
          await reloadClientes();
        } else {
          // Actualización optimista en memoria en caso de no contar aún con endpoint PUT
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingClient.id
                ? { ...item, ...payload, id: editingClient.id, nombre: payload.razon_social }
                : item
            )
          );
        }
      } else {
        const res = await api.crearCliente(payload);
        if (res?.status === "success") {
          await reloadClientes();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("[Clients] Error al guardar cliente:", err);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;

    try {
      if (typeof api.eliminarCliente === "function") {
        await api.eliminarCliente(toDelete.id);
        await reloadClientes();
      } else {
        // Baja en memoria si la API aún no expone DELETE
        setItems((prev) => prev.filter((c) => c.id !== toDelete.id));
      }
    } catch (err) {
      console.error("[Clients] Error al eliminar cliente:", err);
    } finally {
      setToDelete(null);
    }
  };

  const filtered = items.filter((c) =>
    [c.nombre, c.contacto, c.email, c.ruc_nit]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <Spinner fullScreen text="Cargando clientes..." />;
  }

  return (
    <div className={styles.container}>
      {/* Cabecera */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>
            Empresas y contactos que solicitan trabajos de mecanizado.
          </p>
        </div>
        <button type="button" onClick={handleOpenNew} className={styles.btnPrimary}>
          <Plus size={16} strokeWidth={2.5} /> Nuevo cliente
        </button>
      </header>

      {/* Buscador */}
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className={styles.searchInput}
        />
      </div>

      {/* Grilla o Estado Vacío */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Sin clientes encontrados" : "Sin clientes"}
          description={
            search
              ? "No hay empresas que coincidan con la búsqueda."
              : "Agrega tu primer cliente para empezar a registrar solicitudes."
          }
          actionLabel={!search ? "Nuevo cliente" : null}
          onAction={!search ? handleOpenNew : null}
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((c) => (
            <article key={c.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardIdentity}>
                  <div className={styles.avatarBox}>
                    <Users size={18} />
                  </div>
                  <div className={styles.nameCol}>
                    <p className={styles.clientName}>{c.nombre}</p>
                    {c.contacto && <p className={styles.contactName}>{c.contacto}</p>}
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className={styles.iconBtn}
                    title="Editar cliente"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(c)}
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Eliminar cliente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className={styles.infoList}>
                {c.email && (
                  <div className={styles.infoItem}>
                    <Mail size={14} className={styles.infoIcon} />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.telefono && (
                  <div className={styles.infoItem}>
                    <Phone size={14} className={styles.infoIcon} />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.ruc_nit && <span className={styles.cuitBadge}>ID Fiscal: {c.ruc_nit}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Alta / Edición */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        initialData={editingClient}
      />

      {/* Confirmación de Borrado */}
      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar cliente"
        description={
          toDelete
            ? `¿Eliminar el cliente "${toDelete.nombre}"? Esta acción no se puede deshacer.`
            : ""
        }
      />
    </div>
  );
}