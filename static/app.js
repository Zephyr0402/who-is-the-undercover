(() => {
  const STORAGE_KEY = "wiu:last-session";

  const state = {
    ws: null,
    roomCode: null,
    playerId: null,
    name: null,
    room: null,
    myRole: null,
    myWord: null,
    isHost: false,
  };

  // DOM refs
  const els = {
    toast: document.getElementById("toast"),
    landing: document.getElementById("landing"),
    lobby: document.getElementById("lobby"),
    game: document.getElementById("game"),
    tabCreate: document.getElementById("tab-create"),
    tabJoin: document.getElementById("tab-join"),
    createForm: document.getElementById("create-form"),
    joinForm: document.getElementById("join-form"),
    createName: document.getElementById("create-name"),
    joinCode: document.getElementById("join-code"),
    joinName: document.getElementById("join-name"),
    roomCode: document.getElementById("room-code"),
    copyCode: document.getElementById("copy-code"),
    playerList: document.getElementById("player-list"),
    gamePlayerList: document.getElementById("game-player-list"),
    readyBtn: document.getElementById("ready-btn"),
    startBtn: document.getElementById("start-btn"),
    waitingMsg: document.getElementById("waiting-msg"),
    startHint: document.getElementById("start-hint"),
    roleLabel: document.getElementById("role-label"),
    roleWord: document.getElementById("role-word"),
    roleHint: document.getElementById("role-hint"),
    newRoundBtn: document.getElementById("new-round-btn"),
    leaveBtn: document.getElementById("leave-btn"),
  };

  function generateId() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 16; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  function saveSession() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        roomCode: state.roomCode,
        playerId: state.playerId,
        name: state.name,
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function showToast(message, type = "error") {
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 4000);
  }

  function apiUrl(path) {
    return `${location.origin}${path}`;
  }

  function wsUrl(path) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}${path}`;
  }

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || `Error ${res.status}`);
    }
    return res.json();
  }

  function setScreen(name) {
    els.landing.classList.toggle("hidden", name !== "landing");
    els.lobby.classList.toggle("hidden", name !== "lobby");
    els.game.classList.toggle("hidden", name !== "game");
  }

  function switchTab(tab) {
    if (tab === "create") {
      els.tabCreate.classList.add("active");
      els.tabJoin.classList.remove("active");
      els.createForm.classList.remove("hidden");
      els.joinForm.classList.add("hidden");
    } else {
      els.tabJoin.classList.add("active");
      els.tabCreate.classList.remove("active");
      els.joinForm.classList.remove("hidden");
      els.createForm.classList.add("hidden");
    }
  }

  function renderLobby() {
    if (!state.room) return;
    els.roomCode.textContent = state.room.code;

    const me = state.room.players.find((p) => p.id === state.playerId);
    if (!me) return;

    state.isHost = state.playerId === state.room.host_id;
    const allReady = state.room.players.every((p) => p.is_ready);
    const enoughPlayers = state.room.players.length >= 3;
    const canStart = state.isHost && state.room.status === "waiting" && allReady && enoughPlayers;

    els.readyBtn.textContent = me.is_ready ? "Not ready" : "I’m ready";
    els.readyBtn.disabled = state.room.status !== "waiting";

    if (state.isHost) {
      els.startBtn.classList.remove("hidden");
      els.startBtn.disabled = !canStart;
      els.waitingMsg.classList.add("hidden");
      els.startHint.classList.toggle("hidden", canStart);
    } else {
      els.startBtn.classList.add("hidden");
      els.startHint.classList.add("hidden");
      els.waitingMsg.classList.remove("hidden");
    }

    els.playerList.innerHTML = state.room.players
      .map((p) => {
        const badges = [];
        if (p.is_host) badges.push('<span class="badge host">Host</span>');
        if (p.is_ready) badges.push('<span class="badge ready">Ready</span>');
        if (!p.is_online) badges.push('<span class="badge offline">Offline</span>');
        return `
          <li>
            <span class="player-name">${escapeHtml(p.name)} ${p.id === state.playerId ? "(you)" : ""}</span>
            <span class="player-meta">${badges.join("")}</span>
          </li>
        `;
      })
      .join("");
  }

  function renderGame() {
    if (!state.room) return;
    const me = state.room.players.find((p) => p.id === state.playerId);

    els.roleWord.textContent = state.myWord || "?";
    if (state.myRole === "undercover") {
      els.roleLabel.textContent = "Undercover";
      els.roleHint.textContent = "You are the undercover! Blend in with the civilians.";
      document.querySelector(".role-card").style.borderColor = "var(--accent)";
    } else if (state.myRole === "civilian") {
      els.roleLabel.textContent = "Civilian";
      els.roleHint.textContent = "You are a civilian. Figure out who the undercover is.";
      document.querySelector(".role-card").style.borderColor = "var(--success)";
    } else {
      els.roleLabel.textContent = "Waiting…";
      els.roleHint.textContent = "The host will start the next round.";
    }

    state.isHost = state.playerId === state.room.host_id;
    els.newRoundBtn.classList.toggle("hidden", !state.isHost);

    els.gamePlayerList.innerHTML = state.room.players
      .map((p) => {
        const badges = [];
        if (p.is_host) badges.push('<span class="badge host">Host</span>');
        if (!p.is_online) badges.push('<span class="badge offline">Offline</span>');
        return `
          <li>
            <span class="player-name">${escapeHtml(p.name)} ${p.id === state.playerId ? "(you)" : ""}</span>
            <span class="player-meta">${badges.join("")}</span>
          </li>
        `;
      })
      .join("");
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function handleMessage(data) {
    if (data.type === "room_state") {
      state.room = data.room;
      state.isHost = state.playerId === state.room.host_id;
      if (state.room.status === "waiting") {
        setScreen("lobby");
        renderLobby();
      } else {
        setScreen("game");
        renderGame();
      }
    } else if (data.type === "your_role") {
      state.myRole = data.role;
      state.myWord = data.word;
      setScreen("game");
      renderGame();
    } else if (data.type === "game_started" || data.type === "new_round") {
      showToast("Game started! Check your card.", "info");
    } else if (data.type === "error") {
      showToast(data.message);
    }
  }

  function connectWS(code, playerId, name) {
    if (state.ws) {
      state.ws.close();
    }

    const url = wsUrl(`/ws/${code}?player_id=${encodeURIComponent(playerId)}&name=${encodeURIComponent(name)}`);
    state.ws = new WebSocket(url);

    state.ws.onopen = () => {
      saveSession();
    };

    state.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (err) {
        console.error("Bad message", event.data, err);
      }
    };

    state.ws.onclose = () => {
      state.ws = null;
    };

    state.ws.onerror = () => {
      showToast("Connection lost. Trying to reconnect…");
      setTimeout(() => {
        if (state.roomCode) connectWS(state.roomCode, state.playerId, state.name);
      }, 1500);
    };
  }

  async function createRoom(name) {
    state.playerId = generateId();
    state.name = name.trim();
    try {
      const data = await postJson(apiUrl("/api/rooms"), {
        name: state.name,
        player_id: state.playerId,
      });
      state.roomCode = data.room_code;
      saveSession();
      connectWS(state.roomCode, state.playerId, state.name);
      setScreen("lobby");
    } catch (err) {
      showToast(err.message);
    }
  }

  async function joinRoom(code, name) {
    state.playerId = generateId();
    state.name = name.trim();
    state.roomCode = code.toUpperCase().trim();

    try {
      const check = await fetch(apiUrl(`/api/rooms/${state.roomCode}`));
      if (!check.ok) {
        const data = await check.json().catch(() => ({}));
        throw new Error(data.detail || "Room not found");
      }
      connectWS(state.roomCode, state.playerId, state.name);
      setScreen("lobby");
    } catch (err) {
      showToast(err.message);
    }
  }

  function send(type, payload = {}) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  function toggleReady() {
    const me = state.room?.players.find((p) => p.id === state.playerId);
    if (!me) return;
    send("ready", { is_ready: !me.is_ready });
  }

  function startGame() {
    send("start");
  }

  function newRound() {
    send("new_round");
  }

  function leaveRoom() {
    if (state.ws) {
      send("leave");
      state.ws.close();
    }
    clearSession();
    state.room = null;
    state.roomCode = null;
    state.myRole = null;
    state.myWord = null;
    setScreen("landing");
    switchTab("create");
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      showToast("Copied!", "info");
    } catch {
      showToast("Could not copy automatically");
    }
  }

  function init() {
    els.tabCreate.addEventListener("click", () => switchTab("create"));
    els.tabJoin.addEventListener("click", () => switchTab("join"));

    els.createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createRoom(els.createName.value);
    });

    els.joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      joinRoom(els.joinCode.value, els.joinName.value);
    });

    els.readyBtn.addEventListener("click", toggleReady);
    els.startBtn.addEventListener("click", startGame);
    els.newRoundBtn.addEventListener("click", newRound);
    els.leaveBtn.addEventListener("click", leaveRoom);
    els.copyCode.addEventListener("click", copyCode);

    const session = loadSession();
    if (session && session.roomCode && session.playerId && session.name) {
      state.roomCode = session.roomCode;
      state.playerId = session.playerId;
      state.name = session.name;
      connectWS(session.roomCode, session.playerId, session.name);
      setScreen("lobby");
    }
  }

  init();
})();
