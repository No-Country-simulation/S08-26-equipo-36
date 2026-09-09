import mysql.connector
from config import Config

def get_db_connection():
    """
    Establece y retorna la conexión a la base de datos.
    Si hay un error, lo captura para que el servidor no se caiga.
    """
    try:
        conexion = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        return conexion
    except mysql.connector.Error as err:
        print(f" Error conectando a MySQL: {err}")
        return None