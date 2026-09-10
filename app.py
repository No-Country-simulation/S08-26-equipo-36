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

if __name__ == '__main__':
    app.run(debug=True, port=5000)