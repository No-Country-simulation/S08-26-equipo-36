from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db_connection  

app = Flask(__name__)
CORS(app)

@app.route('/api/status', methods=['GET'])
def status():
    conexion = get_db_connection()
    
    if conexion and conexion.is_connected():
        estado_db = "Conectado exitosamente a MySQL "
        conexion.close() 
    else:
        estado_db = "Error de conexión a la base de datos "

    return jsonify({
        "status": "Servidor QualityTrack en línea", 
        "arquitectura": "Modular",
        "base_de_datos": estado_db
    }), 200

@app.route('/api/ot/<int:id_ot>/control', methods=['PUT'])
def control_calidad(id_ot):
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500

    try:
        datos = request.get_json()
        decision = datos.get('decision')
        observacion = datos.get('observacion', '')
        
        cursor = conexion.cursor()

        if decision == 'ok':
            cursor.execute("UPDATE Ordenes_Trabajo SET estado_actual = 'Entregada' WHERE id_ot = %s", (id_ot,))
            mensaje = "Control aprobado."
        elif decision == 'nc':
            cursor.execute("UPDATE Ordenes_Trabajo SET estado_actual = 'Detenida' WHERE id_ot = %s", (id_ot,))
            if observacion:
                cursor.execute("INSERT INTO Fallas (id_ot, tipo_falla, descripcion) VALUES (%s, 'Critica', %s)", (id_ot, observacion))
            mensaje = "Control rechazado. OT Detenida."
        else:
            return jsonify({"status": "error", "message": "Decisión no válida"}), 400

        conexion.commit()
        return jsonify({"status": "success", "message": mensaje}), 200

    except Exception as e:
        conexion.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()

@app.route('/api/ordenes', methods=['GET'])
def listar_ordenes():
    conexion = get_db_connection()
    if not conexion:
        return jsonify({"status": "error", "message": "No hay conexión a la base de datos"}), 500

    try:
        # dictionary=True devuelve los registros como JSON automáticamente
        cursor = conexion.cursor(dictionary=True)

        sql = """
            SELECT
                ot.id_ot,
                ot.estado_actual,
                ot.fecha_inicio,
                ot.fecha_entrega_estimada,
                c.descripcion_requerimiento,
                cl.razon_social AS cliente_nombre,
                cl.ruc_nit
            FROM Ordenes_Trabajo ot
            INNER JOIN Cotizaciones c ON ot.id_cotizacion = c.id_cotizacion
            INNER JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            ORDER BY ot.id_ot DESC
        """
        cursor.execute(sql)
        ordenes = cursor.fetchall()
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

        # 1. Datos generales de la OT
        sql_ot = """
            SELECT ot.*, c.descripcion_requerimiento, cl.razon_social, cl.email
            FROM Ordenes_Trabajo ot
            JOIN Cotizaciones c ON ot.id_cotizacion = c.id_cotizacion
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            WHERE ot.id_ot = %s
        """
        cursor.execute(sql_ot, (id_ot,))
        orden = cursor.fetchone()

        if not orden:
            return jsonify({"status": "error", "message": "Orden de Trabajo no encontrada"}), 404

        # 2. Operaciones asociadas a esa orden
        cursor.execute("SELECT * FROM Operaciones WHERE id_ot = %s", (id_ot,))
        orden['operaciones'] = cursor.fetchall()

        # 3. Documentos adjuntos (Planos PDF)
        cursor.execute("SELECT * FROM Documentos WHERE id_ot = %s", (id_ot,))
        orden['documentos'] = cursor.fetchall()

        return jsonify({"status": "success", "data": orden}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if conexion.is_connected(): conexion.close()
if __name__ == '__main__':
    app.run(debug=True, port=5000)