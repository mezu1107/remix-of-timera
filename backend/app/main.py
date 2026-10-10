import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app import models  # noqa: F401  (registers tables)
from app.routers import admin, auth, orders, public, tracking

Base.metadata.create_all(engine)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title=settings.APP_NAME)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_list, allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])
for r in (public.router, auth.router, orders.router, tracking.router, admin.router):
    app.include_router(r)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

ADMIN_HTML = os.path.join(os.path.dirname(__file__), "admin_panel", "index.html")


@app.get("/admin", include_in_schema=False)
@app.get("/admin/{path:path}", include_in_schema=False)
def admin_panel(path: str = ""):
    return FileResponse(ADMIN_HTML)


@app.get("/", include_in_schema=False)
def root():
    return {"ok": True, "name": settings.APP_NAME, "docs": "/docs", "admin": "/admin"}
