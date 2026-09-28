import { useState, useEffect } from "react";
import {
  Mail,
  Check,
  Copy,
  X,
  Send,
} from "lucide-react";
import Spinner from "../../common/Spinner/Spinner";
import styles from "./SendTrackingEmailModal.module.css";
import { api } from "../../../api/apiClient";

export default function SendTrackingEmailModal({ isOpen, onClose, orderData }) {
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados para datos de contacto traídos desde la tabla clientes
  const [resolvedEmail, setResolvedEmail] = useState(orderData?.email || "");
  const [resolvedPhone, setResolvedPhone] = useState("");

  const otNumero =
    orderData?.numero || orderData?.numero_ot || `OT-${orderData?.id_ot || ""}`;
  const clienteNombre =
    orderData?.cliente_nombre || orderData?.cliente || "Estimado cliente";
  const pieza =
    orderData?.pieza || orderData?.descripcion || "Pieza mecanizada";
  const trackingUrl = `${window.location.origin}/seguimiento?ot=${encodeURIComponent(otNumero)}`;

  // Búsqueda del cliente en la API para obtener teléfono y email actualizados
  useEffect(() => {
    if (!isOpen || !orderData) return;

    let isMounted = true;

    async function obtenerDatosContactoCliente() {
      try {
        const res = await api.getClientes();
        const lista = Array.isArray(res) ? res : res?.data || [];
        const target = (clienteNombre || "").trim().toLowerCase();

        // Buscar coincidencia por razón social o contacto
        const clienteEncontrado = lista.find(
          (c) =>
            (c.razon_social || "").trim().toLowerCase() === target ||
            (c.contacto || "").trim().toLowerCase() === target ||
            (orderData?.id_cliente && c.id_cliente === orderData.id_cliente),
        );

        if (isMounted && clienteEncontrado) {
          // Teléfono
          const tel =
            clienteEncontrado.telefono ||
            clienteEncontrado.celular ||
            clienteEncontrado.phone ||
            "";
          if (tel) {
            setResolvedPhone(tel);
          }

          // Email (solo si no teníamos uno previamente)
          const nuevoEmail =
            clienteEncontrado.email || clienteEncontrado.correo || "";
          if (nuevoEmail) {
            setResolvedEmail((prev) => prev || nuevoEmail);
          }
        }
      } catch (err) {
        console.warn(
          "[SendTrackingModal] Error al obtener teléfono del cliente:",
          err,
        );
      }
    }

    obtenerDatosContactoCliente();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderData, clienteNombre]);

  if (!isOpen || !orderData) return null;

  // Formatear el número de teléfono para WhatsApp
  const formatearTelefonoWhatsApp = (tel) => {
    if (!tel) return "";
    let clean = tel.replace(/\D/g, ""); // Quita espacios, guiones, paréntesis y signos +

    // Si comienza con 0 (ej: 0351...), quitar el cero inicial
    if (clean.startsWith("0")) {
      clean = clean.substring(1);
    }

    // Si es un número argentino de 10 dígitos (código de área + número, ej: 351xxxxxxx)
    // se le agrega el código de país y el 9 móvil: 549 + número
    if (clean.length === 10) {
      clean = `549${clean}`;
    }

    return clean;
  };

  const phoneParaWs = formatearTelefonoWhatsApp(resolvedPhone);

  const wsMessage = encodeURIComponent(
    `Hola ${clienteNombre}! Te compartimos el enlace de seguimiento para tu Orden de Trabajo ${otNumero} (${pieza}): ${trackingUrl}`,
  );

  // Si se encontró teléfono, abre directamente el chat; si no, abre el selector habitual
  const whatsappLink = phoneParaWs
    ? `https://wa.me/${phoneParaWs}?text=${wsMessage}`
    : `https://wa.me/?text=${wsMessage}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
    }
  };

  const handleSendDirectEmail = async () => {
    if (!resolvedEmail) {
      setSendError("No hay un correo registrado para este cliente.");
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      const payload = {
        email: resolvedEmail,
        numero: otNumero,
        cliente: clienteNombre,
        pieza: pieza,
        tracking_url: trackingUrl,
      };

      const res = await api.enviarEmailTracking(payload);

      if (res?.status === "success") {
        setSentSuccess(true);
        setTimeout(() => {
          setSentSuccess(false);
          onClose();
        }, 1800);
      } else {
        setSendError(res?.message || "No se pudo enviar el correo.");
      }
    } catch (err) {
      setSendError(err.message || "Error al conectar con el servidor.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <Mail size={20} />
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.title}>Enviar Notificación al Cliente</h3>
            <span className={styles.otBadge}>{otNumero}</span>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>
            Se generó el expediente para <strong>{clienteNombre}</strong>.
            Presioná <strong>Enviar Correo</strong> para despachar la
            notificación oficial con el enlace de seguimiento directo.
          </p>

          <div className={styles.metaBox}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Pieza:</span>
              <span className={styles.metaValue}>{pieza}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Destinatario:</span>
              <span className={styles.metaValue}>
                {resolvedEmail || "Sin email registrado"}
              </span>
            </div>
            {resolvedPhone && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>WhatsApp:</span>
                <span className={styles.metaValue}>{resolvedPhone}</span>
              </div>
            )}
          </div>

          <div className={styles.linkContainer}>
            <span className={styles.linkText}>{trackingUrl}</span>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyLink}
              title="Copiar enlace"
            >
              {copiedLink ? (
                <Check size={14} color="#10b981" />
              ) : (
                <Copy size={14} />
              )}
              <span>{copiedLink ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          {sendError && <p className={styles.errorMessage}>{sendError}</p>}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={sending}
          >
            Cancelar
          </button>

          <div className={styles.mainActions}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWhatsApp}
            >
              <svg
                fill="#25d366"
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
              WhatsApp
            </a>

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSendDirectEmail}
              disabled={sending || sentSuccess}
            >
              {sending ? (
                <>
                  <Spinner size="sm" isButton />
                  <span>Enviando...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <Check size={15} color="#10b981" />
                  <span>¡Enviado!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Enviar Correo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}