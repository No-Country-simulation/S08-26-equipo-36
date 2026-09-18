import { useEffect } from "react";
import { Download, X } from "lucide-react";
import styles from "./PDFViewerModal.module.css";

export default function PDFViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  title = "Documento Técnico",
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Descarga universal para strings Base64 o URLs de Supabase/backend
  const handleDownload = () => {
    if (!pdfUrl) return;

    const cleanFileName = title
      ? `${title.split("—")[0].trim().replace(/\s+/g, "_")}.pdf`
      : "documento_tecnico.pdf";

    if (pdfUrl.startsWith("data:")) {
      try {
        const arr = pdfUrl.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "application/pdf";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = cleanFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error("[PDFViewerModal] Error al procesar descarga Base64:", err);
      }
    } else {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = cleanFileName;
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h3 className={styles.title}>📄 {title}</h3>
            <span className={styles.subtitle}>
              Visualización técnica y tolerancias de mecanizado
            </span>
          </div>

          <div className={styles.headerActions}>
            {pdfUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className={styles.btnDownloadHeader}
                title="Descargar archivo en el equipo"
              >
                <Download size={14} strokeWidth={2.2} />
                <span>Descargar PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
            >
              <X size={14} className={styles.closeIcon} />
              <span>Cerrar (Esc)</span>
            </button>
          </div>
        </header>

        <main className={styles.viewerContainer}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={title}
              className={styles.pdfObject}
            />
          ) : (
            <div className={styles.fallbackBox}>
              <h4 className={styles.fallbackTitle}>Sin archivo vinculado</h4>
              <p className={styles.fallbackDesc}>
                Este registro no contiene un archivo PDF adjunto o no se encuentra disponible.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}