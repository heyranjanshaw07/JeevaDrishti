import logging
import sys

def setup_logging(debug: bool = False, level_name: str = "INFO") -> None:
    """Configure standard application logging for JeevaDrishti."""
    configured_level = getattr(logging, level_name.upper(), None) if level_name else None
    if configured_level is not None:
        log_level = configured_level
    else:
        log_level = logging.DEBUG if debug else logging.INFO
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"


    # Configure root handler
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Silence overly verbose external loggers
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)


logger = logging.getLogger("jeevadrishti")
