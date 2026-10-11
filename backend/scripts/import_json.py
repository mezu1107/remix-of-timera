"""Import existing store data exported as JSON files (one file per table, a JSON array of rows).
Usage: python -m scripts.import_json ./export_folder
Files are matched by table name, e.g. products.json, orders.json, site_settings.json.
Existing rows with the same id are updated; unknown columns are ignored.
"""
import json
import os
import shutil
import sys

from app.core.config import settings

from app.core.database import Base, SessionLocal, engine
from app.core.utils import coerce
from app import models as M

ORDER = ["collections", "categories", "deals", "products", "coupons", "hero_slides", "popups", "reviews",
         "blog_posts", "faqs", "trust_sections", "site_settings", "payment_settings", "meta_settings",
         "orders", "order_emails", "cart_leads", "analytics_events", "meta_event_log"]


def models_by_table():
    return {m.__tablename__: m for m in vars(M).values() if isinstance(m, type) and hasattr(m, "__tablename__")}


def main(folder: str):
    Base.metadata.create_all(engine)
    up = os.path.join(folder, "uploads")
    if os.path.isdir(up):
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        for f in os.listdir(up): shutil.copy(os.path.join(up, f), settings.UPLOAD_DIR)
    tables = models_by_table(); db = SessionLocal()
    for name in ORDER:
        path = os.path.join(folder, f"{name}.json")
        if not os.path.exists(path) or name not in tables: continue
        model = tables[name]; rows = json.loads(open(path, encoding="utf-8").read().replace("{{BASE}}", settings.PUBLIC_BASE_URL.rstrip("/"))); n = 0
        for r in rows:
            data = coerce(model, r, allow_id=True)
            obj = db.get(model, data["id"]) if data.get("id") else None
            if obj:
                for k, v in data.items(): setattr(obj, k, v)
            else:
                db.add(model(**data))
            n += 1
        db.commit(); print(f"{name}: {n} rows")
    print("Done.")


if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit("Usage: python -m scripts.import_json FOLDER")
    main(sys.argv[1])
