import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Search,
  ArrowLeft,
  User,
  Package,
  ClipboardList,
  ShieldCheck,
  FileText,
  AlertTriangle,
  X,
  Inbox,
} from 'lucide-react';
import Spinner from '../../components/common/Spinner/Spinner';
import ShopFloorCard from '../../components/shopFloor/ShopFloorCard/ShopFloorCard';
import BlueprintViewer from '../../components/shopFloor/BlueprintViewer/BlueprintViewer';
import QuickQcModal from '../../components/shopFloor/QuickQcModal/QuickQcModal';
import { api } from '../../api/apiClient';
import styles from './ShopFloor.module.css';
import EmptyState from '../../components/common/EmptyState/EmptyState';

const ACTIVE_STATUSES = ['creada', 'en_proceso', 'mecanizado', 'control_calidad', 'calidad'];

const INITIAL_INCIDENT_FORM = {
  title: '',
  description: '',
  reporter: '',
};

export default function ShopFloor() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [operations, setOperations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');

  // Modales
  const [blueprintOrder, setBlueprintOrder] = useState(null);
  const [blueprintDocs, setBlueprintDocs] = useState([]);
  const [qcModalOpen, setQcModalOpen] = useState(false);

  // Diálogo de Falla Crítica
  const [incidentOrder, setIncidentOrder] = useState(null);
  const [incidentForm, setIncidentForm] = useState(INITIAL_INCIDENT_FORM);

  useEffect(() => {
    let active = true;
    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));

    Promise.all([api.getOrdenes(), minDelay])
      .then(([res]) => {
        if (!active) return;
        if (res?.status === 'success' && Array.isArray(res.data)) {
          const activas = res.data
            .map((o) => ({
              ...o,
              id: o.id_ot,
              estado: o.estado_actual,
            }))
            .filter((o) => ACTIVE_STATUSES.includes((o.estado || '').toLowerCase()));
          setOrders(activas);
        }
      })
      .catch((err) => {
        console.error('[ShopFloor] Error al cargar órdenes:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Abrir vista detalle de tableta
  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    const otKey = order.id || order.id_ot;

    const storedOps = localStorage.getItem(`qt_ops_${otKey}`);
    if (storedOps) {
      try {
        setOperations(JSON.parse(storedOps));
      } catch {
        setOperations([]);
      }
    } else {
      setOperations([]);
    }

    const storedDocs = localStorage.getItem(`qt_docs_${otKey}`);
    if (storedDocs) {
      try {
        setDocuments(JSON.parse(storedDocs));
      } catch {
        setDocuments([]);
      }
    } else {
      setDocuments([]);
    }
  };

  // Alternar completado de operación en la hoja de ruta
  const handleToggleOperation = (op) => {
    const nextStatus = op.status === 'completada' ? 'pendiente' : 'completada';
    const updated = operations.map((o) =>
      o.id === op.id ? { ...o, status: nextStatus } : o
    );
    setOperations(updated);
    localStorage.setItem(
      `qt_ops_${selectedOrder.id || selectedOrder.id_ot}`,
      JSON.stringify(updated)
    );
  };

  // Escalar OT a Control de Calidad
  const handleEscalateToQc = async (order) => {
    const targetId = order.id || order.id_ot;
    try {
      await api.actualizarEstadoOrden(targetId, 'control_calidad');
      setOrders((prev) =>
        prev.map((o) => (o.id === targetId ? { ...o, estado: 'control_calidad' } : o))
      );
      if (selectedOrder && (selectedOrder.id === targetId || selectedOrder.id_ot === targetId)) {
        setSelectedOrder((prev) => ({ ...prev, estado: 'control_calidad' }));
      }
    } catch (err) {
      console.error('[ShopFloor] Error al derivar orden a Calidad:', err);
    }
  };

  // Abrir visor de planos
  const handleOpenBlueprint = (order) => {
    setBlueprintOrder(order);
    const otKey = order.id || order.id_ot;
    const numKey = order.numero;

    const candidates = [
      `qt_docs_${otKey}`,
      `qualitytrack_docs_${otKey}`,
      `qt_docs_${numKey}`,
      'qt_docs',
      'qualitytrack_docs',
    ];

    let foundDocs = [];
    for (const key of candidates) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (key === 'qt_docs' || key === 'qualitytrack_docs') {
              const matched = parsed.filter(
                (d) =>
                  String(d.otId) === String(otKey) ||
                  String(d.orden_trabajo_id) === String(otKey) ||
                  d.otNumero === numKey
              );
              if (matched.length > 0) {
                foundDocs = matched;
                break;
              }
            } else {
              foundDocs = parsed;
              break;
            }
          }
        } catch (e) {
          console.error('[ShopFloor] Error leyendo documentos cacheados:', e);
        }
      }
    }
    setBlueprintDocs(foundDocs);
  };

  // Reportar desvío crítico (No Conformidad)
  const handleOpenIncident = (order) => {
    setIncidentOrder(order);
    setIncidentForm({
      title: '',
      description: '',
      reporter: order.responsable || '',
    });
  };

  const handleIncidentChange = (e) => {
    const { name, value } = e.target;
    setIncidentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.title.trim() || !incidentOrder) return;

    const otId = incidentOrder.id || incidentOrder.id_ot;
    const cleanReporter = incidentForm.reporter.trim() || incidentOrder.responsable || 'Operario de Planta';

    try {
      await api.crearNoConformidadOrden(otId, {
        title: incidentForm.title.trim(),
        description: incidentForm.description.trim(),
        reporter: cleanReporter,
        severity: 'critica',
        origin: 'Producción / Taller',
      });

      const storageKey = `qt_nc_${otId}`;
      const stored = localStorage.getItem(storageKey);
      let ncList = [];
      if (stored) {
        try {
          ncList = JSON.parse(stored);
        } catch {
          ncList = [];
        }
      }

      const newNc = {
        id: `nc-${Date.now()}`,
        title: incidentForm.title.trim(),
        description: incidentForm.description.trim(),
        severity: 'critica',
        status: 'abierta',
        origin: 'Producción / Taller',
        reporter: cleanReporter,
        correctiveAction: null,
        date: new Date().toLocaleDateString('es-AR'),
      };

      localStorage.setItem(storageKey, JSON.stringify([newNc, ...ncList]));
      setIncidentOrder(null);
      setIncidentForm(INITIAL_INCIDENT_FORM);
    } catch (err) {
      console.error('[ShopFloor] Error al guardar no conformidad:', err);
    }
  };

  // Registrar control de calidad rápido (QC)
  const handleSaveQc = async (form) => {
    if (!selectedOrder) return;
    const otId = selectedOrder.id || selectedOrder.id_ot;

    try {
      await api.crearControlOrden(otId, {
        tipo: form.type,
        resultado: form.result,
        medicion: form.measurement.trim() || null,
        inspector: form.inspector.trim() || 'Inspector Taller',
        observaciones: form.notes.trim() || null,
      });

      const key = `qt_quality_${otId}`;
      const stored = localStorage.getItem(key);
      let qcList = [];
      if (stored) {
        try {
          qcList = JSON.parse(stored);
        } catch {
          qcList = [];
        }
      }

      const newQc = {
        id: `qc-${Date.now()}`,
        type: form.type,
        status: form.result,
        medicion: form.measurement.trim() || null,
        observaciones: form.notes.trim() || null,
        inspector: form.inspector.trim() || 'Inspector Taller',
        fecha: new Date().toLocaleDateString('es-AR'),
      };

      localStorage.setItem(key, JSON.stringify([newQc, ...qcList]));
    } catch (err) {
      console.error('[ShopFloor] Error al registrar control de calidad:', err);
    }
  };

  const filteredOrders = orders.filter((o) =>
    [o.numero, o.pieza, o.cliente_nombre]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completedCount = operations.filter((o) => o.status === 'completada').length;
  const progressPercent =
    operations.length > 0 ? Math.round((completedCount / operations.length) * 100) : 0;

  if (loading) {
    return <Spinner fullScreen text="Cargando órdenes de taller..." />;
  }

  // Vista detalle tableta
  if (selectedOrder) {
    const isMachining =
      selectedOrder.estado === 'en_proceso' || selectedOrder.estado === 'mecanizado';

    return (
      <div className={styles.container}>
        <div className={styles.detailTopBar}>
          <div className={styles.detailTopInner}>
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className={styles.btnExit}
            >
              <ArrowLeft size={16} /> Volver a OTs
            </button>

            <div className={styles.detailHeaderInfo}>
              <p className={styles.detailOtNum}>{selectedOrder.numero}</p>
              <p className={styles.detailPiece}>{selectedOrder.pieza}</p>
            </div>

            <span
              className={`${styles.badge} ${
                isMachining ? styles.badgeMecanizado : styles.badgeCalidad
              }`}
            >
              <span className={styles.badgeDot} />
              {isMachining ? 'En Mecanizado' : 'Control de Calidad'}
            </span>

            <button
              type="button"
              onClick={() => navigate('/')}
              className={styles.btnExit}
              title="Volver al escritorio"
            >
              <Monitor size={16} /> Escritorio
            </button>
          </div>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.metaGrid4}>
            <div className={styles.metaBox}>
              <p className={styles.metaBoxLabel}>
                <User size={12} /> Cliente
              </p>
              <p className={styles.metaBoxVal}>{selectedOrder.cliente_nombre || '—'}</p>
            </div>
            <div className={styles.metaBox}>
              <p className={styles.metaBoxLabel}>
                <Package size={12} /> Cantidad
              </p>
              <p className={styles.metaBoxVal}>{Number(selectedOrder.cantidad) || 1} u.</p>
            </div>
            <div className={styles.metaBox}>
              <p className={styles.metaBoxLabel}>Material</p>
              <p className={styles.metaBoxVal}>{selectedOrder.material || '—'}</p>
            </div>
            <div className={styles.metaBox}>
              <p className={styles.metaBoxLabel}>Entrega Estimada</p>
              <p className={styles.metaBoxVal}>
                {selectedOrder.fecha_entrega_estimada || '—'}
              </p>
            </div>
          </div>

          {selectedOrder.especificaciones && (
            <div className={styles.specsAlertBox}>
              <p className={styles.specsAlertTitle}>Especificaciones Técnicas</p>
              <p className={styles.specsAlertText}>{selectedOrder.especificaciones}</p>
            </div>
          )}

          <div className={styles.progressHeader}>
            <h2 className={styles.progressTitle}>
              <ClipboardList size={18} /> Hoja de Ruta
            </h2>
            <span className={styles.progressStat}>
              {completedCount}/{operations.length} · {progressPercent}%
            </span>
          </div>

          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={styles.tabletActionRow}>
            <button
              type="button"
              onClick={() => setQcModalOpen(true)}
              className={styles.btnTabletQc}
            >
              <ShieldCheck size={18} /> Registrar Control Calidad
            </button>
            <button
              type="button"
              onClick={() => handleOpenBlueprint(selectedOrder)}
              className={styles.btnTabletDocs}
            >
              <FileText size={18} /> Ver Planos ({documents.length})
            </button>
          </div>

          <div className={styles.opsList}>
            {operations.length === 0 ? (
              <p className={styles.emptyOpsText}>
                No hay operaciones asignadas a esta hoja de ruta.
              </p>
            ) : (
              operations.map((op, idx) => {
                const isDone = op.status === 'completada';
                return (
                  <div key={op.id || idx} className={styles.opCard}>
                    <div className={styles.opLeft}>
                      <div className={styles.opStepNum}>{op.step || (idx + 1) * 10}</div>
                      <div>
                        <p className={styles.opTitle}>{op.name}</p>
                        <p className={styles.opMeta}>
                          {op.operator || '—'} · {op.machine || 'Taller'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleOperation(op)}
                      className={`${styles.btnOpAction} ${
                        isDone ? styles.btnOpDone : styles.btnOpPending
                      }`}
                    >
                      {isDone ? 'Completada ✓' : 'Completar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <QuickQcModal
          isOpen={qcModalOpen}
          onClose={() => setQcModalOpen(false)}
          onSave={handleSaveQc}
        />

        <BlueprintViewer
          order={blueprintOrder}
          documents={blueprintDocs}
          onClose={() => setBlueprintOrder(null)}
        />
      </div>
    );
  }

  // Vista grilla de órdenes
  return (
    <div className={styles.container}>
      <header className={styles.headerBar}>
        <div className={styles.headerInner}>
          <div className={styles.topRow}>
            <div className={styles.brandGroup}>
              <div className={styles.factoryIconBox}>
                <img
                  src="/Imagotipo-Taller.svg"
                  alt="QualityTrack Modo Taller"
                  className={styles.imagotipoTaller}
                />
              </div>
              <div>
                <h1 className={styles.mainTitle}>Modo Taller</h1>
                <p className={styles.subTitle}>Órdenes activas para ejecutar en planta</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className={styles.btnExit}
            >
              <Monitor size={16} /> Salir al escritorio
            </button>
          </div>

          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar OT, pieza o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin órdenes activas"
            description="No hay órdenes de trabajo en proceso para ejecutar en este momento."
          />
        ) : (
          <div className={styles.cardsGrid}>
            {filteredOrders.map((order) => (
              <ShopFloorCard
                key={order.id}
                order={order}
                onSelect={handleOpenOrder}
                onEscalate={handleEscalateToQc}
                onOpenBlueprint={handleOpenBlueprint}
                onReportIncident={handleOpenIncident}
              />
            ))}
          </div>
        )}
      </main>

      {incidentOrder && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIncidentOrder(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <AlertTriangle size={18} /> Reportar Falla Crítica
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIncidentOrder(null)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveIncident} className={styles.modalForm}>
              <div className={styles.dangerAlertBanner}>
                Se registrará una no conformidad <strong>crítica</strong> para {incidentOrder.numero}.
              </div>

              <div className={styles.formField}>
                <label htmlFor="inc-title" className={styles.formLabel}>
                  Título del desvío *
                </label>
                <input
                  id="inc-title"
                  type="text"
                  name="title"
                  required
                  placeholder="Ej. Dimensión fuera de tolerancia"
                  className={styles.input}
                  value={incidentForm.title}
                  onChange={handleIncidentChange}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="inc-desc" className={styles.formLabel}>
                  Descripción
                </label>
                <textarea
                  id="inc-desc"
                  name="description"
                  rows={3}
                  className={styles.textarea}
                  placeholder="Detalla lo sucedido en la máquina o con la pieza..."
                  value={incidentForm.description}
                  onChange={handleIncidentChange}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="inc-rep" className={styles.formLabel}>
                  Reportado por
                </label>
                <input
                  id="inc-rep"
                  type="text"
                  name="reporter"
                  placeholder="Nombre del operario"
                  className={styles.input}
                  value={incidentForm.reporter}
                  onChange={handleIncidentChange}
                />
              </div>

              <footer className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnModalCancel}
                  onClick={() => setIncidentOrder(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnModalSaveDanger}>
                  Reportar falla
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <BlueprintViewer
        order={blueprintOrder}
        documents={blueprintDocs}
        onClose={() => setBlueprintOrder(null)}
      />
    </div>
  );
}