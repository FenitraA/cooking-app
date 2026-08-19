from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str

    HOST: str
    PORT: int
    DEBUG: bool
    ENVIRONMENT: str

    SECRET_KEY: str
    REFRESH_TOKEN_SECRET_KEY: str
    ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    ADMIN_ROLE_DENOMINATION: str
    BASIC_ROLE_DENOMINATION: str
    READ_ONLY_ROLE_DENOMINATION: str
    INGREDIENT_MANAGER_ROLE_DENOMINATION: str

    ONLINE_PROD_DATABASE_URL: str
    ONLINE_DEV_DATABASE_URL: str
    DEV_DATABASE_URL: str
    TEST_DATABASE_URL: str

    CLOUDINARY_CLOUD_NAME : str
    CLOUDINARY_API_KEY : str
    CLOUDINARY_API_SECRET : str
    
    CORS_ORIGINS: List[str]
    
    model_config = ConfigDict(env_file=".env")


settings = Settings()
