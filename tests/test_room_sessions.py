"""Integration coverage for room identity, with isolated SQLite state."""

import json
import sqlite3
import tempfile
import unittest
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

from starlette.testclient import TestClient

import server


class RoomSessionTests(unittest.TestCase):
    def setUp(self):
        stack = self.enterContext(ExitStack())
        data_dir = Path(stack.enter_context(tempfile.TemporaryDirectory()))
        stack.enter_context(patch.multiple(
            server, DATA_DIR=data_dir, DB_FILE=data_dir / "rooms.db", rooms={}, room_locks={}
        ))

    def create_room(self, client):
        response = client.post("/api/rooms", json={"name": "Host", "protocol_version": 2})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def read_type(self, ws, kind):
        for _ in range(12):
            message = ws.receive_json()
            if message["type"] == kind:
                return message
        self.fail(f"Did not receive {kind}")

    def authenticate(self, ws, *, player_id, session_token):
        ws.send_json({
            "type": "authenticate", "player_id": player_id, "session_token": session_token
        })

    def test_legacy_rooms_cannot_be_reclaimed_after_database_migration(self):
        with sqlite3.connect(server.DB_FILE) as db:
            db.executescript(server.SCHEMA.replace("    session_token_hash TEXT,\n", ""))
            db.execute(
                "INSERT INTO rooms (code, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
                ("OLD234", "legacy-id", server._now(), server._now()),
            )
            db.execute(
                "INSERT INTO players (id, room_code, name) VALUES (?, ?, ?)",
                ("legacy-id", "OLD234", "Legacy host"),
            )

        with TestClient(server.app) as client:
            self.assertEqual(client.get("/api/rooms/OLD234").status_code, 404)
            with client.websocket_connect("/ws/OLD234?v=2") as socket:
                self.assertEqual(socket.receive_json()["message"], "Room not found")
            self.assertTrue(self.create_room(client)["session_token"])

    def test_public_id_cannot_resume_and_credentials_survive_server_restart(self):
        with TestClient(server.app) as client:
            session = self.create_room(client)
            path = f"/ws/{session['room_code']}"
            room = client.get(f"/api/rooms/{session['room_code']}")
            self.assertEqual(room.json()["room"]["host_id"], session["player_id"])
            self.assertNotIn(session["session_token"], room.text)
            self.assertNotIn("session_token", room.text)
            self.assertEqual(client.post("/api/rooms", json={"name": "Old client"}).status_code, 426)

            with client.websocket_connect(path) as legacy:
                self.assertIn("Update", legacy.receive_json()["message"])

            with client.websocket_connect(path + "?v=2") as host:
                self.authenticate(host, player_id=session["player_id"], session_token=session["session_token"])
                self.assertTrue(self.read_type(host, "room_state")["room"]["players"][0]["is_online"])

                with client.websocket_connect(path + "?v=2") as unauthorized:
                    unauthorized.send_json({"type": "authenticate", "player_id": session["player_id"]})
                    self.assertEqual(unauthorized.receive_json(), {"type": "error", "message": "Invalid session"})

                with client.websocket_connect(path + "?v=2") as guest:
                    guest.send_json({"type": "authenticate", "language": "en", "name": "Guest"})
                    guest_session = self.read_type(guest, "session")
                    state = self.read_type(guest, "room_state")
                    self.assertNotIn(guest_session["session_token"], json.dumps(state))
                    self.assertNotIn(guest_session["session_token"], json.dumps(self.read_type(host, "room_state")))
                    with client.websocket_connect(path + "?v=2") as unauthorized:
                        self.authenticate(
                            unauthorized, player_id=session["player_id"],
                            session_token=guest_session["session_token"],
                        )
                        self.assertEqual(unauthorized.receive_json()["type"], "error")
                    guest.send_json({"type": "start"})
                    self.assertEqual(self.read_type(guest, "error")["message"], "Only the host can start the game")

        server.rooms.clear()
        server.room_locks.clear()
        with TestClient(server.app) as client:
            with client.websocket_connect(path + "?v=2") as original:
                self.authenticate(
                    original, player_id=session["player_id"], session_token=session["session_token"]
                )
                self.read_type(original, "room_state")
                with client.websocket_connect(path + "?v=2") as replacement:
                    self.authenticate(
                        replacement, player_id=session["player_id"], session_token=session["session_token"]
                    )
                    self.assertEqual(original.receive()["code"], 4001)
                    state = self.read_type(replacement, "room_state")
                    self.assertEqual(state["room"]["host_id"], session["player_id"])
                    host = next(p for p in state["room"]["players"] if p["is_host"])
                    self.assertTrue(host["is_online"])
                    replacement.send_json({"type": "ready", "is_ready": True})
                    self.assertTrue(self.read_type(replacement, "room_state")["room"]["players"][0]["is_ready"])


if __name__ == "__main__":
    unittest.main()
