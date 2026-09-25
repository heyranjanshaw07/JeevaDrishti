from sqlalchemy import inspect, text
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine as default_engine


def init_db(target_engine=None) -> None:
    """
    Initialize database tables and synchronize table columns for dev SQLite.
    Idempotent and safe to run on every application startup.
    """
    eng = target_engine or default_engine

    # Ensure all tables exist
    Base.metadata.create_all(bind=eng)

    # Inspect existing tables and add any new columns (e.g. B7 benchmark fields)
    try:
        inspector = inspect(eng)
        table_names = inspector.get_table_names()

        if "benchmark_results" in table_names:
            existing_cols = {c["name"] for c in inspector.get_columns("benchmark_results")}
            new_columns = [
                ("experiment_id", "VARCHAR(64)"),
                ("status", "VARCHAR(20) DEFAULT 'not_available'"),
                ("image_count", "INTEGER"),
                ("failed_images", "INTEGER"),
                ("iou_threshold", "FLOAT"),
                ("vlm_model", "VARCHAR(100)"),
                ("error_message", "TEXT"),
                ("accuracy", "FLOAT"),
                ("task_type", "VARCHAR(30)"),
            ]
            with eng.begin() as conn:
                for col_name, col_type in new_columns:
                    if col_name not in existing_cols:
                        logger.info("Migrating table benchmark_results: ADD COLUMN %s %s", col_name, col_type)
                        conn.execute(text(f"ALTER TABLE benchmark_results ADD COLUMN {col_name} {col_type}"))

        if "analyses" in table_names:
            existing_analysis_cols = {c["name"] for c in inspector.get_columns("analyses")}
            new_analysis_cols = [
                ("error_message", "VARCHAR(500)"),
                ("overlay_filename", "VARCHAR(255)"),
                ("result_data", "TEXT"),
            ]
            with eng.begin() as conn:
                for col_name, col_type in new_analysis_cols:
                    if col_name not in existing_analysis_cols:
                        logger.info("Migrating table analyses: ADD COLUMN %s %s", col_name, col_type)
                        conn.execute(text(f"ALTER TABLE analyses ADD COLUMN {col_name} {col_type}"))

        # Ensure default researcher accounts exist
        from sqlalchemy.orm import Session
        from app.models.user import User
        from app.core.security import hash_password

        with Session(eng) as session:
            if not session.query(User).filter_by(email="researcher@jeevadrishti.ai").first():
                session.add(User(
                    name="Dr. Evelyn Sharma",
                    email="researcher@jeevadrishti.ai",
                    hashed_password=hash_password("Password123!"),
                    role="lead_researcher",
                    is_active=True,
                ))
            if not session.query(User).filter_by(email="dr.sharma@aiims.edu").first():
                session.add(User(
                    name="Dr. Evelyn Sharma",
                    email="dr.sharma@aiims.edu",
                    hashed_password=hash_password("microscopy-lab-key-2026"),
                    role="lead_researcher",
                    is_active=True,
                ))
            session.commit()
    except Exception as exc:
        logger.warning("Database schema auto-sync encountered warning: %s", exc)

