import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Inbox,
  X,
  Upload,
  ChevronDown,
  Check,
} from "lucide-react";
import ConfirmDialog from "../../../common/ConfirmDialog/ConfirmDialog";
import PDFViewerModal from "../../../pdf/PDFViewerModal";
import { supabase } from "../../../../lib/supabase";
import { api } from "../../../../api/apiClient";
import styles from "./DocumentsTab.module.css";

const DOCUMENT_TYPES = [
  "Plano de Ingeniería",
  "Especificación Técnica",
  "Certificado de Materia Prima",
  "Orden de Compra",
  "Factura",
  "Registro de Producción",
  "Control de Calidad",
  "Documentación de Entrega",
  "Otro",
];

function getThemeByType(type) {
  if (
    type === "Certificado de Materia Prima" ||
    type === "Especificación Técnica"
  ) {
    return "amber";
  }
  if (
    type === "Orden de Compra" ||
    type === "Factura" ||
    type === "Control de Calidad"
  ) {
    return "green";
  }
  return "blue";
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const parts = String(dateString).split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
}

// Subcomponente modal aislado para controlar la subida
function DocumentUploadModal({ isOpen, onClose, onUpload }) {
  const [form, setForm] = useState({
    type: "Plano de Ingeniería",
    name: "",
    description: "",
    date: getTodayIso(),
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const fileInputRef = useRef(null);
  const typeMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.name.trim()) {
        setForm((prev) => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setIsUploading(true);
      await onUpload({ form, selectedFile });
      onClose();
    } catch (err) {
      console.error("[DocumentUploadModal] Error en carga:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={() => !isUploading && onClose()}
    >
      <div
        className={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nuevo documento</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={() => !isUploading && onClose()}
            aria-label="Cerrar modal"
            disabled={isUploading}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup} ref={typeMenuRef}>
            <label className={styles.formLabel}>Tipo de documento</label>
            <button
              type="button"
              className={`${styles.docTypeTrigger} ${
                isTypeDropdownOpen ? styles.docTypeTriggerActive : ""
              }`}
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              disabled={isUploading}
            >
              <span>{form.type}</span>
              <ChevronDown size={15} className={styles.chevronIcon} />
            </button>

            {isTypeDropdownOpen && (
              <div className={styles.docTypeMenu}>
                {DOCUMENT_TYPES.map((typeOption) => (
                  <button
                    key={typeOption}
                    type="button"
                    className={`${styles.docTypeOption} ${
                      form.type === typeOption
                        ? styles.docTypeOptionSelected
                        : ""
                    }`}
                    onClick={() => {
                      setForm({ ...form, type: typeOption });
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    <span>{typeOption}</span>
                    {form.type === typeOption && (
                      <Check size={14} className={styles.checkIcon} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Nombre <span className={styles.reqStar}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Plano rev. 2"
              className={styles.formInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Archivo (PDF)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className={styles.uploadInputHidden}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div
              className={styles.uploadZone}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <Upload size={16} />
              <span>
                {selectedFile ? selectedFile.name : "Seleccionar archivo PDF..."}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Descripción</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre revisión, normas o uso..."
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              disabled={isUploading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Fecha</label>
            <input
              type="date"
              className={styles.formInput}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={isUploading}
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={isUploading}
            >
              {isUploading ? "Subiendo..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DocumentsTab({ otId, ot }) {
  const { id } = useParams();
  const currentOtId = id || otId || ot?.id_ot || ot?.id;

  const [documents, setDocuments] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!currentOtId) {
      setDocuments([]);
      return;
    }
    try {
      if (typeof api.getDocumentosOrden === "function") {
        const res = await api.getDocumentosOrden(currentOtId);
        if (res?.status === "success" && Array.isArray(res.data)) {
          const mapped = res.data.map((doc) => ({
            id: doc.id_documento || doc.id,
            name: doc.nombre,
            type: doc.tipo_documento,
            theme: getThemeByType(doc.tipo_documento),
            date: doc.fecha_subida,
            description: doc.descripcion || "",
            fileUrl: doc.ruta_archivo || doc.url,
          }));
          setDocuments(mapped);
          return;
        }
      }
      setDocuments([]);
    } catch (err) {
      console.error("[DocumentsTab] Error al cargar documentos:", err);
      setDocuments([]);
    }
  }, [currentOtId]);

  useEffect(() => {
    let isMounted = true;
    async function fetchDocs() {
      if (isMounted) await loadDocuments();
    }
    fetchDocs();
    return () => {
      isMounted = false;
    };
  }, [loadDocuments]);

  const handleUploadDocument = async ({ form, selectedFile }) => {
    let finalName = form.name.trim();
    if (!finalName.includes(".")) {
      finalName = `${finalName}.pdf`;
    }

    let finalUrl = "";

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = `ot_${currentOtId}/${Date.now()}_${cleanName}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documentos-ot")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error en Supabase: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("documentos-ot")
        .getPublicUrl(uploadData.path);

      finalUrl = urlData.publicUrl;
    }

    const payloadBackend = {
      nombre: finalName,
      tipo_documento: form.type,
      ruta_archivo: finalUrl,
      descripcion: form.description.trim() || null,
      subido_por: ot?.responsable || "Oficina Técnica",
    };

    if (typeof api.subirDocumentoOrden === "function") {
      await api.subirDocumentoOrden(currentOtId, payloadBackend);
      await loadDocuments();
    }
  };

  const handleOpenViewer = (doc) => {
    setSelectedDoc({
      url: doc.fileUrl,
      title: `${doc.name} — ${doc.type}`,
    });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (toDelete.fileUrl && toDelete.fileUrl.includes("documentos-ot/")) {
        try {
          const path = toDelete.fileUrl.split("documentos-ot/")[1];
          if (path) {
            await supabase.storage
              .from("documentos-ot")
              .remove([decodeURIComponent(path)]);
          }
        } catch (storageErr) {
          console.warn("[DocumentsTab] No se eliminó el binario en storage:", storageErr);
        }
      }

      if (typeof api.eliminarDocumentoOrden === "function") {
        await api.eliminarDocumentoOrden(toDelete.id);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== toDelete.id));
    } catch (err) {
      console.error("[DocumentsTab] Error al eliminar documento:", err);
    } finally {
      setToDelete(null);
    }
  };

  const getThemeClass = (theme) => {
    if (theme === "amber") return styles.iconAmber;
    if (theme === "green") return styles.iconGreen;
    return styles.iconBlue;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Documentación</h3>
          <p className={styles.subtitle}>
            {documents.length} documentos vinculados a esta OT
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={styles.btnAddDoc}
        >
          <Plus size={15} strokeWidth={2.5} /> Documento
        </button>
      </div>

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconCircle}>
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h4 className={styles.emptyTitle}>Sin documentación</h4>
          <p className={styles.emptySubtitle}>
            Sube planos, certificados, órdenes de compra y comprobantes
            vinculados a esta OT.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div
                  className={`${styles.iconBox} ${getThemeClass(doc.theme)}`}
                  onClick={() => handleOpenViewer(doc)}
                  title="Abrir visor"
                >
                  <FileText size={18} />
                </div>
                <div
                  className={styles.info}
                  onClick={() => handleOpenViewer(doc)}
                >
                  <p className={styles.fileName} title={doc.name}>
                    {doc.name}
                  </p>
                  <p className={styles.fileType}>{doc.type}</p>
                  <p className={styles.fileDate}>{formatDate(doc.date)}</p>
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(doc)}
                    className={`${styles.btnAction} ${styles.btnPreview}`}
                    title="Previsualizar documento"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(doc)}
                    className={`${styles.btnAction} ${styles.btnDelete}`}
                    title="Eliminar documento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {doc.description && (
                <div className={styles.cardBottom}>
                  <p className={styles.fileDescription} title={doc.description}>
                    {doc.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Carga con montado limpio */}
      <DocumentUploadModal
        key={isModalOpen ? "modal-open" : "modal-closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUploadDocument}
      />

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar documento"
        description={
          toDelete ? (
            <>
              ¿Eliminar el documento <strong>"{toDelete.name}"</strong>? Esta
              acción no se puede deshacer.
            </>
          ) : (
            ""
          )
        }
      />

      <PDFViewerModal
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        pdfUrl={selectedDoc?.url}
        title={selectedDoc?.title}
      />
    </div>
  );
}