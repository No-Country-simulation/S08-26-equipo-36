const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('[Config Error] VITE_API_BASE_URL no está definida en las variables de entorno.');
}

/**
 * Cliente HTTP base para peticiones a la API REST de QualityTrack
 */
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Recuperar sesión activa si existe
  const storedUser = localStorage.getItem('qualitytrack_user');
  let token = null;
  if (storedUser) {
    try {
      token = JSON.parse(storedUser)?.token;
    } catch {
      token = null;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    // Si la respuesta no contiene cuerpo (ej. 204 No Content)
    if (res.status === 204) {
      return null;
    }

    const contentType = res.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const errorMessage = typeof data === 'object' && data?.message ? data.message : 'Error en la petición';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Estado del servidor
  getStatus: () => request('/status'),

  // Clientes
  getClientes: () => request('/clientes'),
  crearCliente: (clienteData) =>
    request('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    }),

  // Solicitudes
  getSolicitudes: () => request('/solicitudes'),
  crearSolicitud: (solicitudData) =>
    request('/solicitudes', {
      method: 'POST',
      body: JSON.stringify(solicitudData),
    }),
  eliminarSolicitud: (id) =>
    request(`/solicitudes/${id}`, {
      method: 'DELETE',
    }),

  // Órdenes de Trabajo
  getOrdenes: () => request('/ordenes'),
  getDetalleOrden: (id) => request(`/ordenes/${id}`),
  actualizarEstadoOrden: (id, estado) =>
    request(`/ordenes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
  actualizarResponsableOrden: (id, responsable) =>
    request(`/ordenes/${id}/responsable`, {
      method: 'PATCH',
      body: JSON.stringify({ responsable }),
    }),

  // Documentos y Planos
  getDocumentosOrden: (idOt) => request(`/ordenes/${idOt}/documentos`),
  subirDocumentoOrden: (idOt, datos) =>
    request(`/ordenes/${idOt}/documentos`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  eliminarDocumentoOrden: (idDoc) =>
    request(`/documentos/${idDoc}`, { method: 'DELETE' }),

  // Operaciones / Hoja de Ruta
  getOperacionesOrden: (idOt) => request(`/ordenes/${idOt}/operaciones`),
  crearOperacionOrden: (idOt, datos) =>
    request(`/ordenes/${idOt}/operaciones`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  eliminarOperacionOrden: (idOp) =>
    request(`/operaciones/${idOp}`, { method: 'DELETE' }),
  actualizarEstadoOperacion: (idOp, estado) =>
    request(`/operaciones/${idOp}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  // Control de Calidad
  getControlesOrden: (idOt) => request(`/ordenes/${idOt}/controles`),
  crearControlOrden: (idOt, datos) =>
    request(`/ordenes/${idOt}/controles`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
  eliminarControlOrden: (idControl) =>
    request(`/controles/${idControl}`, { method: 'DELETE' }),

  // Reporte de Fallas / No Conformidades
  getNoConformidadesOrden: (idOt) =>
    request(`/ordenes/${idOt}/noconformidades`),
  crearNoConformidadOrden: (idOt, data) =>
    request(`/ordenes/${idOt}/noconformidades`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarNoConformidad: (idFalla, data) =>
    request(`/noconformidades/${idFalla}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  eliminarNoConformidad: (idFalla) =>
    request(`/noconformidades/${idFalla}`, {
      method: 'DELETE',
    }),

  // Cotizaciones
  getCotizaciones: () => request('/cotizaciones'),
  crearCotizacion: (data) =>
    request('/cotizaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarCotizacion: (id, data) =>
    request(`/cotizaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  eliminarCotizacion: (id) =>
    request(`/cotizaciones/${id}`, {
      method: 'DELETE',
    }),
  actualizarEstadoCotizacion: (id, estado) =>
    request(`/cotizaciones/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  // Entregas
  getEntregasOrden: (idOt) => request(`/ordenes/${idOt}/entregas`),
  crearEntregaOrden: (idOt, data) =>
    request(`/ordenes/${idOt}/entregas`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarEntrega: (idEntrega, data) =>
    request(`/entregas/${idEntrega}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  eliminarEntrega: (idEntrega) =>
    request(`/entregas/${idEntrega}`, {
      method: 'DELETE',
    }),
};