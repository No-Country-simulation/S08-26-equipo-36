# ⚙️ QualityTrack — Sistema Integral de Gestión, Trazabilidad y Control de Calidad Industrial

> Plataforma web para talleres de mecanizado y empresas metalmecánicas que centraliza el ciclo de vida productivo: desde la solicitud inicial de cotización hasta el control dimensional, la trazabilidad pública de piezas y el despacho final conforme.

[![Deploy en Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://s08-26-equipo-36.vercel.app)
[![Backend en Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://qualitytrack-backend-rks5.onrender.com)
[![Base de Datos TiDB](https://img.shields.io/badge/Database-TiDB_Cloud-0052CC?style=flat&logo=mysql)](https://tidbcloud.com)
[![Almacenamiento Supabase](https://img.shields.io/badge/Storage-Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com)

---

## 📌 Contexto del Proyecto

En la industria del mecanizado de precisión, la falta de visibilidad en los tiempos de taller, la pérdida de planos técnicos y la escasa trazabilidad hacia el cliente generan demoras y fricciones comerciales. 

QualityTrack resuelve esta problemática digitalizando el flujo operativo de punta a punta, permitiendo a los operarios registrar avances en tiempo real en planta ("Modo Taller"), a los inspectores asentar mediciones dimensionales bajo tolerancia y a los clientes auditar el progreso de su lote mediante un portal de seguimiento transparente y notificaciones automáticas por correo electrónico.

---

## 🚀 Características Principales

* Portal Comercial & Landing Page:
  * Recepción de consultas técnicas y solicitudes de mecanizado con requerimientos de planos y materiales.
  * Formulario de cotización paramétrico con validación de precios unitarios y totales.
* Flujo Automatizado de Orden de Trabajo (OT):
  * Aprobación de cotizaciones con transición inmediata a OT correlativa.
  * Generación de orden y despacho automático en segundo plano de notificación por correo electrónico con enlace directo de trazabilidad.
* Modo Taller (Gestión Operativa de Planta):
  * Desglose de operaciones secuenciales (Torneado, Fresado, Rectificado, Tratamiento Térmico, etc.).
  * Control de tiempos, estado por estación de trabajo y asignación de operarios.
* Control de Calidad Dimensional & Archivos Técnicos:
  * Carga y visualización de planos y reportes técnicos en formato PDF alojados de forma segura en Supabase Storage.
  * Registro de inspecciones dimensionales con tolerancias (±mm), dictamen técnico (Aprobado/Rechazado) y observaciones de conformidad.
* Portal de Trazabilidad Pública (Tracking en Vivo):
  * Acceso público sin autenticación para clientes mediante identificador único de orden (/seguimiento?ot=OT-XXXX).
  * Stepper interactivo de 5 etapas: Orden Creada, En Mecanizado, Control de Calidad, Liberada y Entregada.
* Centro de Notificaciones Asíncrono:
  * Despacho de correos HTML estructurados vía SMTP sobre conexión SSL segura en subprocesos desacoplados (threading).

---

## 🛠️ Stack Tecnológico

* Frontend: React 18, Vite, React Router Dom 6, Lucide React, CSS Modules / Modern CSS.
* Backend: Python, Flask, Flask-CORS, smtplib & ssl (SMTP SSL puerto 465 en subprocesos en segundo plano).
* Base de Datos e Infraestructura: TiDB Cloud (MySQL Compatible), Supabase Storage, Render, Vercel.

---

## 🔄 Ciclo de Vida del Negocio

1. Consulta / Solicitud inicial
2. Emisión y cálculo de Cotización Comercial
3. Aprobación del cliente y generación automática de OT
4. Notificación SMTP al cliente con link directo de seguimiento
5. Modo Taller: Ejecución de operaciones (Torneado / Fresado)
6. Control de Calidad Dimensional y carga de reporte técnico PDF
7. Liberación del lote conforme y Despacho final al cliente

---

## 📂 Estructura del Repositorio

* client/ — Aplicación Frontend (React + Vite)
  * src/api/ — Cliente HTTP y abstracción de endpoints
  * src/components/ — Modales, Steppers, Tablas y UI compartida (Quotes, Modo Taller, Common)
  * src/pages/ — Vistas principales (Quotes, WorkOrders, OrderTracking)
* server/ — API RESTful (Python / Flask)
  * app.py — Inicialización del servidor Flask y configuración de CORS
  * email_service.py — Servicio de plantillas HTML y despacho SMTP asíncrono
  * db.py — Conector y pool de sesiones a TiDB Cloud
  * routes/ — Blueprints de endpoints (ordenes, cotizaciones, etc.)

---

## ⚙️ Instalación y Configuración Local

### Prerrequisitos
* Node.js (v18 o superior) y npm
* Python (v3.10 o superior) y pip
* Instancia de base de datos MySQL o TiDB Cloud

### 1. Configuración del Backend

1. Entrar a la carpeta del servidor: cd server
2. Crear y activar el entorno virtual:
   * En Windows: python -m venv venv && venv\Scripts\activate
   * En Linux/macOS: python3 -m venv venv && source venv/bin/activate
3. Instalar dependencias: pip install -r requirements.txt
4. Configurar variables de entorno en server/.env:
   * DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
   * DB_PORT=4000
   * DB_USER=tu_usuario_tidb
   * DB_PASSWORD=tu_password_tidb
   * DB_NAME=qualitytrack
   * SMTP_SERVER=smtp.gmail.com
   * SMTP_PORT=465
   * SMTP_USER=tu_correo@gmail.com
   * SMTP_PASS=tu_app_password_16_caracteres
5. Iniciar la API: python app.py (disponible en http://localhost:5000)

### 2. Configuración del Frontend

1. En otra terminal, entrar a la carpeta cliente: cd client
2. Instalar dependencias: npm install
3. Configurar variables de entorno en client/.env:
   * VITE_API_BASE_URL=http://localhost:5000/api
   * VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   * VITE_SUPABASE_ANON_KEY=tu_clave_publica_supabase
   * VITE_WHATSAPP_PHONE=+549XXXXXXXXXX
4. Iniciar el cliente: npm run dev (disponible en http://localhost:5173)

---

## 🧪 Demostración del Circuito de Producción

1. Cotizaciones: Ingresar a /cotizaciones y presionar Aprobar → OT sobre una solicitud pendiente.
2. Notificación: El backend despacha el correo al cliente con el enlace parametrizado de seguimiento.
3. Modo Taller: Ingresar al expediente de la OT y registrar las operaciones de mecanizado (Torneado y Fresado).
4. Control de Calidad: Adjuntar el reporte técnico en PDF e ingresar la verificación dimensional conforme.
5. Cierre & Trazabilidad: Cambiar la OT a estado Completada e ingresar a /seguimiento?ot=OT-XXXX para auditar la barra de progreso al 100% y el detalle técnico liberado.

---

## 👥 Equipo de Desarrollo (NoCountry — Cohorte S08-26 Equipo 36)

* Frontend Engineering & Scrum Master: Carina Susana Bosio
* Backend & Arquitectura de Datos: Equipo 36
* Diseño UI/UX: Equipo 36

---

## 📄 Licencia

Este proyecto fue desarrollado bajo fines formativos y de simulación laboral profesional en el marco de la aceleradora NoCountry. Todos los derechos reservados © 2026.