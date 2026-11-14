import json
import sqlite3

from fastapi import APIRouter, Depends, Query

from app.db import get_db
from app.schemas import OsdrFileRecord, OsdrLabResultRecord

router = APIRouter(prefix="/api", tags=["osdr"])


@router.get("/osdr-files", response_model=list[OsdrFileRecord])
def list_osdr_files(conn: sqlite3.Connection = Depends(get_db)) -> list[OsdrFileRecord]:
    rows = conn.execute(
        """
        SELECT f.*, COALESCE(c.row_count, 0) AS parsed_row_count
        FROM real_nasa_osdr_files_map f
        LEFT JOIN (
            SELECT file_id, COUNT(*) AS row_count
            FROM real_osdr_lab_results
            GROUP BY file_id
        ) c ON c.file_id = f.file_id
        ORDER BY f.file_id
        """
    ).fetchall()
    return [OsdrFileRecord(**dict(row)) for row in rows]


@router.get("/osdr-lab-results", response_model=list[OsdrLabResultRecord])
def list_osdr_lab_results(fileId: str | None = Query(default=None),conn: sqlite3.Connection = Depends(get_db)) -> list[OsdrLabResultRecord]:
    if fileId is not None:
        rows = conn.execute(
            "SELECT * FROM real_osdr_lab_results WHERE file_id = ? ORDER BY id",
            (fileId,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM real_osdr_lab_results ORDER BY id").fetchall()

    results: list[OsdrLabResultRecord] = []
    for row in rows:
        item = dict(row)
        item["row_data"] = json.loads(item["row_data"])
        results.append(OsdrLabResultRecord(**item))
    return results
