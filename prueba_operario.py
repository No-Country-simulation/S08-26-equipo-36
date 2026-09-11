import requests

url = 'http://127.0.0.1:5000/api/fallas'

datos_tablet = {
    "id_ot": 1,  
    "tipo_falla": "Critica",
    "descripcion": "Eje principal descentrado durante el desbaste."
}

print("Enviando reporte de falla al servidor...")

respuesta = requests.post(url, json=datos_tablet)

print("Código de estado:", respuesta.status_code)
print("Respuesta del backend:", respuesta.json())