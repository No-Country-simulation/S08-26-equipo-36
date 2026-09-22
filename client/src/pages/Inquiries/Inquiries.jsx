import { useState, useEffect } from "react";
import {
  Inbox,
  MessageSquare,
  Mail,
  Phone,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import styles from "./Inquiries.module.css";

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState("all");

  // Cargar las consultas reales desde el backend de Flask al abrir la vista
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/inquiries`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const formatted = data.data.map((item) => ({
            id: item.id,
            fullName: item.full_name,
            company: item.company,
            email: item.email,
            phone: item.phone,
            piece: item.piece,
            description: item.message,
            status: item.status,
            createdAt: item.created_at,
          }));
          setInquiries(formatted);
        }
      })
      .catch((err) => console.error("Error al cargar las consultas:", err));
  }, []);

  const filteredInquiries = inquiries.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return (
          <span className={`${styles.statusBadge} ${styles.badgeNew}`}>
            <Clock size={12} /> Nueva
          </span>
        );
      case "contacted":
        return (
          <span className={`${styles.statusBadge} ${styles.badgeContacted}`}>
            <MessageSquare size={12} /> En Contacto
          </span>
        );
      case "converted":
        return (
          <span className={`${styles.statusBadge} ${styles.badgeConverted}`}>
            <CheckCircle size={12} /> Convertida
          </span>
        );
      case "discarded":
        return (
          <span className={`${styles.statusBadge} ${styles.badgeDiscarded}`}>
            <XCircle size={12} /> Descartada
          </span>
        );
      default:
        return null;
    }
  };

  const handleConvertToRequest = (inquiry) => {
    alert(
      `Listo para transformar la consulta de ${inquiry.fullName} en una Solicitud Formal.`
    );
  };

  const filterTabs = [
    { key: "all", label: "Todas" },
    { key: "new", label: "Nuevas" },
    { key: "contacted", label: "En Contacto" },
    { key: "converted", label: "Convertidas" },
    { key: "discarded", label: "Descartadas" },
  ];

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    converted: inquiries.filter((i) => i.status === "converted").length,
    discarded: inquiries.filter((i) => i.status === "discarded").length,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Bandeja de Consultas</h1>
          <p>
            Leads comerciales y preguntas técnicas ingresadas desde la Landing
            Page
          </p>
        </div>
      </header>

      {/* Selector de filtros */}
      <div className={styles.filtersBar}>
        <div className={styles.statusTabs}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`${styles.tabBtn} ${filter === tab.key ? styles.tabActive : ""}`}
            >
              {tab.label}
              <span className={styles.counterBadge}>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de registros */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente / Empresa</th>
                <th>Requerimiento Inicial</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} className={styles.row}>
                    <td className={styles.dateCol}>
                      {inq.createdAt
                        ? new Date(inq.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Fecha s/d"}
                    </td>
                    <td className={styles.contactCol}>
                      <strong>{inq.fullName}</strong>
                      <span className={styles.companyText}>{inq.company}</span>
                    </td>
                    <td className={styles.messageCol}>
                      <div style={{ marginBottom: "0.2rem" }}>
                        <strong
                          style={{ color: "#ffffff", fontSize: "0.875rem" }}
                        >
                          {inq.piece || "Consulta general"}
                        </strong>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "#94a3b8",
                          lineHeight: "1.35",
                        }}
                      >
                        {inq.description}
                      </p>
                    </td>
                    <td>{getStatusBadge(inq.status)}</td>
                    <td>
                      <div className={styles.actionsCol}>
                        <a
                          href={`mailto:${inq.email}?subject=Consulta mecanizado - QualityTrack`}
                          className={styles.actionIconBtn}
                          title={`Enviar email a ${inq.email}`}
                        >
                          <Mail size={15} />
                        </a>
                        <a
                          href={`https://wa.me/${inq.phone ? inq.phone.replace(/[^0-9]/g, "") : ""}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionIconBtn}
                          title="Contactar vía WhatsApp"
                        >
                          <Phone size={15} />
                        </a>
                        <button
                          onClick={() => handleConvertToRequest(inq)}
                          disabled={
                            inq.status === "converted" ||
                            inq.status === "discarded"
                          }
                          className={styles.btnConvert}
                          title="Crear Solicitud formal con estos datos"
                        >
                          Convertir a Solicitud
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    <Inbox
                      size={36}
                      strokeWidth={1.5}
                      style={{ display: "block", margin: "0 auto 0.5rem" }}
                    />
                    No hay consultas registradas para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>  
  );
}
