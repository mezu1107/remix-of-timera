from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Timera API"
    DATABASE_URL: str = "postgresql+psycopg://timera:timera@localhost:5432/timera"
    JWT_SECRET: str = "change-me-to-a-long-random-string"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    CORS_ORIGINS: str = "*"  # comma separated, e.g. https://timera.pk,https://www.timera.pk
    PUBLIC_BASE_URL: str = "http://localhost:8000"  # used to build upload URLs
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 200

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Timera <orders@timera.pk>"
    SMTP_SSL: bool = False
    ADMIN_NOTIFY_EMAIL: str = ""

    # Meta Conversions API
    META_PIXEL_ID: str = ""
    META_ACCESS_TOKEN: str = ""
    META_TEST_EVENT_CODE: str = ""

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
