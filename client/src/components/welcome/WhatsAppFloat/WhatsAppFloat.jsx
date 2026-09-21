import styles from "./WhatsAppFloat.module.css";

export default function WhatsAppFloat() {
  // Podés reemplazar con el número de la empresa (código de país + código de área + número)
  const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE || "5493510000000";
  const defaultMessage = encodeURIComponent(
    "Hola, me comunico desde la web de QualityTrack. Quisiera consultar por el mecanizado de una pieza."
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.floatBtn}
      aria-label="Contactar por WhatsApp para cotizaciones"
    >
   <img src="whatsapp.svg" alt="" className={styles.whatsappIcon} />
   
    </a>
  );
}