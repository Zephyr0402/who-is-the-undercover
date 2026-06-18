"""Who Is The Undercover - real-time game server.

FastAPI + native WebSockets. No login; players identify themselves with a
client-generated player id stored in localStorage. Rooms are persisted in
SQLite so browser refreshes and server restarts don't lose game state.
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import sqlite3
import string
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration / state
# ---------------------------------------------------------------------------

STATIC_DIR = Path(__file__).parent / "static"
WORDS_FILE = Path(__file__).parent / "words.json"
DATA_DIR = Path(os.environ.get("WIU_DATA_DIR", Path(__file__).parent / "data"))
DB_FILE = DATA_DIR / "rooms.db"

WORD_PAIRS: list[dict[str, str]] = []

# room_code -> Room
rooms: dict[str, "Room"] = {}
# room_code -> asyncio.Lock
room_locks: dict[str, asyncio.Lock] = {}

# Serialize SQLite writes so we never have two coroutines writing at once.
_db_lock = asyncio.Lock()

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


@dataclass
class Player:
    id: str
    name: str
    is_ready: bool = False
    role: Optional[str] = None  # "civilian" | "undercover"
    word: Optional[str] = None
    ws: Optional[WebSocket] = None
    is_online: bool = False


@dataclass
class Room:
    code: str
    host_id: str
    players: dict[str, Player] = field(default_factory=dict)
    status: str = "waiting"  # "waiting" | "playing" | "finished"
    word_pair: Optional[dict[str, str]] = None
    undercover_ids: set[str] = field(default_factory=set)
    language: str = "en"
    created_at: str = ""
    updated_at: str = ""


class CreateRoomIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    language: str = Field(default="en", pattern=r"^(en|zh)$")
    player_id: Optional[str] = None


class CreateRoomOut(BaseModel):
    room_code: str
    player_id: str
    language: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _generate_code(length: int = 6) -> str:
    """Generate a short, readable room code."""
    # Skip ambiguous characters I, L, O, 0, 1.
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    while True:
        code = "".join(random.choices(alphabet, k=length))
        if code not in rooms:
            return code


def _generate_player_id() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=16))


def _undercover_count(total: int) -> int:
    if total <= 5:
        return 1
    if total <= 8:
        return 2
    if total <= 11:
        return 3
    return 4


def _load_words() -> list[dict[str, str]]:
    if not WORDS_FILE.exists():
        return [{"civilian": "Apple", "undercover": "Pear"}]
    with WORDS_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    return [item for item in data if "civilian" in item and "undercover" in item]


def _db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_FILE, isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS rooms (
    code            TEXT PRIMARY KEY,
    host_id         TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'waiting',
    word_civilian   TEXT,
    word_undercover TEXT,
    undercover_ids  TEXT,           -- JSON list
    language        TEXT    NOT NULL DEFAULT 'en',
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
    id          TEXT    NOT NULL,
    room_code   TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    is_ready    INTEGER NOT NULL DEFAULT 0,
    role        TEXT,
    word        TEXT,
    is_online   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id, room_code),
    FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_updated ON rooms(updated_at);
"""


def init_db() -> None:
    with _db() as conn:
        conn.executescript(SCHEMA)
        # Migration: add language column to rooms created before this feature.
        try:
            conn.execute("ALTER TABLE rooms ADD COLUMN language TEXT NOT NULL DEFAULT 'en'")
        except sqlite3.OperationalError:
            pass


def _room_to_row(room: Room) -> tuple:
    return (
        room.code,
        room.host_id,
        room.status,
        room.word_pair.get("civilian") if room.word_pair else None,
        room.word_pair.get("undercover") if room.word_pair else None,
        json.dumps(sorted(room.undercover_ids)),
        room.language,
        room.created_at,
        room.updated_at,
    )


def _player_to_row(player: Player, room_code: str) -> tuple:
    return (
        player.id,
        room_code,
        player.name,
        int(player.is_ready),
        player.role,
        player.word,
        int(player.is_online),
    )


async def _save_room(room: Room) -> None:
    """Persist a room and all its players to SQLite."""
    async with _db_lock:
        with _db() as conn:
            conn.execute("BEGIN")
            conn.execute(
                """
                INSERT INTO rooms (code, host_id, status, word_civilian, word_undercover,
                                   undercover_ids, language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                    host_id=excluded.host_id,
                    status=excluded.status,
                    word_civilian=excluded.word_civilian,
                    word_undercover=excluded.word_undercover,
                    undercover_ids=excluded.undercover_ids,
                    language=excluded.language,
                    created_at=excluded.created_at,
                    updated_at=excluded.updated_at
                """,
                _room_to_row(room),
            )
            conn.execute("DELETE FROM players WHERE room_code = ?", (room.code,))
            conn.executemany(
                """
                INSERT INTO players (id, room_code, name, is_ready, role, word, is_online)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [_player_to_row(p, room.code) for p in room.players.values()],
            )
            conn.execute("COMMIT")


async def _load_all_rooms() -> None:
    """Load rooms and players from SQLite into memory on startup."""
    global rooms
    with _db() as conn:
        room_rows = conn.execute("SELECT * FROM rooms").fetchall()
        for r in room_rows:
            code = r["code"]
            room = Room(
                code=code,
                host_id=r["host_id"],
                status=r["status"],
                word_pair=None,
                language=r["language"] or "en",
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            if r["word_civilian"] and r["word_undercover"]:
                room.word_pair = {
                    "civilian": r["word_civilian"],
                    "undercover": r["word_undercover"],
                }
            try:
                room.undercover_ids = set(json.loads(r["undercover_ids"] or "[]"))
            except json.JSONDecodeError:
                room.undercover_ids = set()
            rooms[code] = room
            room_locks[code] = asyncio.Lock()

        player_rows = conn.execute("SELECT * FROM players").fetchall()
        for p in player_rows:
            room = rooms.get(p["room_code"])
            if not room:
                continue
            player = Player(
                id=p["id"],
                name=p["name"],
                is_ready=bool(p["is_ready"]),
                role=p["role"],
                word=p["word"],
                is_online=False,  # sockets are gone on restart
            )
            room.players[p["id"]] = player


async def _delete_room(code: str) -> None:
    async with _db_lock:
        with _db() as conn:
            conn.execute("DELETE FROM rooms WHERE code = ?", (code,))
    rooms.pop(code, None)
    room_locks.pop(code, None)


async def _cleanup_old_rooms() -> int:
    """Remove rooms older than 24 hours or empty rooms older than 1 hour."""
    cutoff_old = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    cutoff_empty = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    removed = 0
    with _db() as conn:
        rows = conn.execute(
            """
            SELECT code FROM rooms
            WHERE updated_at < ?
              OR (updated_at < ? AND (
                  SELECT COUNT(*) FROM players p WHERE p.room_code = rooms.code
              ) = 0)
            """,
            (cutoff_old, cutoff_empty),
        ).fetchall()
    for row in rows:
        await _delete_room(row["code"])
        removed += 1
    return removed


async def _cleanup_loop() -> None:
    while True:
        try:
            await asyncio.sleep(600)  # every 10 minutes
            removed = await _cleanup_old_rooms()
            if removed:
                print(f"Cleaned up {removed} stale room(s)")
        except asyncio.CancelledError:
            break
        except Exception as exc:
            print(f"Cleanup error: {exc}")


def _get_or_create_lock(code: str) -> asyncio.Lock:
    if code not in room_locks:
        room_locks[code] = asyncio.Lock()
    return room_locks[code]


def _public_player_for_room(player: Player, room: Room) -> dict:
    return {
        "id": player.id,
        "name": player.name,
        "is_ready": player.is_ready,
        "is_online": player.is_online,
        "is_host": player.id == room.host_id,
    }


def _public_room_state(room: Room) -> dict:
    return {
        "code": room.code,
        "status": room.status,
        "host_id": room.host_id,
        "language": room.language,
        "players": [_public_player_for_room(p, room) for p in room.players.values()],
        "created_at": room.created_at,
        "updated_at": room.updated_at,
    }


async def _send(ws: Optional[WebSocket], message: dict) -> None:
    if ws is None:
        return
    try:
        await ws.send_json(message)
    except Exception:
        pass


async def _broadcast(room: Room, message: dict, exclude: Optional[set[str]] = None) -> None:
    exclude = exclude or set()
    for pid, player in room.players.items():
        if pid in exclude:
            continue
        await _send(player.ws, message)


async def _broadcast_state(room: Room) -> None:
    await _broadcast(room, {"type": "room_state", "room": _public_room_state(room)})


async def _send_private_role(player: Player) -> None:
    await _send(
        player.ws,
        {
            "type": "your_role",
            "role": player.role,
            "word": player.word,
        },
    )


def _assign_roles(room: Room) -> None:
    room.word_pair = random.choice(WORD_PAIRS)
    player_ids = list(room.players.keys())
    random.shuffle(player_ids)
    count = _undercover_count(len(player_ids))
    room.undercover_ids = set(player_ids[:count])
    civilian_word = room.word_pair["civilian"]
    undercover_word = room.word_pair["undercover"]
    for pid, player in room.players.items():
        if pid in room.undercover_ids:
            player.role = "undercover"
            player.word = undercover_word
        else:
            player.role = "civilian"
            player.word = civilian_word


def _reset_room_for_new_round(room: Room) -> None:
    for player in room.players.values():
        player.role = None
        player.word = None
        player.is_ready = False
    room.status = "waiting"
    room.word_pair = None
    room.undercover_ids = set()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global WORD_PAIRS
    WORD_PAIRS = _load_words()
    init_db()
    await _load_all_rooms()
    cleanup_task = asyncio.create_task(_cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Who Is The Undercover", lifespan=lifespan, docs_url=None, redoc_url=None)

# Allow browser preflight/CORS requests from any origin (the site is public and
# has no auth cookies). This fixes "Method Not Allowed" from OPTIONS preflight.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------


@app.post("/api/rooms")
async def create_room(body: CreateRoomIn) -> CreateRoomOut:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    player_id = body.player_id.strip() if body.player_id else _generate_player_id()
    code = _generate_code()
    now = _now()
    host = Player(id=player_id, name=name, is_online=False)
    room = Room(
        code=code,
        host_id=player_id,
        players={player_id: host},
        language=body.language,
        created_at=now,
        updated_at=now,
    )
    rooms[code] = room
    room_locks[code] = asyncio.Lock()
    await _save_room(room)
    return CreateRoomOut(room_code=code, player_id=player_id, language=body.language)


class RoomInfoOut(BaseModel):
    exists: bool
    language: str
    room: dict


@app.get("/api/rooms/{room_code}")
async def get_room(room_code: str) -> RoomInfoOut:
    room_code = room_code.upper().strip()
    room = rooms.get(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"exists": True, "language": room.language, "room": _public_room_state(room)}


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


@app.websocket("/ws/{room_code}")
async def websocket_endpoint(ws: WebSocket, room_code: str):
    room_code = room_code.upper().strip()
    player_id = ws.query_params.get("player_id", "").strip()
    name = ws.query_params.get("name", "").strip()
    language = ws.query_params.get("language", "").strip() or room.language

    room = rooms.get(room_code)
    if not room:
        await ws.accept()
        await _send(ws, {"type": "error", "message": "Room not found"})
        await ws.close()
        return

    if not player_id:
        player_id = _generate_player_id()

    lock = _get_or_create_lock(room_code)
    async with lock:
        existing = room.players.get(player_id)
        if existing:
            # Reconnecting; allow name update.
            existing.name = name or existing.name
            existing.ws = ws
            existing.is_online = True
        else:
            if language != room.language:
                await ws.accept()
                await _send(ws, {"type": "error", "message": "Language mismatch"})
                await ws.close()
                return
            if room.status != "waiting":
                await ws.accept()
                await _send(ws, {"type": "error", "message": "Game already started; only existing players can reconnect"})
                await ws.close()
                return
            if not name:
                await ws.accept()
                await _send(ws, {"type": "error", "message": "Name is required"})
                await ws.close()
                return
            # Check duplicate name (case-insensitive)
            lower_name = name.lower()
            if any(p.name.lower() == lower_name for p in room.players.values()):
                await ws.accept()
                await _send(ws, {"type": "error", "message": "That name is already taken in this room"})
                await ws.close()
                return
            player = Player(id=player_id, name=name, ws=ws, is_online=True)
            room.players[player_id] = player
            # If room has no host (original host left and was never transferred), make newcomer host.
            if room.host_id not in room.players:
                room.host_id = player_id
        room.updated_at = _now()
        await _save_room(room)

    await ws.accept()
    await _broadcast_state(room)
    # If game is already in progress, send the reconnected player their role privately.
    player = room.players[player_id]
    if room.status == "playing" and player.role:
        await _send_private_role(player)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await _send(ws, {"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = data.get("type")
            async with lock:
                player = room.players.get(player_id)
                if player is None:
                    break

                if msg_type == "ready":
                    if room.status != "waiting":
                        await _send(ws, {"type": "error", "message": "Cannot toggle ready while game is in progress"})
                        continue
                    player.is_ready = bool(data.get("is_ready", not player.is_ready))
                    room.updated_at = _now()
                    await _save_room(room)
                    await _broadcast_state(room)

                elif msg_type == "start":
                    if player.id != room.host_id:
                        await _send(ws, {"type": "error", "message": "Only the host can start the game"})
                        continue
                    if room.status != "waiting":
                        await _send(ws, {"type": "error", "message": "Game already started"})
                        continue
                    if len(room.players) < 3:
                        await _send(ws, {"type": "error", "message": "Need at least 3 players to start"})
                        continue
                    if not all(p.is_ready for p in room.players.values()):
                        await _send(ws, {"type": "error", "message": "All players must be ready"})
                        continue

                    _assign_roles(room)
                    room.status = "playing"
                    room.updated_at = _now()
                    await _save_room(room)
                    await _broadcast(room, {"type": "game_started"})
                    await _broadcast_state(room)
                    for p in room.players.values():
                        await _send_private_role(p)

                elif msg_type == "new_round":
                    if player.id != room.host_id:
                        await _send(ws, {"type": "error", "message": "Only the host can start a new round"})
                        continue
                    _reset_room_for_new_round(room)
                    _assign_roles(room)
                    room.status = "playing"
                    room.updated_at = _now()
                    await _save_room(room)
                    await _broadcast(room, {"type": "new_round"})
                    await _broadcast_state(room)
                    for p in room.players.values():
                        await _send_private_role(p)

                elif msg_type == "leave":
                    break

                else:
                    await _send(ws, {"type": "error", "message": f"Unknown message type: {msg_type}"})

    except WebSocketDisconnect:
        pass
    finally:
        async with lock:
            player = room.players.get(player_id)
            if player:
                player.ws = None
                player.is_online = False
                room.updated_at = _now()
                del room.players[player_id]

                # If the host leaves, end the room for everyone.
                if room.host_id == player_id:
                    room.status = "finished"
                    await _save_room(room)
                    await _broadcast(room, {"type": "room_ended", "reason": "host_left"})
                    await _delete_room(room.code)
                elif len(room.players) == 0:
                    await _delete_room(room.code)
                else:
                    await _save_room(room)
                    await _broadcast_state(room)


@app.get("/api/health")
async def health():
    return {"ok": True, "rooms": len(rooms), "words": len(WORD_PAIRS)}
