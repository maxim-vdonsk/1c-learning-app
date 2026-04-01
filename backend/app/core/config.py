from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    APP_NAME: str = "1С Академия"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/onec_learning"

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://frontend:3000",
    ]

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    SANDBOX_IMAGE: str = "onec-sandbox:latest"
    SANDBOX_TIMEOUT_SECONDS: int = 15
    SANDBOX_MEMORY_LIMIT: str = "64m"
    SANDBOX_CPU_QUOTA: int = 50000  # 50% of one CPU

    GPT_MODEL: str = "gpt-4o-mini"

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
