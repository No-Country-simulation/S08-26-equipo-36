import { useState, useEffect } from 'react';
import { ArrowLeft, X, FileText, ChevronRight, Download } from 'lucide-react';
import { api } from '../../../api/apiClient';
import styles from './BlueprintViewer.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export default function BlueprintViewer({ order, onClose }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(() => Boolean(order?.id || order?.id_ot));

  const otId = order?.id || order?.id_ot;

  useEffect(() => {
    if (!otId) return;

    let active = true;

    api.getDocumentosOrden(otId)
      .then((res) => {
        if (!active) return;
        if (res?.status === 'success' && Array.isArray(res.data)) {
          setDocs(
            res.data.map((d) => ({
              id: d.id_documento,
              name: d.nombre,
              tipo: d.tipo_documento,
              date: formatDate(d.fecha_subida),
              url: d.ruta_archivo || d.url || '',
            }))
          );
        } else {
          setDocs([]);
        }
      })
      .catch((err) => {
        console.error('[BlueprintViewer] Error al obtener documentos:', err);
        if (active) setDocs([]);
      })
      .finally(() => {
        if (active) setLoadingDocs(false);
      });

    return () => {
      active = false;
    };
  }, [otId]);

  if (!order) return null;

  const handleDownload = () => {
    if (!selectedDoc?.url) return;
    const link = document.createElement('a');
    link.href = selectedDoc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = selectedDoc.name || 'documento.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const orderIdentifier = order.numero || order.id || 'S/N';

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modalBox} ${selectedDoc ? styles.modalBoxExpanded : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            {selectedDoc ? (
              <>
                <button
                  type="button"
                  className={styles.btnBack}
                  onClick={() => setSelectedDoc(null)}
                >
                  <ArrowLeft size={16} /> Volver
                </button>
                <h3 className={styles.titleText}>
                  <span className={styles.woCode}>{orderIdentifier}</span> · {selectedDoc.name}
                </h3>
              </>
            ) : (
              <h3 className={styles.titleText}>
                <span className={styles.woCode}>{orderIdentifier}</span> · Especificaciones y planos
              </h3>
            )}
          </div>

          <button
            type="button"
            className={styles.btnClose}
            onClick={onClose}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </header>

        {/* CUERPO */}
        {selectedDoc ? (
          <div className={`${styles.body} ${styles.bodyViewer}`}>
            <iframe
              src={selectedDoc.url ? `${selectedDoc.url}#toolbar=1&navpanes=0` : 'about:blank'}
              title={selectedDoc.name}
              className={styles.pdfFrame}
            />
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.specsBox}>
              <p className={styles.specsLabel}>Especificaciones técnicas</p>
              <p className={styles.specsContent}>
                {order.especificaciones || 'Sin especificaciones técnicas registradas.'}
              </p>
            </div>

            <div>
              <p className={styles.sectionTitle}>Documentos vinculados</p>
              {loadingDocs ? (
                <p className={styles.statusMessage}>Cargando documentos...</p>
              ) : docs.length === 0 ? (
                <p className={styles.statusMessage}>
                  No hay planos ni documentos vinculados a esta OT.
                </p>
              ) : (
                <div className={styles.docList}>
                  {docs.map((doc) => (
                    <div
                      key={doc.id || doc.name}
                      className={styles.docCard}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className={styles.docLeft}>
                        <div className={styles.pdfIconBox}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className={styles.docName}>{doc.name}</p>
                          <p className={styles.docDate}>
                            {doc.date} · Clic para visualizar
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className={styles.docArrow} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIE DE MODAL */}
        <footer className={`${styles.footer} ${selectedDoc ? styles.footerWithDownload : ''}`}>
          {selectedDoc && (
            <button
              type="button"
              className={styles.btnDownload}
              onClick={handleDownload}
            >
              <Download size={15} /> Descargar
            </button>
          )}

          <button
            type="button"
            className={styles.btnCloseModal}
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}