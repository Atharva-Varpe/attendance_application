import os

# Base directory for backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODULE_DIR = os.path.dirname(os.path.abspath(__file__))

# Security / JWT
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "8"))
ALGORITHM = "HS256"

# CORS
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:80,http://localhost:3000"
).split(",")

# Database
DATABASE_PATH = os.environ.get("DATABASE", os.path.join(MODULE_DIR, "employee.db"))
SCHEMA_PATH = os.path.join(MODULE_DIR, "schema.sql")
