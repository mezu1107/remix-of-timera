"""Meta Conversions API (server-side). Fails silently, logs to meta_event_log."""
import hashlib
import re
import time

import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import MetaEventLog


def _h(v: str | None) -> list[str] | None:
    if not v:
        return None
    return [hashlib.sha256(v.strip().lower().encode()).hexdigest()]


def norm_phone(p: str | None) -> str | None:
    if not p:
        return None
    d = re.sub(r"\D", "", p)
    if d.startswith("0"):
        d = "92" + d[1:]
    return d or None


def send_event(db: Session, event_name: str, event_id: str, *, value=None, currency="PKR", custom: dict | None = None,
               email=None, phone=None, fbp=None, fbc=None, ip=None, ua=None, url=None, order=None) -> str:
    log = MetaEventLog(event_name=event_name, event_id=event_id, event_source="server",
                       order_number=getattr(order, "order_number", None), order_id=getattr(order, "id", None),
                       value=value, currency=currency, test_event=bool(settings.META_TEST_EVENT_CODE))
    db.add(log)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return "duplicate"
    if not (settings.META_PIXEL_ID and settings.META_ACCESS_TOKEN):
        log.status, log.error = "skipped", "Meta not configured"; db.commit(); return "skipped"
    user = {k: v for k, v in {"em": _h(email), "ph": _h(norm_phone(phone)), "fbp": fbp, "fbc": fbc,
                               "client_ip_address": ip, "client_user_agent": ua}.items() if v}
    cd = dict(custom or {})
    if value is not None:
        cd.update(value=float(value), currency=currency)
    body = {"data": [{"event_name": event_name, "event_time": int(time.time()), "event_id": event_id,
                      "action_source": "website", "event_source_url": url, "user_data": user, "custom_data": cd}]}
    if settings.META_TEST_EVENT_CODE:
        body["test_event_code"] = settings.META_TEST_EVENT_CODE
    try:
        r = httpx.post(f"https://graph.facebook.com/v21.0/{settings.META_PIXEL_ID}/events",
                       params={"access_token": settings.META_ACCESS_TOKEN}, json=body, timeout=10)
        j = r.json()
        log.status = "sent" if r.is_success else "failed"
        log.events_received = j.get("events_received"); log.fbtrace_id = j.get("fbtrace_id")
        if not r.is_success:
            log.error = str(j.get("error"))[:500]
    except Exception as e:
        log.status, log.error = "failed", str(e)[:500]
    db.commit()
    return log.status
