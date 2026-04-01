import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings

logger = logging.getLogger(__name__)


async def send_temp_password_email(email: str, username: str, temp_password: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(f"Email not configured. Temp password for {email}: {temp_password}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "1С Академия — Восстановление пароля"
    msg["From"] = settings.SMTP_USER
    msg["To"] = email

    html = f"""
    <html><body style="font-family: Arial, sans-serif; background: #0a0a0f; color: #e0e0e0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111128; border: 1px solid #ff2200;
                  border-radius: 12px; padding: 30px;">
        <h1 style="color: #ff2200;">1С Академия</h1>
        <p>Привет, <strong>{username}</strong>!</p>
        <p>Ваш временный пароль:</p>
        <div style="background: #0a0a0f; border: 1px solid #ff8800; border-radius: 8px;
                    padding: 15px; font-size: 20px; font-family: monospace; color: #ff8800;
                    text-align: center; letter-spacing: 2px;">
          {temp_password}
        </div>
        <p style="color: #888; margin-top: 20px;">
          Войдите с этим паролем и сразу смените его в профиле.
        </p>
      </div>
    </body></html>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        if settings.SMTP_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, email, msg.as_string())
        server.quit()
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
