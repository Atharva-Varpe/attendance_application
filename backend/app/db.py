import os
import sqlite3
from .config import DATABASE_PATH, SCHEMA_PATH


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    _apply_pragmas(conn)
    return conn


def _apply_pragmas(conn: sqlite3.Connection) -> None:
    try:
        cur = conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA synchronous=NORMAL;")
        cur.execute("PRAGMA foreign_keys=ON;")
        cur.close()
    except Exception:
        # Pragmas are best-effort; ignore if not supported
        pass


def init_db_if_needed() -> None:
    need_init = False
    if not os.path.exists(DATABASE_PATH):
        need_init = True
    else:
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees';")
            row = cur.fetchone()
            conn.close()
            if not row:
                need_init = True
        except sqlite3.Error:
            need_init = True

    if need_init:
        conn = get_db_connection()
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            sql_script = f.read()
        cur = conn.cursor()
        cur.executescript(sql_script)
        conn.commit()
        conn.close()
