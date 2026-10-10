"""Order emails over SMTP. Every attempt is logged in order_emails (visible in admin)."""
import smtplib
import ssl
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import OrderEmail, SiteSettings

TEMPLATES = {
    "placed": ("Your order {n} has been placed", "Thank you! We received your order and will confirm it shortly."),
    "confirmed": ("Your order {n} is confirmed", "Good news — your order is confirmed and is being prepared."),
    "processing": ("Your order {n} is being prepared", "Your order is being packed."),
    "shipped": ("Your order {n} has shipped", "Your order is on the way."),
    "delivered": ("Your order {n} was delivered", "Your order has been delivered. Enjoy!"),
    "cancelled": ("Your order {n} was cancelled", "Your order has been cancelled. Contact us if this is a mistake."),
}


def _html(order, brand: str, intro: str) -> str:
    rows = "".join(
        f"<tr><td style='padding:6px 0'>{i.get('name','Item')} × {i.get('quantity',1)}</td>"
        f"<td style='text-align:right'>Rs {float(i.get('price',0))*int(i.get('quantity',1)):,.0f}</td></tr>"
        for i in (order.items or [])
    )
    track = ""
    if order.tracking_number:
        track = f"<p><b>Courier:</b> {order.courier or '-'}<br><b>Tracking #:</b> {order.tracking_number}</p>"
    return f"""<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
<h2>{brand}</h2><p>Hi {order.customer_name},</p><p>{intro}</p>
<p><b>Order #:</b> {order.order_number}<br><b>Status:</b> {order.status.title()}</p>
<table style="width:100%;border-collapse:collapse">{rows}
<tr><td>Subtotal</td><td style='text-align:right'>Rs {float(order.subtotal):,.0f}</td></tr>
<tr><td>Discount</td><td style='text-align:right'>- Rs {float(order.discount):,.0f}</td></tr>
<tr><td>Shipping</td><td style='text-align:right'>Rs {float(order.shipping):,.0f}</td></tr>
<tr><td><b>Total</b></td><td style='text-align:right'><b>Rs {float(order.total):,.0f}</b></td></tr></table>
{track}<p><b>Ship to:</b> {order.shipping_address or ''} {order.city or ''}</p>
<p style="color:#666;font-size:12px">Payment: {order.payment_method.upper()}</p></div>"""


def send_order_email(db: Session, order, template: str) -> OrderEmail:
    if template not in TEMPLATES:
        template = "placed"
    s = db.query(SiteSettings).first()
    brand = s.brand_name if s else "Timera"
    subject_t, intro = TEMPLATES[template]
    subject = subject_t.format(n=order.order_number)
    log = OrderEmail(order_id=order.id, order_number=order.order_number, recipient=order.customer_email,
                     customer_name=order.customer_name, template=template, subject=subject, status="queued")
    db.add(log)
    if not settings.SMTP_HOST:
        log.status, log.error = "skipped", "SMTP not configured"
        db.commit()
        return log
    try:
        msg = EmailMessage()
        msg["Subject"], msg["From"], msg["To"] = subject, settings.SMTP_FROM, order.customer_email
        if settings.ADMIN_NOTIFY_EMAIL and template == "placed":
            msg["Bcc"] = settings.ADMIN_NOTIFY_EMAIL
        msg.set_content(f"{intro}\nOrder {order.order_number} — total Rs {float(order.total):,.0f}")
        msg.add_alternative(_html(order, brand, intro), subtype="html")
        if settings.SMTP_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=ssl.create_default_context(), timeout=20) as srv:
                srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD); srv.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as srv:
                srv.starttls(context=ssl.create_default_context())
                if settings.SMTP_USER:
                    srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                srv.send_message(msg)
        log.status = "sent"
    except Exception as e:  # never break order flow because of email
        log.status, log.error = "failed", str(e)[:500]
    db.commit()
    return log
