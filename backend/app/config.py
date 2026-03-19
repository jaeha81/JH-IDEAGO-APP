from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Object Storage (S3-compatible) — all optional for core features
    # Without storage: file uploads and AI images are disabled; all other features work.
    # Set STORAGE_ACCESS_KEY + STORAGE_SECRET_KEY to enable file/image features.
    STORAGE_ENDPOINT_URL: str | None = None
    STORAGE_ACCESS_KEY: str | None = None
    STORAGE_SECRET_KEY: str | None = None
    STORAGE_BUCKET_NAME: str = "ideago"
    STORAGE_PRESIGN_EXPIRY_SECONDS: int = 3600

    @property
    def storage_enabled(self) -> bool:
        """Returns True if storage credentials are configured."""
        return bool(self.STORAGE_ACCESS_KEY and self.STORAGE_SECRET_KEY)

    # CORS — comma-separated list of allowed origins.
    # Includes Capacitor Android origins (https://localhost, capacitor://localhost)
    # and any production web front-end URL.
    CORS_ORIGINS: str = "http://localhost:3000,https://localhost,capacitor://localhost"

    # AI
    ANTHROPIC_API_KEY: str

    # Celery / Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # App limits
    APP_ENV: str = "development"
    MAX_UPLOAD_SIZE_MB: int = 20
    CANVAS_MAX_PAYLOAD_MB: int = 10
    CANVAS_AUTO_SAVE_INTERVAL_MINUTES: int = 5
    AI_CONTEXT_MAX_EVENTS: int = 30
    AI_CONTEXT_MAX_INPUT_TOKENS: int = 2000
    AI_MAX_OUTPUT_TOKENS: int = 2000
    AI_AGENT_TIMEOUT_SECONDS: int = 15
    EXPORT_DOWNLOAD_EXPIRY_HOURS: int = 24
    AUTOTITLE_RATE_LIMIT_SECONDS: int = 30


settings = Settings()
