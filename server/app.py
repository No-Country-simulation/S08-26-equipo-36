import datetime
from decimal import Decimal
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
# --- STATUS ---
@app.route('/api/status', methods=['GET'])
def status():
    conexion = get_db_connection()
    if conexion and conexion.is_connected():
        estado_db = "Conectado exitosamente a MySQL"
        conexion.close()
    else:
        estado_db = "Error de conexión a la base de datos"

    return jsonify({
        "status": "Servidor QualityTrack en línea",
        "arquitectura": "Modular",
        "base_de_datos": estado_db
    }), 200


# --- CLIENTES ---
@app.route('/api/clientes', methods=['GET'])
def listar_clientes():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clientes ORDER BY id_cliente DESC")
        clientes = cursor.fetchall()
        return jsonify({"status": "success", "data": clientes}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/clientes', methods=['POST'])
def crear_cliente():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        razon_social = datos.get('razon_social')
        contacto = datos.get('contacto', '')
        ruc_nit = datos.get('ruc_nit') or datos.get('cuit', '')
        email = datos.get('email', '')
        telefono = datos.get('telefono', '')
        direccion = datos.get('direccion', '')
        notas = datos.get('notas', '')

        if not razon_social:
            return jsonify({"status": "error", "message": "La razón social es obligatoria"}), 400

        cursor = conexion.cursor()
        sql = """
            INSERT INTO clientes (razon_social, contacto, ruc_nit, email, telefono, direccion, notas)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (razon_social, contacto, ruc_nit, email, telefono, direccion, notas))
        conexion.commit()
        nuevo_id = cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": "Cliente creado exitosamente",
            "data": {"id_cliente": nuevo_id, **datos}
        }), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- SOLICITUDES ---
@app.route('/api/solicitudes', methods=['GET'])
def listar_solicitudes():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT 
                s.id_solicitud,
                s.id_cliente,
                COALESCE(c.razon_social, s.cliente_nombre) AS cliente_nombre,
                DATE_FORMAT(s.fecha, '%Y-%m-%d') AS fecha,
                s.pieza,
                s.cantidad,
                s.material,
                s.prioridad,
                s.descripcion,
                s.especificaciones,
                s.estado,
                s.cotizacion_id
            FROM solicitudes s
            LEFT JOIN clientes c ON s.id_cliente = c.id_cliente
            ORDER BY s.id_solicitud DESC
        """
        cursor.execute(sql)
        solicitudes = cursor.fetchall()
        return jsonify({"status": "success", "data": solicitudes}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/solicitudes', methods=['POST'])
def crear_solicitud():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        id_cliente = datos.get('id_cliente')
        cliente_nombre = datos.get('cliente_nombre', '')
        fecha = datos.get('fecha')
        pieza = datos.get('pieza')
        cantidad = datos.get('cantidad', 1)
        material = datos.get('material', '')
        prioridad = datos.get('prioridad', 'Media')
        descripcion = datos.get('descripcion', '')
        especificaciones = datos.get('especificaciones', '')
        estado = datos.get('estado', 'Pendiente')

        if not id_cliente or not pieza or not fecha:
            return jsonify({"status": "error", "message": "Cliente, pieza y fecha son obligatorios"}), 400

        cursor = conexion.cursor()
        sql = """
            INSERT INTO solicitudes 
            (id_cliente, cliente_nombre, fecha, pieza, cantidad, material, prioridad, descripcion, especificaciones, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (id_cliente, cliente_nombre, fecha, pieza, cantidad, material, prioridad, descripcion, especificaciones, estado))
        conexion.commit()
        nuevo_id = cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": "Solicitud creada exitosamente",
            "data": {"id_solicitud": nuevo_id, **datos}
        }), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/solicitudes/<int:id_solicitud>', methods=['DELETE'])
def eliminar_solicitud(id_solicitud):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM solicitudes WHERE id_solicitud = %s", (id_solicitud,))
        conexion.commit()
        return jsonify({"status": "success", "message": "Solicitud eliminada"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- COTIZACIONES ---
@app.route('/api/cotizaciones', methods=['GET'])
def get_cotizaciones():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT 
                c.id_cotizacion,
                c.solicitud_id,
                c.id_cliente,
                COALESCE(cl.razon_social, '—') AS cliente_nombre,
                c.pieza,
                c.cantidad,
                c.precio_unitario,
                c.precio_total,
                c.validez,
                c.detalle,
                c.estado,
                c.fecha_emission AS fecha_emision,
                c.orden_trabajo_id
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
            ORDER BY c.id_cotizacion DESC
        """
        cursor.execute(sql)
        filas = cursor.fetchall()

        datos = []
        for c in filas:
            fila = dict(c)
            for k, v in fila.items():
                if isinstance(v, Decimal):
                    fila[k] = float(v)
                elif isinstance(v, (datetime.date, datetime.datetime)):
                    fila[k] = v.strftime('%Y-%m-%d')

            fila['fecha'] = fila.get('fecha_emision') or ''
            datos.append(fila)

        return jsonify({"status": "success", "data": datos}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/cotizaciones', methods=['POST'])
def crear_cotizacion():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        solicitud_id = datos.get('solicitud_id') or datos.get('id_solicitud')
        id_cliente = datos.get('id_cliente')
        descripcion_req = datos.get('descripcion_requerimiento', '')
        pieza = datos.get('pieza', '')
        cantidad = datos.get('cantidad', 1)
        detalle = datos.get('detalle', '')
        precio_unitario = datos.get('precio_unitario', 0.0)
        precio_total = datos.get('precio_total', 0.0)
        validez = datos.get('validez', '30 días')
        estado = 'pendiente'
        fecha_emision = datos.get('fecha') or datos.get('fecha_emision')

        if not id_cliente or not pieza:
            return jsonify({"status": "error", "message": "Cliente y pieza son obligatorios"}), 400

        cursor = conexion.cursor()
        sql_insert = """
            INSERT INTO cotizaciones 
            (solicitud_id, id_cliente, descripcion_requerimiento, pieza, cantidad, detalle, precio_unitario, precio_total, validez, estado, fecha_emission)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_insert, (
            solicitud_id, id_cliente, descripcion_req, pieza, cantidad,
            detalle, precio_unitario, precio_total, validez, estado, fecha_emision
        ))
        nuevo_id = cursor.lastrowid

        if solicitud_id:
            cursor.execute("UPDATE solicitudes SET estado = 'Cotizada' WHERE id_solicitud = %s", (solicitud_id,))

        conexion.commit()
        return jsonify({
            "status": "success",
            "message": "Cotización creada exitosamente",
            "data": {"id_cotizacion": nuevo_id, **datos}
        }), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/cotizaciones/<int:id_cotizacion>', methods=['PUT'])
def actualizar_cotizacion(id_cotizacion):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        precio_unitario = datos.get('precio_unitario', 0.0)
        precio_total = datos.get('precio_total', 0.0)
        fecha_emision = datos.get('fecha') or datos.get('fecha_emision')
        validez = datos.get('validez', '30 días')
        detalle = datos.get('detalle', '')

        cursor = conexion.cursor()
        sql = """
            UPDATE cotizaciones 
            SET precio_unitario = %s,
                precio_total = %s,
                fecha_emission = %s,
                validez = %s,
                detalle = %s
            WHERE id_cotizacion = %s
        """
        cursor.execute(sql, (precio_unitario, precio_total, fecha_emision, validez, detalle, id_cotizacion))
        conexion.commit()
        return jsonify({"status": "success", "message": "Cotización actualizada con éxito"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/cotizaciones/<int:id_cotizacion>/estado', methods=['PATCH'])
def cambiar_estado_cotizacion(id_cotizacion):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nuevo_estado = datos.get('estado')

        cursor = conexion.cursor(dictionary=True)
        sql_info = """
            SELECT 
                c.*, 
                COALESCE(cl.razon_social, '—') AS cliente_razon_social,
                s.prioridad AS sol_prioridad,
                s.descripcion AS sol_descripcion,
                s.especificaciones AS sol_especificaciones,
                s.material AS sol_material
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN solicitudes s ON c.solicitud_id = s.id_solicitud
            WHERE c.id_cotizacion = %s
        """
        cursor.execute(sql_info, (id_cotizacion,))
        cot = cursor.fetchone()

        if not cot:
            return jsonify({"status": "error", "message": "Cotización no encontrada"}), 404

        id_ot_generada = None

        if nuevo_estado == 'aprobada':
            cursor.execute("SELECT COUNT(*) AS total FROM ordenes_trabajo")
            conteo = cursor.fetchone()['total']
            nuevo_numero = f"OT-{str(conteo + 1).zfill(4)}"

            prio = (cot.get('sol_prioridad') or 'media').lower()
            if prio not in ['baja', 'media', 'alta', 'urgente']:
                prio = 'media'

            sql_insert_ot = """
                INSERT INTO ordenes_trabajo (
                    id_cotizacion,
                    solicitud_id,
                    numero,
                    cliente_nombre,
                    pieza,
                    descripcion,
                    especificaciones,
                    material,
                    cantidad,
                    estado_actual,
                    prioridad,
                    fecha_creacion,
                    fecha_inicio,
                    fecha_entrega_estimada
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY))
            """
            cursor.execute(sql_insert_ot, (
                id_cotizacion,
                cot.get('solicitud_id'),
                nuevo_numero,
                cot.get('cliente_razon_social', '—'),
                cot.get('pieza', ''),
                cot.get('sol_descripcion') or cot.get('descripcion_requerimiento') or '',
                cot.get('sol_especificaciones') or '',
                cot.get('sol_material') or '',
                cot.get('cantidad', 1),
                'creada',
                prio
            ))
            id_ot_generada = cursor.lastrowid

            if cot.get('solicitud_id'):
                cursor.execute("UPDATE solicitudes SET estado = 'Aprobada' WHERE id_solicitud = %s", (cot['solicitud_id'],))

            cursor.execute("""
                UPDATE cotizaciones 
                SET estado = %s, orden_trabajo_id = %s 
                WHERE id_cotizacion = %s
            """, (nuevo_estado, id_ot_generada, id_cotizacion))

        elif nuevo_estado == 'rechazada':
            cursor.execute("UPDATE cotizaciones SET estado = %s WHERE id_cotizacion = %s", (nuevo_estado, id_cotizacion))
            if cot.get('solicitud_id'):
                cursor.execute("UPDATE solicitudes SET estado = 'Pendiente' WHERE id_solicitud = %s", (cot['solicitud_id'],))
        else:
            cursor.execute("UPDATE cotizaciones SET estado = %s WHERE id_cotizacion = %s", (nuevo_estado, id_cotizacion))

        conexion.commit()
        return jsonify({
            "status": "success",
            "message": f"Cotización {nuevo_estado} exitosamente",
            "id_ot": id_ot_generada
        }), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/cotizaciones/<int:id_cotizacion>', methods=['DELETE'])
def eliminar_cotizacion(id_cotizacion):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT solicitud_id FROM cotizaciones WHERE id_cotizacion = %s", (id_cotizacion,))
        row = cursor.fetchone()
        if row and row.get('solicitud_id'):
            cursor.execute("UPDATE solicitudes SET estado = 'Pendiente' WHERE id_solicitud = %s", (row['solicitud_id'],))

        cursor.execute("DELETE FROM cotizaciones WHERE id_cotizacion = %s", (id_cotizacion,))
        conexion.commit()
        return jsonify({"status": "success", "message": "Cotización eliminada con éxito"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- ORDENES DE TRABAJO ---
@app.route('/api/ordenes', methods=['GET'])
def listar_ordenes():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT 
                id_ot,
                id_cotizacion,
                solicitud_id,
                numero,
                cliente_nombre,
                pieza,
                descripcion,
                especificaciones,
                material,
                cantidad,
                estado_actual,
                prioridad,
                fecha_creacion,
                fecha_inicio,
                fecha_entrega_estimada,
                fecha_entrega_real,
                responsable,
                observaciones
            FROM ordenes_trabajo
            ORDER BY id_ot DESC
        """
        cursor.execute(sql)
        filas = cursor.fetchall()

        ordenes = []
        for o in filas:
            fila = dict(o)
            for k, v in fila.items():
                if isinstance(v, Decimal):
                    fila[k] = float(v)
                elif isinstance(v, (datetime.date, datetime.datetime)):
                    fila[k] = v.strftime('%Y-%m-%d')
            ordenes.append(fila)

        return jsonify({"status": "success", "data": ordenes}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>', methods=['GET'])
def obtener_detalle_orden(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql_ot = """
            SELECT 
                ot.*,
                c.precio_total AS cot_precio_total,
                c.precio_unitario AS cot_precio_unitario,
                c.fecha_emission AS cot_fecha_emision,
                c.validez AS cot_validez
            FROM ordenes_trabajo ot
            LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id_cotizacion
            WHERE ot.id_ot = %s
        """
        cursor.execute(sql_ot, (id_ot,))
        orden = cursor.fetchone()

        if not orden:
            return jsonify({"status": "error", "message": "Orden de Trabajo no encontrada"}), 404

        fila = dict(orden)
        for k, v in fila.items():
            if isinstance(v, Decimal):
                fila[k] = float(v)
            elif isinstance(v, (datetime.date, datetime.datetime)):
                fila[k] = v.strftime('%Y-%m-%d')

        if fila.get('cot_precio_total') is not None:
            fila['precio_cotizado'] = f"$ {int(fila['cot_precio_total']):,}".replace(",", ".")
        else:
            fila['precio_cotizado'] = "—"

        fila['fecha_cotizacion'] = fila.get('cot_fecha_emision') or "—"
        return jsonify({"status": "success", "data": fila}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/estado', methods=['PATCH'])
def actualizar_estado_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nuevo_estado = datos.get('estado')

        cursor = conexion.cursor()
        if nuevo_estado in ['en_proceso', 'mecanizado']:
            sql = """
                UPDATE ordenes_trabajo 
                SET estado_actual = %s,
                    fecha_inicio = COALESCE(fecha_inicio, CURDATE())
                WHERE id_ot = %s
            """
            cursor.execute(sql, (nuevo_estado, id_ot))
        elif nuevo_estado in ['entregada', 'finalizada']:
            sql = """
                UPDATE ordenes_trabajo 
                SET estado_actual = %s,
                    fecha_entrega_real = COALESCE(fecha_entrega_real, CURDATE())
                WHERE id_ot = %s
            """
            cursor.execute(sql, (nuevo_estado, id_ot))
        else:
            cursor.execute("UPDATE ordenes_trabajo SET estado_actual = %s WHERE id_ot = %s", (nuevo_estado, id_ot))

        conexion.commit()
        return jsonify({"status": "success", "message": "Estado de la OT actualizado"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/responsable', methods=['PATCH'])
def actualizar_responsable_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nuevo_responsable = datos.get('responsable', '').strip()

        cursor = conexion.cursor()
        cursor.execute("UPDATE ordenes_trabajo SET responsable = %s WHERE id_ot = %s", (nuevo_responsable, id_ot))
        conexion.commit()
        return jsonify({"status": "success", "message": "Responsable actualizado", "responsable": nuevo_responsable}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- CONTROL DE CALIDAD ---
@app.route('/api/ordenes/<int:id_ot>/controles', methods=['GET'])
def listar_controles_calidad(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT id_control, orden_trabajo_id, operacion_id, tipo, resultado,
                   medicion, tolerancia, observaciones, inspector, fecha
            FROM controlcalidad
            WHERE orden_trabajo_id = %s
            ORDER BY id_control DESC
        """
        cursor.execute(sql, (id_ot,))
        controles = cursor.fetchall()
        for c in controles:
            if isinstance(c.get('fecha'), (datetime.date, datetime.datetime)):
                c['fecha'] = c['fecha'].strftime('%Y-%m-%d')
        return jsonify({"status": "success", "data": controles}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/controles', methods=['POST'])
def crear_control_calidad(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        datos = request.get_json() or {}
        tipo = (datos.get('tipo') or 'dimensional').lower()
        resultado = (datos.get('resultado') or 'aprobado').lower()
        operacion_id = datos.get('operacion_id') or None
        medicion = datos.get('medicion')
        tolerancia = datos.get('tolerancia')
        observaciones = datos.get('observaciones')
        inspector = datos.get('inspector', 'Inspector de Calidad')
        fecha = datos.get('fecha') or None

        cursor = conexion.cursor()
        sql = """
            INSERT INTO controlcalidad 
            (orden_trabajo_id, operacion_id, tipo, resultado, medicion, tolerancia, observaciones, inspector, fecha)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, CURDATE()))
        """
        cursor.execute(sql, (id_ot, operacion_id, tipo, resultado, medicion, tolerancia, observaciones, inspector, fecha))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        return jsonify({"status": "success", "id_control": nuevo_id}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/controles/<int:id_control>', methods=['DELETE'])
def eliminar_control_calidad(id_control):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM controlcalidad WHERE id_control = %s", (id_control,))
        conexion.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- OPERACIONES / HOJA DE RUTA ---
@app.route('/api/ordenes/<int:id_ot>/operaciones', methods=['GET'])
def listar_operaciones_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT id_operacion, id_ot, descripcion_tarea, operario_asignado, estado, fecha_actualizacion
            FROM operaciones
            WHERE id_ot = %s
            ORDER BY id_operacion ASC
        """
        cursor.execute(sql, (id_ot,))
        ops = cursor.fetchall()
        for op in ops:
            if isinstance(op.get('fecha_actualizacion'), (datetime.date, datetime.datetime)):
                op['fecha_actualizacion'] = op['fecha_actualizacion'].strftime('%Y-%m-%d %H:%M')
        return jsonify({"status": "success", "data": ops}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/operaciones', methods=['POST'])
def crear_operacion_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        datos = request.get_json() or {}
        tarea = datos.get('nombre') or datos.get('descripcion_tarea') or 'Operación de mecanizado'
        operario = datos.get('operario') or datos.get('operario_asignado') or 'Operario'
        estado = (datos.get('estado') or 'pendiente').lower().replace(" ", "_")

        cursor = conexion.cursor()
        sql = """
            INSERT INTO operaciones (id_ot, descripcion_tarea, operario_asignado, estado, fecha_actualizacion)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (id_ot, tarea, operario, estado))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        return jsonify({"status": "success", "id_operacion": nuevo_id}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/operaciones/<int:id_op>', methods=['DELETE'])
def eliminar_operacion_ot(id_op):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM operaciones WHERE id_operacion = %s", (id_op,))
        conexion.commit()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a BD"}), 500
    try:
        datos = request.get_json() or {}
        tarea = datos.get('nombre') or datos.get('descripcion_tarea') or 'Operación de mecanizado'
        operario = datos.get('operario') or datos.get('operario_asignado') or 'Operario'
        estado = (datos.get('estado') or 'pendiente').lower().replace(" ", "_")

        cursor = conexion.cursor()
        sql = """
            INSERT INTO operaciones (id_ot, descripcion_tarea, operario_asignado, estado, fecha_actualizacion)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (id_ot, tarea, operario, estado))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        return jsonify({"status": "success", "id_operacion": nuevo_id}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- ACTUALIZACIÓN DE ESTADO DE OPERACIONES ---
@app.route('/api/operaciones/<int:id_operacion>/estado', methods=['PATCH'])
def actualizar_estado_operacion(id_operacion):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nuevo_estado = (datos.get('estado') or 'pendiente').lower().replace(" ", "_")

        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE operaciones 
            SET estado = %s 
            WHERE id_operacion = %s
        """, (nuevo_estado, id_operacion))
        conexion.commit()
        return jsonify({"status": "success", "message": "Estado actualizado"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

# --- NO CONFORMIDADES / FALLAS ---

# --- NO CONFORMIDADES / FALLAS ---
@app.route('/api/ordenes/<int:id_ot>/noconformidades', methods=['GET'])
def obtener_no_conformidades(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT * FROM noconformidades WHERE id_ot = %s ORDER BY id_falla DESC", (id_ot,))
        filas = cursor.fetchall()

        # Mapeamos para que el frontend reciba las propiedades que espera
        resultado = []
        for f in filas:
            fecha_str = "—"
            raw_fecha = f.get('fecha_reporte')
            if isinstance(raw_fecha, (datetime.date, datetime.datetime)):
                fecha_str = raw_fecha.strftime('%d/%m/%Y')
            elif raw_fecha:
                fecha_str = str(raw_fecha).split("T")[0]

            resultado.append({
                "id": f.get('id_falla'),
                "id_nc": f.get('id_falla'),
                "title": f.get('titulo') or "Desvío sin título",
                "description": f.get('descripcion') or "",
                "severity": (f.get('severidad') or "moderada").lower(),
                "status": f.get('estado_resolucion') or f.get('estado') or "abierta",
                "origin": f.get('tipo_falla') or f.get('origen') or "Producción",
                "reporter": f.get('responsable') or "Operario",
                "correctiveAction": f.get('accion_correctiva'),
                "date": fecha_str
            })

        return jsonify({"status": "success", "data": resultado}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/noconformidades', methods=['POST'])
def crear_no_conformidad(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión"}), 500
    try:
        datos = request.get_json() or {}
        titulo = datos.get('titulo') or datos.get('title') or 'Desvío sin título'
        descripcion = datos.get('descripcion') or datos.get('description') or ''
        severidad = (datos.get('severidad') or datos.get('severity') or 'critica').lower()
        origen = datos.get('origen') or datos.get('tipo_falla') or datos.get('origin') or 'Producción'
        responsable = datos.get('responsable') or datos.get('reporter') or 'Hernán Cortés (Torno CNC)'
        accion_correctiva = datos.get('accion_correctiva') or datos.get('correctiveAction') or None
        estado = (datos.get('estado') or datos.get('estado_resolucion') or datos.get('status') or 'abierta').lower()

        cursor = conexion.cursor()
        cursor.execute("""
            INSERT INTO noconformidades 
            (id_ot, tipo_falla, descripcion, estado_resolucion, fecha_reporte, titulo, severidad, estado, origen, responsable, accion_correctiva)
            VALUES (%s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s)
        """, (id_ot, origen, descripcion, estado, titulo, severidad, estado, origen, responsable, accion_correctiva))

        conexion.commit()
        return jsonify({"status": "success", "id_falla": cursor.lastrowid}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/noconformidades/<int:id_falla>', methods=['PUT'])
def actualizar_noconformidad(id_falla):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE noconformidades 
            SET titulo = %s, descripcion = %s, severidad = %s, estado = %s, 
                origen = %s, responsable = %s, accion_correctiva = %s, 
                fecha_deteccion = %s, estado_resolucion = %s, tipo_falla = %s 
            WHERE id_falla = %s
        """, (
            datos.get('titulo'),
            datos.get('descripcion'),
            datos.get('severidad'),
            datos.get('estado'),
            datos.get('origen'),
            datos.get('responsable'),
            datos.get('accion_correctiva'),
            datos.get('fecha_deteccion'),
            datos.get('estado'),
            datos.get('origen'),
            id_falla
        ))
        conexion.commit()
        return jsonify({"status": "success", "message": "Registro actualizado"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/noconformidades/<int:id_falla>', methods=['DELETE'])
def eliminar_noconformidad(id_falla):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM noconformidades WHERE id_falla = %s", (id_falla,))
        conexion.commit()
        return jsonify({"status": "success", "message": "Registro eliminado"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

# @app.route('/api/ordenes/<int:id_ot>/noconformidades', methods=['POST'])
# def crear_noconformidad_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        titulo = datos.get('title') or datos.get('titulo') or 'Desvío reportado'
        descripcion = datos.get('description') or datos.get('descripcion') or ''
        responsable = datos.get('reporter') or datos.get('responsable') or 'Operario de Planta'
        severidad = datos.get('severity') or datos.get('severidad') or 'critica'
        origen = datos.get('origin') or datos.get('origen') or 'Producción / Taller'
        estado = 'abierta'

        cursor = conexion.cursor()
        sql = """
            INSERT INTO noconformidades 
            (id_ot, tipo_falla, descripcion, estado_resolucion, fecha_reporte, titulo, severidad, estado, origen, responsable, fecha_deteccion)
            VALUES (%s, %s, %s, %s, CURDATE(), %s, %s, %s, %s, %s, CURDATE())
        """
        cursor.execute(sql, (
            id_ot,
            'falla_proceso',
            descripcion,
            'pendiente',
            titulo,
            severidad,
            estado,
            origen,
            responsable
        ))
        nuevo_id = cursor.lastrowid
        conexion.commit()
        return jsonify({
            "status": "success",
            "message": "No conformidad registrada en BD",
            "id_falla": nuevo_id
        }), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/fallas', methods=['POST'])
def registrar_falla():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        id_ot = datos.get('id_ot')
        tipo_falla = datos.get('tipo_falla')
        descripcion = datos.get('descripcion')

        if not id_ot or not tipo_falla or not descripcion:
            return jsonify({"status": "error", "message": "Faltan datos obligatorios"}), 400

        cursor = conexion.cursor()
        sql_insert = "INSERT INTO noconformidades (id_ot, tipo_falla, descripcion) VALUES (%s, %s, %s)"
        cursor.execute(sql_insert, (id_ot, tipo_falla, descripcion))

        mensaje = "Falla registrada exitosamente."
        if tipo_falla == 'Critica':
            cursor.execute("UPDATE ordenes_trabajo SET estado_actual = 'Detenida' WHERE id_ot = %s", (id_ot,))
            mensaje += " Operación detenida. Supervisor notificado."

        conexion.commit()
        return jsonify({"status": "success", "message": mensaje}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


# --- DOCUMENTOS / PLANOS ---
@app.route('/api/ordenes/<int:id_ot>/documentos', methods=['GET'])
def obtener_documentos_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_documento, id_ot, tipo_documento, ruta_archivo, fecha_subida, nombre, descripcion, subido_por 
            FROM documentos 
            WHERE id_ot = %s 
            ORDER BY id_documento DESC
        """, (id_ot,))
        docs = cursor.fetchall()

        for d in docs:
            if isinstance(d.get('fecha_subida'), (datetime.date, datetime.datetime)):
                d['fecha_subida'] = d['fecha_subida'].strftime('%Y-%m-%d')
            d['url'] = d.get('ruta_archivo') or ''

        return jsonify({"status": "success", "data": docs}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/documentos', methods=['POST'])
def crear_documento_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nombre = datos.get('nombre') or 'Documento'
        tipo_documento = datos.get('tipo_documento') or 'Plano de Ingeniería'
        ruta_archivo = datos.get('ruta_archivo') or ''
        descripcion = datos.get('descripcion') or ''
        subido_por = datos.get('subido_por') or 'Oficina Técnica'

        cursor = conexion.cursor()
        sql = """
            INSERT INTO documentos (id_ot, tipo_documento, ruta_archivo, fecha_subida, nombre, descripcion, subido_por)
            VALUES (%s, %s, %s, CURDATE(), %s, %s, %s)
        """
        cursor.execute(sql, (id_ot, tipo_documento, ruta_archivo, nombre, descripcion, subido_por))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        return jsonify({"status": "success", "id_documento": nuevo_id}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/documentos/<int:id_documento>', methods=['DELETE'])
def eliminar_documento(id_documento):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM documentos WHERE id_documento = %s", (id_documento,))
        conexion.commit()
        return jsonify({"status": "success", "message": "Documento eliminado"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()        

# --- ENTREGAS ---
@app.route('/api/ordenes/<int:id_ot>/entregas', methods=['GET'])
def obtener_entregas_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_entrega, orden_trabajo_id, cliente_id, cliente_nombre, fecha, 
                   cantidad_entregada, remito, estado, recibido_por, observaciones 
            FROM entregas 
            WHERE orden_trabajo_id = %s 
            ORDER BY id_entrega DESC
        """, (id_ot,))
        items = cursor.fetchall()

        for item in items:
            if isinstance(item.get('fecha'), (datetime.date, datetime.datetime)):
                item['fecha'] = item['fecha'].strftime('%Y-%m-%d')

        return jsonify({"status": "success", "data": items}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes/<int:id_ot>/entregas', methods=['POST'])
def crear_entrega_ot(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        
        datos = request.get_json() or {}
        fecha = datos.get('fecha') or datetime.date.today().strftime('%Y-%m-%d')
        cantidad = datos.get('cantidad') or 0
        remito = datos.get('remito') or 'Pendiente de generar'
        estado = (datos.get('estado') or 'programada').lower()
        recibido_por = datos.get('recibido_por') or ''
        observaciones = datos.get('observaciones') or None

        # La entrega se vincula DIRECTAMENTE y EXCLUSIVAMENTE a la OT
        cursor.execute("""
            INSERT INTO entregas 
            (orden_trabajo_id, fecha, cantidad_entregada, remito, estado, recibido_por, observaciones) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (id_ot, fecha, cantidad, remito, estado, recibido_por, observaciones))
        
        conexion.commit()
        return jsonify({"status": "success", "id_entrega": cursor.lastrowid}), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/entregas/<int:id_entrega>', methods=['PUT'])
def actualizar_entrega(id_entrega):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE entregas 
            SET fecha = %s, cantidad_entregada = %s, remito = %s, estado = %s, 
                cliente_nombre = %s, recibido_por = %s, observaciones = %s 
            WHERE id_entrega = %s
        """, (
            datos.get('fecha'),
            datos.get('cantidad'),
            datos.get('remito'),
            (datos.get('estado') or 'programada').lower(),
            datos.get('cliente_nombre'),
            datos.get('recibido_por'),
            datos.get('observaciones'),
            id_entrega
        ))
        conexion.commit()
        return jsonify({"status": "success", "message": "Entrega actualizada"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/entregas/<int:id_entrega>', methods=['DELETE'])
def eliminar_entrega(id_entrega):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM entregas WHERE id_entrega = %s", (id_entrega,))
        conexion.commit()
        return jsonify({"status": "success", "message": "Entrega eliminada"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()



@app.route('/api/inquiries', methods=['POST'])
def crear_inquiry():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        full_name = datos.get('fullName') or datos.get('full_name')
        company = datos.get('company')
        email = datos.get('email')
        phone = datos.get('phone', '')
        piece = datos.get('piece')
        message = datos.get('message')

        # Validación de campos obligatorios
        if not full_name or not company or not email or not piece or not message:
            return jsonify({"status": "error", "message": "Faltan campos obligatorios (fullName, company, email, piece, message)"}), 400

        cursor = conexion.cursor()
        sql = """
            INSERT INTO inquiries (full_name, company, email, phone, piece, message, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'new', NOW())
        """
        cursor.execute(sql, (full_name, company, email, phone, piece, message))
        conexion.commit()
        nuevo_id = cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": "Consulta creada exitosamente",
            "data": {"id": nuevo_id, **datos, "status": "new"}
        }), 201
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


@app.route('/api/inquiries', methods=['GET'])
def listar_inquiries():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        cursor = conexion.cursor(dictionary=True)
        status_filter = request.args.get('status')

        if status_filter:
            sql = """
                SELECT id, full_name, company, email, phone, piece, message, status, created_at
                FROM inquiries
                WHERE status = %s
                ORDER BY created_at DESC
            """
            cursor.execute(sql, (status_filter,))
        else:
            sql = """
                SELECT id, full_name, company, email, phone, piece, message, status, created_at
                FROM inquiries
                ORDER BY created_at DESC
            """
            cursor.execute(sql)

        filas = cursor.fetchall()
        for f in filas:
            if isinstance(f.get('created_at'), (datetime.date, datetime.datetime)):
                f['created_at'] = f['created_at'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({"status": "success", "data": filas}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()


@app.route('/api/inquiries/<int:id_inquiry>/status', methods=['PATCH'])
def actualizar_estado_inquiry(id_inquiry):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "Sin conexión a la base de datos"}), 500
    try:
        datos = request.get_json() or {}
        nuevo_estado = (datos.get('status') or '').lower()

        # Validar que el estado pertenezca al ENUM permitido
        estados_validos = ['new', 'contacted', 'converted', 'discarded']
        if nuevo_estado not in estados_validos:
            return jsonify({"status": "error", "message": f"Estado no válido. Use uno de: {estados_validos}"}), 400

        cursor = conexion.cursor()
        sql = "UPDATE inquiries SET status = %s WHERE id = %s"
        cursor.execute(sql, (nuevo_estado, id_inquiry))
        conexion.commit()

        return jsonify({"status": "success", "message": "Estado de la consulta actualizado correctamente"}), 200
    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)