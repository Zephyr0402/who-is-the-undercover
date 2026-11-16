import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiUrl, wsUrl } from "./config";
import { isLang, t } from "./i18n";
import type { Lang, Room, ServerMessage, Session } from "./types";

const LANG_KEY = "wiu:lang";
const SESSION_KEY = "wiu:last-session";
const MAX_RECONNECTS = 20;
const HEARTBEAT_MS = 15_000;
const TOAST_MS = 4_000;

export interface ToastState {
  id: number;
  message: string;
  kind: "error" | "info";
}

function generatePlayerId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function sanitizeCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

async function storageGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Restricted storage (iOS private mode) must not crash the game.
  }
}

async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

async function readSession(): Promise<Session | null> {
  try {
    const raw = await storageGet(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Session).roomCode === "string" &&
      typeof (parsed as Session).playerId === "string" &&
      typeof (parsed as Session).name === "string"
    ) {
      return parsed as Session;
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string; message?: string };
    return data.detail || data.message || "";
  } catch {
    return "";
  }
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

export interface UndercoverGame {
  lang: Lang;
  changeLang: (lang: Lang) => void;
  room: Room | null;
  myWord: string | null;
  playerId: string | null;
  toast: ToastState | null;
  notify: (message: string, kind?: "error" | "info") => void;
  dismissToast: () => void;
  createRoom: (name: string) => Promise<boolean>;
  joinRoom: (code: string, name: string) => Promise<boolean>;
  setReady: (isReady: boolean) => void;
  startGame: () => void;
  newRound: () => void;
  voteOut: (playerId: string) => void;
  leaveRoom: () => void;
}

export function useUndercover(): UndercoverGame {
  const [lang, setLang] = useState<Lang>("en");
  const langRef = useRef<Lang>("en");

  const [room, setRoom] = useState<Room | null>(null);
  const [myWord, setMyWord] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);

  const wsRef = useRef<WebSocket | null>(null);
  const identityRef = useRef<Session | null>(null);
  // Errors received before the first room_state are fatal handshake errors
  // (room gone, duplicate name, already started) rather than gameplay errors.
  const sawRoomStateRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPlayer = useCallback((id: string | null) => {
    playerIdRef.current = id;
    setPlayerId(id);
  }, []);

  const notify = useCallback(
    (message: string, kind: "error" | "info" = "error") => {
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, message, kind });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const changeLang = useCallback((next: Lang) => {
    langRef.current = next;
    setLang(next);
    void storageSet(LANG_KEY, next);
  }, []);

  const closeSocket = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    // Null the ref before closing so the old socket's onclose is ignored.
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        // ignore
      }
    }
  }, []);

  const resetToLanding = useCallback(() => {
    closeSocket();
    identityRef.current = null;
    setPlayer(null);
    setRoom(null);
    setMyWord(null);
    void storageRemove(SESSION_KEY);
  }, [closeSocket, setPlayer]);

  const handleMessage = useCallback(
    (data: ServerMessage) => {
      switch (data.type) {
        case "room_state": {
          sawRoomStateRef.current = true;
          setRoom(data.room);
          if (data.your_word) {
            setMyWord(data.your_word);
          }
          if (data.room.language && data.room.language !== langRef.current) {
            langRef.current = data.room.language;
            setLang(data.room.language);
            void storageSet(LANG_KEY, data.room.language);
          }
          break;
        }
        case "your_word":
          setMyWord(data.word);
          break;
        case "player_revealed": {
          const isUndercover =
            data.is_undercover || data.role === "undercover";
          if (isUndercover) {
            notify(
              t(langRef.current, "toastRevealedUndercover", {
                name: data.name,
                word: data.word || "?",
              }),
              "info"
            );
          } else {
            notify(
              t(langRef.current, "toastRevealedCivilian", { name: data.name }),
              "info"
            );
          }
          break;
        }
        case "game_started":
        case "new_round":
          notify(t(langRef.current, "toastGameStarted"), "info");
          break;
        case "room_ended": {
          notify(
            t(
              langRef.current,
              data.reason === "host_left" ? "toastHostLeft" : "toastRoomEnded"
            )
          );
          resetToLanding();
          break;
        }
        case "error": {
          notify(data.message);
          const lower = data.message.toLowerCase();
          const roomGone =
            lower.includes("room not found") ||
            data.message.includes("房间不存在");
          if (roomGone || !sawRoomStateRef.current) {
            resetToLanding();
          }
          break;
        }
        default:
          break;
      }
    },
    [notify, resetToLanding]
  );

  const connectWS = useCallback(
    function connect(
      roomCode: string,
      id: string,
      name: string,
      isReconnect = false
    ) {
      closeSocket();
      const session: Session = { roomCode, playerId: id, name };
      identityRef.current = session;
      sawRoomStateRef.current = false;
      setPlayer(id);
      if (!isReconnect) {
        reconnectAttemptsRef.current = 0;
      }

      const url = wsUrl(
        `/ws/${roomCode}?player_id=${encodeURIComponent(
          id
        )}&name=${encodeURIComponent(name)}&language=${encodeURIComponent(
          langRef.current
        )}`
      );
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        void storageSet(SESSION_KEY, JSON.stringify(session));
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) return;
        let data: ServerMessage;
        try {
          data = JSON.parse(String(event.data)) as ServerMessage;
        } catch {
          return;
        }
        handleMessage(data);
      };

      // onclose always follows onerror; reconnection is handled there.
      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        wsRef.current = null;
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        const current = identityRef.current;
        if (!current) return;

        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current > MAX_RECONNECTS) {
          notify(t(langRef.current, "toastRoomNotFound"));
          resetToLanding();
          return;
        }

        notify(t(langRef.current, "toastReconnecting"));
        const delay = Math.min(1000 + reconnectAttemptsRef.current * 500, 5000);
        reconnectTimerRef.current = setTimeout(() => {
          const latest = identityRef.current;
          if (latest) {
            connect(latest.roomCode, latest.playerId, latest.name, true);
          }
        }, delay);
      };

      heartbeatRef.current = setInterval(() => {
        if (wsRef.current === ws && ws.readyState === 1) {
          try {
            ws.send(JSON.stringify({ type: "ping" }));
          } catch {
            // The close handler will recover.
          }
        }
      }, HEARTBEAT_MS);
    },
    [closeSocket, handleMessage, notify, resetToLanding, setPlayer]
  );

  const createRoom = useCallback(
    async (rawName: string): Promise<boolean> => {
      const name = rawName.trim();
      if (!name) {
        notify(t(langRef.current, "errorNameRequired"));
        return false;
      }

      const id = generatePlayerId();
      try {
        const res = await fetch(apiUrl("/api/rooms"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            language: langRef.current,
            player_id: id,
          }),
        });
        if (!res.ok) {
          const detail = await readErrorDetail(res);
          throw new Error(detail || `Error ${res.status}`);
        }
        const data = (await res.json()) as {
          room_code: string;
          player_id?: string;
        };
        const session: Session = {
          roomCode: data.room_code,
          playerId: data.player_id || id,
          name,
        };
        await storageSet(SESSION_KEY, JSON.stringify(session));
        connectWS(session.roomCode, session.playerId, session.name);
        return true;
      } catch (err) {
        notify(errorMessage(err, t(langRef.current, "errorGeneric")));
        return false;
      }
    },
    [connectWS, notify]
  );

  const joinRoom = useCallback(
    async (rawCode: string, rawName: string): Promise<boolean> => {
      const code = sanitizeCode(rawCode);
      const name = rawName.trim();
      if (!code) {
        notify(t(langRef.current, "toastRoomNotFound"));
        return false;
      }
      if (!name) {
        notify(t(langRef.current, "errorNameRequired"));
        return false;
      }

      const id = generatePlayerId();
      try {
        const res = await fetch(apiUrl(`/api/rooms/${code}`));
        if (!res.ok) {
          const detail = await readErrorDetail(res);
          throw new Error(
            detail ||
              `${t(langRef.current, "toastRoomNotFound")} (${code})`
          );
        }
        const info = (await res.json()) as { language?: string };
        if (info.language && isLang(info.language) && info.language !== langRef.current) {
          throw new Error(
            t(langRef.current, "errorWrongLanguage", {
              lang: info.language === "zh" ? "中文" : "English",
            })
          );
        }

        const session: Session = { roomCode: code, playerId: id, name };
        await storageSet(SESSION_KEY, JSON.stringify(session));
        connectWS(code, id, name);
        return true;
      } catch (err) {
        notify(errorMessage(err, t(langRef.current, "errorGeneric")));
        return false;
      }
    },
    [connectWS, notify]
  );

  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({ type, ...payload }));
        } catch {
          // ignore; the reconnect path will take over
        }
      }
    },
    []
  );

  const setReady = useCallback(
    (isReady: boolean) => send("ready", { is_ready: isReady }),
    [send]
  );
  const startGame = useCallback(() => send("start"), [send]);
  const newRound = useCallback(() => send("new_round"), [send]);
  const voteOut = useCallback(
    (targetId: string) => send("vote_out", { player_id: targetId }),
    [send]
  );

  // Restore language and room membership on launch/refresh.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const storedLang = await storageGet(LANG_KEY);
      if (!cancelled && isLang(storedLang)) {
        langRef.current = storedLang;
        setLang(storedLang);
      }

      const session = await readSession();
      if (!session || cancelled) return;

      try {
        const res = await fetch(apiUrl(`/api/rooms/${session.roomCode}`));
        if (!res.ok) {
          if (!cancelled) await storageRemove(SESSION_KEY);
          return;
        }
        const info = (await res.json()) as { language?: string };
        if (cancelled) return;
        if (isLang(info.language) && info.language !== langRef.current) {
          langRef.current = info.language;
          setLang(info.language);
          void storageSet(LANG_KEY, info.language);
        }
        connectWS(session.roomCode, session.playerId, session.name);
      } catch {
        if (!cancelled) await storageRemove(SESSION_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectWS]);

  // Close the socket when the app unmounts.
  useEffect(() => closeSocket, [closeSocket]);

  // Auto-hide toasts.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const leaveRoom = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type: "leave" }));
      } catch {
        // ignore
      }
    }
    resetToLanding();
  }, [resetToLanding]);

  return {
    lang,
    changeLang,
    room,
    myWord,
    playerId,
    toast,
    notify,
    dismissToast,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    newRound,
    voteOut,
    leaveRoom,
  };
}
