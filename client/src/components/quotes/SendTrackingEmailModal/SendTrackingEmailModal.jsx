import { useState, useEffect } from "react";
import { Mail, Check, Copy, X, MessageCircle, Send, Loader2 } from "lucide-react";
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

  const otNumero = orderData?.numero || orderData?.numero_ot || `OT-${orderData?.id_ot || ""}`;
  const clienteNombre = orderData?.cliente_nombre || orderData?.cliente || "Estimado cliente";
  const pieza = orderData?.pieza || orderData?.descripcion || "Pieza mecanizada";
  const trackingUrl = `${window.location.origin}/seguimiento?ot=${encodeURIComponent(otNumero)}`;

// Búsqueda del cliente en la API para obtener teléfono y email actualizados
  useEffect(() => {
    if (!isOpen || !orderData) return;

    let isMounted = true;

    async function obtenerDatosContactoCliente() {
      try {
        const res = await api.getClientes();
        const lista = Array.isArray(res) ? res : (res?.data || []);
        const target = (clienteNombre || "").trim().toLowerCase();

        // Buscar coincidencia por razón social o contacto
        const clienteEncontrado = lista.find(
          (c) =>
            (c.razon_social || "").trim().toLowerCase() === target ||
            (c.contacto || "").trim().toLowerCase() === target ||
            (orderData?.id_cliente && c.id_cliente === orderData.id_cliente)
        );

        if (isMounted && clienteEncontrado) {
          // Teléfono
          const tel = clienteEncontrado.telefono || clienteEncontrado.celular || clienteEncontrado.phone || "";
          if (tel) {
            setResolvedPhone(tel);
          }

          // Email (solo si no teníamos uno previamente)
          const nuevoEmail = clienteEncontrado.email || clienteEncontrado.correo || "";
          if (nuevoEmail) {
            setResolvedEmail((prev) => prev || nuevoEmail);
          }
        }
      } catch (err) {
        console.warn("[SendTrackingModal] Error al obtener teléfono del cliente:", err);
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
    `Hola ${clienteNombre}! Te compartimos el enlace de seguimiento para tu Orden de Trabajo ${otNumero} (${pieza}): ${trackingUrl}`
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
            Se generó el expediente para <strong>{clienteNombre}</strong>. Presioná <strong>Enviar Correo</strong> para despachar la notificación oficial con el enlace de seguimiento directo.
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
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          {sendError && (
            <p className={styles.errorMessage}>
              {sendError}
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={sending}>
            Cancelar
          </button>

          <div className={styles.mainActions}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnWhatsApp}
            >
              <MessageCircle size={15} />
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
                  <Loader2 size={15} className={styles.spin} />
                  Enviando...
                </>
              ) : sentSuccess ? (
                <>
                  <Check size={15} color="#10b981" />
                  ¡Enviado!
                </>
              ) : (
                <>
                  <Send size={15} />
                  Enviar Correo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}