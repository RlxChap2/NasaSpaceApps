from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "astronaut_health.db"
INPUT_DIR = DATA_DIR / "input"
OSDR_DIR = DATA_DIR / "osdr"

LABEL_SIMULATED = "SIMULATED - NASA Calibrated"
LABEL_USER_INPUT = "USER INPUT - Astronaut Self-Assessment"
LABEL_REAL_OSDR = "REAL NASA OSDR DATA (Astronaut Pre/Post-Flight Lab)"
USER_SOURCE_LABEL = "Astronaut self-assessment"

STATUS_GREEN = "GREEN - NOMINAL"
STATUS_YELLOW = "YELLOW - WARNING"
STATUS_RED = "RED - CRITICAL ALERT"

SEVERITY_RED = "RED"
SEVERITY_YELLOW = "YELLOW"

ASTRONAUT_IDS = ("C001", "C002", "C003", "C004")
MISSION_PHASES = ("Pre-Flight", "In-Flight", "Post-Flight")

SOURCE_MAP: dict[str, tuple[str, str]] = {
    "NATURE_I4": ("Nature PMC11357997", "https://pmc.ncbi.nlm.nih.gov/articles/PMC11357997/"),
    "NIH_SLEEP": ("NIH PMC12155433", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12155433/"),
    "NASA_STD_3001_V1": ("NASA-STD-3001 Vol 1", "https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf"),
    "OSDR_569": ("NASA OSDR OSD-569", "https://osdr.nasa.gov/bio/repo/data/studies/OSD-569/"),
    "OSDR_575": ("NASA OSDR OSD-575", "https://osdr.nasa.gov/bio/repo/data/studies/OSD-575/"),
    "OSDR_656": ("NASA OSDR OSD-656", "https://osdr.nasa.gov/bio/repo/data/studies/OSD-656"),
    "PHYSIONET_MMASH": ("PhysioNet MMASH", "https://physionet.org/content/mmash/"),
}
