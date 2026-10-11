import re
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, Integer, BigInteger, Numeric, Uuid

PROTECTED = {"id", "created_at", "updated_at"}


def col_kind(col) -> str:
    t = col.type
    if isinstance(t, Boolean): return "bool"
    if isinstance(t, (Integer, BigInteger)): return "int"
    if isinstance(t, Numeric): return "num"
    if isinstance(t, DateTime): return "datetime"
    if isinstance(t, Date): return "date"
    if isinstance(t, Uuid): return "uuid"
    if isinstance(t, JSON) or "JSON" in type(t).__name__.upper() or hasattr(t, "impl") and isinstance(getattr(t, "impl", None), JSON):
        return "json"
    return "text"


def _kind(model, key):
    c = model.__table__.columns[key]
    k = col_kind(c)
    if k == "text" and "JSON" in repr(c.type).upper():
        return "json"
    return k


def to_dict(obj) -> dict:
    out = {}
    for c in obj.__table__.columns:
        attr = next((a for a in obj.__mapper__.column_attrs if a.columns[0] is c), None)
        v = getattr(obj, attr.key if attr else c.key)
        if isinstance(v, uuid.UUID): v = str(v)
        elif isinstance(v, (datetime, date)): v = v.isoformat()
        elif isinstance(v, Decimal): v = float(v)
        out[c.name] = v
    return out


def coerce(model, data: dict, partial=True, allow_id=False) -> dict:
    """Keep only real columns and convert JSON strings to python values."""
    cols = {c.name: c for c in model.__table__.columns}
    attr_for = {a.columns[0].name: a.key for a in model.__mapper__.column_attrs}
    out = {}
    for k, v in data.items():
        if k not in cols or (k in PROTECTED and not allow_id) or k == "password_hash":
            continue
        kind = _kind(model, k)
        if v == "" and kind != "text":
            v = None
        if v is not None and isinstance(v, str) and kind == "json":
            import json as _j
            try: v = _j.loads(v)
            except ValueError: pass
        if v is not None:
            if kind == "datetime" and isinstance(v, str): v = datetime.fromisoformat(v.replace("Z", "+00:00"))
            elif kind == "date" and isinstance(v, str): v = date.fromisoformat(v[:10])
            elif kind == "uuid" and isinstance(v, str): v = uuid.UUID(v)
            elif kind == "int": v = int(v)
            elif kind == "num": v = Decimal(str(v))
            elif kind == "bool" and isinstance(v, str): v = v.lower() in ("1", "true", "yes", "on")
        out[attr_for[k]] = v
    return out


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or uuid.uuid4().hex[:8]
