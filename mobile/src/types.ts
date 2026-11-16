export type Lang = "en" | "zh";

export type Role = "civilian" | "undercover";

export interface Player {
  id: string;
  name: string;
  is_ready: boolean;
  is_online: boolean;
  is_host: boolean;
  is_voted_out: boolean;
  /** Only present after a player has been voted out. */
  role?: Role;
  /** Only present for a voted-out undercover (or for yourself via `your_word`). */
  word?: string;
}

export interface Room {
  code: string;
  status: "waiting" | "playing" | "finished";
  host_id: string;
  language: Lang;
  players: Player[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  roomCode: string;
  playerId: string;
  name: string;
}

export type ServerMessage =
  | { type: "room_state"; room: Room; your_word?: string }
  | { type: "your_word"; word: string }
  | {
      type: "player_revealed";
      player_id: string;
      name: string;
      role: Role;
      is_undercover: boolean;
      word?: string;
    }
  | { type: "game_started" }
  | { type: "new_round" }
  | { type: "room_ended"; reason?: "host_left" | string }
  | { type: "pong" }
  | { type: "error"; message: string };
