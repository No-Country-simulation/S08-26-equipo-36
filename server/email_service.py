import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Blueprint, request, jsonify

# Lectura nativa del archivo .env sin librerías externas
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    with open(env_file, 'r', encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if linea and not linea.startswith('#') and '=' in linea:
                clave, valor = linea.split('=', 1)
                os.environ[clave.strip()] = valor.strip().strip('"').strip("'")

email_bp = Blueprint('email_bp', __name__)

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")

# URL del logo entregado en PNG por Cloudinary para compatibilidad universal de correo
LOGO_URL = "https://res.cloudinary.com/carina-bosio/image/upload/v1790221447/Imagotipo-Sidebar.png"


# --- TEMPLATE: TRACKING DE ORDEN DE TRABAJO ---
def render_email_template(cliente, ot_numero, pieza, tracking_url):
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
      color: #1e293b;
    }}
    .container {{
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    .header {{
      background-color: #0B0F19;
      padding: 24px;
      text-align: center;
    }}
    .header-sub {{
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }}
    .body-content {{
      padding: 28px 24px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }}
    .text {{
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 20px;
    }}
    .card-info {{
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }}
    .card-row {{
      font-size: 13px;
      color: #334155;
      margin-bottom: 6px;
    }}
    .card-row:last-child {{
      margin-bottom: 0;
    }}
    .ot-code {{
      color: #d97706;
      font-weight: 700;
    }}
    .btn-container {{
      text-align: center;
      margin: 28px 0;
    }}
    .btn {{
      display: inline-block;
      background-color: #f59e0b;
      color: #0b0f19 !important;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
    }}
    .footer {{
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img 
        src="{LOGO_URL}" 
        alt="QualityTrack" 
        width="180"
        style="display: block; margin: 0 auto; max-width: 180px; height: auto; border: 0;"
      />
      <div class="header-sub">Trazabilidad y Control de Calidad</div>
    </div>
    <div class="body-content">
      <div class="greeting">Hola {cliente},</div>
      <p class="text">
        Te informamos que tu <strong>Orden de Trabajo</strong> ha sido formalizada e ingresó al circuito de producción de nuestro taller.
      </p>
      
      <div class="card-info">
        <div class="card-row"><strong>Pieza:</strong> {pieza}</div>
        <div class="card-row"><strong>N° de Orden:</strong> <span class="ot-code">{ot_numero}</span></div>
      </div>

      <div class="btn-container">
        <a href="{tracking_url}" class="btn" target="_blank">Consultar Avance en Tiempo Real →</a>
      </div>

      <p class="text" style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">
        También podés acceder directamente mediante este enlace:<br>
        <a href="{tracking_url}" style="color: #2563eb;">{tracking_url}</a>
      </p>
    </div>
    <div class="footer">
      QualityTrack &copy; 2026. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>"""


# --- TEMPLATE: RESPUESTA A CONSULTAS (INQUIRIES) ---
def render_inquiry_reply_template(cliente, consulta_original, mensaje_respuesta):
    parrafos_html = "".join([f"<p style='margin: 0 0 12px 0;'>{line}</p>" for line in mensaje_respuesta.split("\n") if line.strip()])

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
      color: #1e293b;
    }}
    .container {{
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    .header {{
      background-color: #0B0F19;
      padding: 24px;
      text-align: center;
    }}
    .header-sub {{
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 6px;
    }}
    .body-content {{
      padding: 28px 24px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }}
    .reply-box {{
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }}
    .quote-box {{
      background-color: #f8fafc;
      border-left: 3px solid #f59e0b;
      padding: 14px 18px;
      margin-bottom: 24px;
      border-radius: 0 8px 8px 0;
    }}
    .quote-title {{
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }}
    .quote-text {{
      font-size: 13px;
      color: #475569;
      font-style: italic;
      margin: 0;
      line-height: 1.5;
    }}
    .footer {{
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img 
        src="{LOGO_URL}" 
        alt="QualityTrack" 
        width="180"
        style="display: block; margin: 0 auto; max-width: 180px; height: auto; border: 0;"
      />
      <div class="header-sub">Atención Comercial y Técnica</div>
    </div>
    <div class="body-content">
      <div class="greeting">Hola {cliente},</div>
      
      <div class="reply-box">
        {parrafos_html}
      </div>

      {f'''
      <div class="quote-box">
        <div class="quote-title">Tu consulta original:</div>
        <p class="quote-text">"{consulta_original}"</p>
      </div>
      ''' if consulta_original else ''}

    </div>
    <div class="footer">
      QualityTrack &copy; 2026. Trazabilidad y Control de Calidad en Mecanizado.
    </div>
  </div>
</body>
</html>"""


# --- ENDPOINT 1: TRACKING EMAIL ---
@email_bp.route('/api/ordenes/enviar-tracking', methods=['POST', 'OPTIONS'])
def enviar_tracking_email():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        datos = request.get_json() or {}
        destinatario = datos.get('email')
        ot_numero = datos.get('numero')
        cliente = datos.get('cliente') or 'Estimado cliente'
        pieza = datos.get('pieza') or 'Pieza mecanizada'
        tracking_url = datos.get('tracking_url') or f"http://localhost:5173/seguimiento?ot={ot_numero}"

        if not destinatario or not ot_numero:
            return jsonify({
                "status": "error", 
                "message": "Destinatario y número de OT son obligatorios"
            }), 400

        if not SMTP_USER or not SMTP_PASS:
            print(f"\n[AVISO SMTP] Modo simulación activo. Notificación para: {destinatario} | OT: {ot_numero}")
            return jsonify({
                "status": "success", 
                "message": "Correo enviado con éxito (modo simulación)"
            }), 200

        html_content = render_email_template(cliente, ot_numero, pieza, tracking_url)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"QualityTrack - Seguimiento Orden de Trabajo {ot_numero}"
        msg["From"] = f"QualityTrack <{SMTP_USER}>"
        msg["To"] = destinatario
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())
        server.quit()

        return jsonify({"status": "success", "message": "Correo enviado con éxito"}), 200

    except Exception as e:
        print(f"[SMTP Error Tracking] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# --- ENDPOINT 2: RESPUESTA DE CONSULTAS ---
@email_bp.route('/api/inquiries/responder-email', methods=['POST', 'OPTIONS'])
def responder_inquiry_email():
    if request.method == 'OPTIONS':
        return ('', 200)

    try:
        datos = request.get_json() or {}
        destinatario = datos.get('email')
        cliente = datos.get('cliente') or 'Estimado cliente'
        asunto = datos.get('asunto') or 'Respuesta a su consulta - QualityTrack'
        mensaje = datos.get('mensaje') or ''
        consulta_original = datos.get('consulta_original') or ''

        if not destinatario or not mensaje:
            return jsonify({
                "status": "error", 
                "message": "Destinatario y mensaje son obligatorios"
            }), 400

        if not SMTP_USER or not SMTP_PASS:
            print(f"\n[AVISO SMTP] Modo simulación activo. Respuesta para: {destinatario}")
            return jsonify({
                "status": "success", 
                "message": "Respuesta enviada (modo simulación)"
            }), 200

        html_content = render_inquiry_reply_template(cliente, consulta_original, mensaje)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = asunto
        msg["From"] = f"QualityTrack <{SMTP_USER}>"
        msg["To"] = destinatario
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, destinatario, msg.as_string())
        server.quit()

        return jsonify({"status": "success", "message": "Correo enviado con éxito"}), 200

    except Exception as e:
        print(f"[SMTP Error Inquiry] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500