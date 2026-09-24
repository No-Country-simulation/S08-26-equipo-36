import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Inbox,
  MessageSquare,
  Mail,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import styles from "./Inquiries.module.css";
import ReplyInquiryModal from "../../components/inquiries/ReplyInquiryModal/ReplyInquiryModal"

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Inquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de respuesta
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carga inicial sin cascada de renders
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await fetch(`${API_BASE}/inquiries`);
        const data = await res.json();
        if (!ignore && data.status === "success") {
          const formatted = data.data.map((item) => ({
            id: item.id,
            fullName: item.full_name,
            company: item.company,
            email: item.email,
            phone: item.phone || "",
            piece: item.piece,
            material: item.material,
            quantity: item.quantity,
            description: item.message,
            status: item.status,
            createdAt: item.created_at,
          }));
          setInquiries(formatted);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error al cargar las consultas:", err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // Actualizar estado en el backend (PATCH)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)),
        );
      }
    } catch (err) {
      console.error("Error actualizando estado de consulta:", err);
    }
  };

  // Normalizador del número de teléfono para WhatsApp (Argentina)
  const formatearWhatsAppAR = (rawPhone) => {
    if (!rawPhone) return "";
    let clean = rawPhone.replace(/\D/g, ""); // Extrae únicamente dígitos

    // Si comienza con 0 (ej: 0351...), remueve el 0 inicial
    if (clean.startsWith("0")) {
      clean = clean.substring(1);
    }

    // Si tiene 54 pero le falta el 9 móvil (ej: 54351...)
    if (clean.startsWith("54") && !clean.startsWith("549")) {
      clean = "549" + clean.substring(2);
    }

    // Si es un número local de 10 dígitos (ej: 3511234567), añade el prefijo 549
    if (clean.length === 10) {
      clean = `549${clean}`;
    }

    return clean;
  };

  // Abrir modal de respuesta personalizada
  const handleOpenReplyModal = (inq) => {
    setSelectedInquiry(inq);
    setIsModalOpen(true);
  };

  // Callback ejecutado cuando el correo se despacha exitosamente
  const handleEmailSentSuccess = (id) => {
    handleUpdateStatus(id, "contacted");
  };

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

  const handleConvertToRequest = async (inquiry) => {
    try {
      const clientName = (inquiry.company || inquiry.fullName || "").trim();
      let clientId = null;

      // 1. Buscar si el cliente ya existe
      const resClientes = await fetch(`${API_BASE}/clientes`);
      const dataClientes = await resClientes.json();

      if (
        dataClientes?.status === "success" &&
        Array.isArray(dataClientes.data)
      ) {
        const found = dataClientes.data.find(
          (c) =>
            (c.razon_social || "").trim().toLowerCase() ===
              clientName.toLowerCase() ||
            (c.nombre || "").trim().toLowerCase() === clientName.toLowerCase()
        );
        if (found) {
          clientId = found.id_cliente || found.id;
        }
      }

      // 2. Si no existe, crearlo
      if (!clientId) {
        const resCreate = await fetch(`${API_BASE}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razon_social: clientName || "Cliente Web",
            contacto: inquiry.fullName || "",
            email: inquiry.email || "",
            telefono: inquiry.phone || "",
            ruc_nit: "",
            direccion: "",
            notas: `Generado automáticamente desde Consulta Web #${inquiry.id}`,
          }),
        });

        const dataCreate = await resCreate.json();
        if (dataCreate?.status === "success" && dataCreate.data) {
          clientId = dataCreate.data.id_cliente || dataCreate.data.id;
        }
      }

      // Texto unificado para análisis de cantidad y material
      const textToAnalyze = `${inquiry.piece || ""} ${inquiry.description || inquiry.message || ""}`;

      // 3. Extraer cantidad si está en el texto
      let detectedQty = inquiry.quantity || 1;
      if (!inquiry.quantity) {
        const match = textToAnalyze.match(
          /(\d+)\s*(unidades|piezas|unid|un\b)/i
        );
        if (match) {
          detectedQty = parseInt(match[1], 10);
        }
      }

      // 4. Detección de material
      let detectedMaterial = inquiry.material || "";
      if (!detectedMaterial) {
        const materialPatterns = [
          /\b(acero(?:\s+inoxidable)?(?:\s+sae)?(?:\s+\d{3,4}[a-z]?)?)\b/i,
          /\b(sae\s*\d{3,4}[a-z]?)\b/i,
          /\b(aluminio(?:\s+\d{3,4})?)\b/i,
          /\b(bronce(?:\s+[a-z]+)?)\b/i,
          /\b(fundici[oó]n(?:\s+nodular|\s+gris)?)\b/i,
          /\b(gril[oó]n|delrin|nylon|tefl[oó]n|aplon)\b/i,
        ];

        for (const regex of materialPatterns) {
          const match = textToAnalyze.match(regex);
          if (match) {
            const found = match[0].trim();
            detectedMaterial = found.charAt(0).toUpperCase() + found.slice(1);
            break;
          }
        }
      }

      // 5. Navegar a /solicitudes
      navigate("/solicitudes", {
        state: {
          openModal: true,
          prefillData: {
            inquiry_id: inquiry.id,
            id_cliente: clientId ? String(clientId) : "",
            pieza: inquiry.piece || "",
            cantidad: detectedQty,
            material: detectedMaterial,
            descripcion: inquiry.description || inquiry.message || "",
            prioridad: "Media",
          },
        },
      });
    } catch (err) {
      console.error(
        "[Inquiries] Error al transferir consulta a solicitud:",
        err
      );
      alert("Ocurrió un error al preparar la solicitud.");
    }
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

  const formatDateStacked = (dateString) => {
    if (!dateString) return { date: "Fecha s/d", time: "" };

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: "Fecha s/d", time: "" };

    const date = d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let time = d
      .toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\./g, "");

    return { date, time };
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

      {/* Barra de Filtros con contadores */}
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

      {/* Card Principal */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptySubtitle}>Cargando consultas...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <Inbox size={22} strokeWidth={1.75} />
            </div>
            <h3 className={styles.emptyTitle}>Sin consultas registradas</h3>
            <p className={styles.emptySubtitle}>
              Las preguntas técnicas e inquietudes que ingresen desde la Landing
              Page aparecerán aquí.
            </p>
          </div>
        ) : (
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
                {filteredInquiries.map((inq) => {
                  const wsPhone = formatearWhatsAppAR(inq.phone);
                  const wsMessage = encodeURIComponent(
                    `Hola ${inq.fullName}, te contactamos desde QualityTrack con respecto a tu consulta sobre: "${inq.piece || 'mecanizado'}".`
                  );
                  const wsUrl = wsPhone ? `https://wa.me/${wsPhone}?text=${wsMessage}` : "";

                  return (
                    <tr key={inq.id} className={styles.row}>
                      <td className={styles.dateCol}>
                        {(() => {
                          const { date, time } = formatDateStacked(inq.createdAt);
                          return (
                            <div className={styles.dateGroup}>
                              <span className={styles.dateMain}>{date}</span>
                              {time && (
                                <span className={styles.timeSub}>{time}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={styles.contactCol}>
                        <strong>{inq.fullName}</strong>
                        <span className={styles.companyText}>{inq.company}</span>
                      </td>
                      <td className={styles.messageCol}>
                        <div
                          style={{
                            marginBottom: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.45rem",
                          }}
                        >
                          <strong
                            style={{
                              color: "var(--text-white, #ffffff)",
                              fontSize: "0.875rem",
                            }}
                          >
                            {inq.piece || "Consulta general"}
                          </strong>
                          {(inq.material || inq.quantity) && (
                            <span
                              style={{
                                color: "var(--orange, #fd9f12)",
                                backgroundColor:
                                  "var(--orange-glow, rgba(253, 159, 18, 0.15))",
                                border:
                                  "1px solid var(--orange-border, rgba(253, 159, 18, 0.3))",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "0.72rem",
                                fontWeight: "500",
                              }}
                            >
                              {inq.material || "Mat. s/d"} ·{" "}
                              {inq.quantity ? `${inq.quantity} un.` : "Cant. s/d"}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8rem",
                            color: "var(--text-muted, #94a3b8)",
                            lineHeight: "1.4",
                          }}
                        >
                          {inq.description}
                        </p>
                      </td>
                      <td>{getStatusBadge(inq.status)}</td>
                      <td>
                        <div className={styles.actionsCol}>
                          <div className={styles.actionIconContainer}>
                            {/* Botón de Correo Institucional (Abre el Modal con texto libre) */}
                            <button
                              type="button"
                              className={styles.actionIconBtn}
                              title={`Responder por email a ${inq.email}`}
                              onClick={() => handleOpenReplyModal(inq)}
                            >
                              <Mail size={15} />
                            </button>

                            {/* Botón de WhatsApp con número directo y formateado */}
                            {wsUrl ? (
                              <a
                                href={wsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.actionIconBtn}
                                title={`Contactar vía WhatsApp (+${wsPhone})`}
                                onClick={() => {
                                  if (inq.status === "new")
                                    handleUpdateStatus(inq.id, "contacted");
                                }}
                              >
                                <svg
                                  fill="currentColor"
                                  width="15px"
                                  height="15px"
                                  viewBox="-1.66 0 740.824 740.824"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M630.056 107.658C560.727 38.271 468.525.039 370.294 0 167.891 0 3.16 164.668 3.079 367.072c-.027 64.699 16.883 127.855 49.016 183.523L0 740.824l194.666-51.047c53.634 29.244 114.022 44.656 175.481 44.682h.151c202.382 0 367.128-164.689 367.21-367.094.039-98.088-38.121-190.32-107.452-259.707m-259.758 564.8h-.125c-54.766-.021-108.483-14.729-155.343-42.529l-11.146-6.613-115.516 30.293 30.834-112.592-7.258-11.543c-30.552-48.58-46.689-104.729-46.665-162.379C65.146 198.865 202.065 62 370.419 62c81.521.031 158.154 31.81 215.779 89.482s89.342 134.332 89.311 215.859c-.07 168.242-136.987 305.117-305.211 305.117m167.415-228.514c-9.176-4.591-54.286-26.782-62.697-29.843-8.41-3.061-14.526-4.591-20.644 4.592-6.116 9.182-23.7 29.843-29.054 35.964-5.351 6.122-10.703 6.888-19.879 2.296-9.175-4.591-38.739-14.276-73.786-45.526-27.275-24.32-45.691-54.36-51.043-63.542-5.352-9.183-.569-14.148 4.024-18.72 4.127-4.11 9.175-10.713 13.763-16.07 4.587-5.356 6.116-9.182 9.174-15.303 3.059-6.122 1.53-11.479-.764-16.07-2.294-4.591-20.643-49.739-28.29-68.104-7.447-17.886-15.012-15.466-20.644-15.746-5.346-.266-11.469-.323-17.585-.323-6.117 0-16.057 2.296-24.468 11.478-8.41 9.183-32.112 31.374-32.112 76.521s32.877 88.763 37.465 94.885c4.587 6.122 64.699 98.771 156.741 138.502 21.891 9.45 38.982 15.093 52.307 19.323 21.981 6.979 41.983 5.994 57.793 3.633 17.628-2.633 54.285-22.19 61.932-43.616 7.646-21.426 7.646-39.791 5.352-43.617-2.293-3.826-8.41-6.122-17.585-10.714"
                                  />
                                </svg>
                              </a>
                            ) : null}
                          </div>

                          <button
                            onClick={() => handleConvertToRequest(inq)}
                            disabled={
                              inq.status === "converted" ||
                              inq.status === "discarded"
                            }
                            className={styles.btnConvert}
                            title="Convertir a Solicitud Formal"
                          >
                            Convertir a Solicitud
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal interactivo de respuesta oficial */}
      <ReplyInquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inquiry={selectedInquiry}
        onEmailSent={handleEmailSentSuccess}
      />
    </div>
  );
}