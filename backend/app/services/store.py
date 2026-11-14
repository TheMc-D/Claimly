"""SQLite storage. Each mutation runs in a transaction, including inbox delivery."""
import sqlite3
from contextlib import contextmanager


class Store:
    def __init__(self, path: str):
        self.path = path
        with self.connect() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS evidence (
                    id TEXT PRIMARY KEY, claim_id TEXT NOT NULL, content BLOB NOT NULL
                );
                CREATE TABLE IF NOT EXISTS inbox (
                    id TEXT PRIMARY KEY, claim_id TEXT UNIQUE NOT NULL, data TEXT NOT NULL
                );
            ''')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=30)
        try:
            db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
