(() => {
  const LANG_KEY = "wiu:lang";
  const STORAGE_KEY = "wiu:last-session";

  const i18n = {
    en: {
      appTitle: "Who Is The Undercover",
      appSubtitle: "Create a room, share the code, find the spy.",
      tabCreate: "Create room",
      tabJoin: "Join room",
      langEn: "English",
      langZh: "中文",
      langName: "English",
      labelName: "Your nickname",
      labelCode: "Room code",
      btnCreate: "Create room",
      btnJoin: "Join room",
      titleRoomCode: "Room code",
      btnCopy: "Copy",
      hintShareCode: "Share this code with your friends so they can join.",
      titlePlayers: "Players",
      btnReadyOn: "I’m ready",
      btnReadyOff: "Not ready",
      btnStart: "Start game",
      hintWaiting: "Waiting for the host to start…",
      hintStart: "All players must be ready and at least 3 players are needed.",
      labelYourWord: "Your word",
      roleCivilian: "Civilian",
      roleUndercover: "Undercover",
      hintCivilian: "You are a civilian. Figure out who the undercover is.",
      hintUndercover: "You are the undercover! Blend in with the civilians.",
      hintWaitingRole: "The host will start the next round.",
      titlePlayersAtTable: "Players at the table",
      btnNewRound: "New round",
      btnLeave: "Leave room",
      badgeHost: "Host",
      badgeReady: "Ready",
      badgeOffline: "Offline",
      you: "you",
      toastCopied: "Copied!",
      toastCopyFailed: "Could not copy automatically",
      toastReconnecting: "Connection lost. Trying to reconnect…",
      toastGameStarted: "Game started! Check your card.",
      toastRoomNotFound: "Room not found",
      toastHostLeft: "Host left. The room has ended.",
      toastRoomEnded: "The room has ended.",
      toastRevealedCivilian: "{name} was a Civilian! Word: {word}",
      toastRevealedUndercover: "{name} was the Undercover! Word: {word}",
      badgeVotedOut: "Out",
      badgeRevealedUndercover: "Undercover",
      badgeRevealedCivilian: "Civilian",
      btnVoteOut: "Vote out",
      errorWrongLanguage: 'This room uses {lang}. Please switch the language to {lang} in the top-right corner before joining.',
      errorNameTaken: "That name is already taken in this room",
      errorGameStarted: "Game already started; only existing players can reconnect",
    },
    zh: {
      appTitle: "谁是卧底",
      appSubtitle: "创建房间，分享房间号，找出卧底。",
      tabCreate: "创建房间",
      tabJoin: "加入房间",
      langEn: "English",
      langZh: "中文",
      langName: "中文",
      labelName: "你的昵称",
      labelCode: "房间号",
      btnCreate: "创建房间",
      btnJoin: "加入房间",
      titleRoomCode: "房间号",
      btnCopy: "复制",
      hintShareCode: "把房间号分享给朋友，让他们加入。",
      titlePlayers: "玩家",
      btnReadyOn: "我准备好了",
      btnReadyOff: "取消准备",
      btnStart: "开始游戏",
      hintWaiting: "等待房主开始游戏…",
      hintStart: "所有玩家都必须准备，且至少需要 3 名玩家。",
      labelYourWord: "你的词",
      roleCivilian: "平民",
      roleUndercover: "卧底",
      hintCivilian: "你是平民。找出谁是卧底。",
      hintUndercover: "你是卧底！假装成平民。",
      hintWaitingRole: "房主将开始下一轮。",
      titlePlayersAtTable: "桌上的玩家",
      btnNewRound: "新一轮",
      btnLeave: "离开房间",
      badgeHost: "房主",
      badgeReady: "已准备",
      badgeOffline: "离线",
      you: "你",
      toastCopied: "已复制！",
      toastCopyFailed: "无法自动复制",
      toastReconnecting: "连接断开，正在重新连接…",
      toastGameStarted: "游戏开始！查看你的词。",
      toastRoomNotFound: "房间不存在",
      toastHostLeft: "房主已离开，房间已结束。",
      toastRoomEnded: "房间已结束。",
      toastRevealedCivilian: "{name} 是平民！词：{word}",
      toastRevealedUndercover: "{name} 是卧底！词：{word}",
      badgeVotedOut: "出局",
      badgeRevealedUndercover: "卧底",
      badgeRevealedCivilian: "平民",
      btnVoteOut: "投票出局",
      errorWrongLanguage: '本房间使用{lang}语言，请先在右上角切换为{lang}再加入。',
      errorNameTaken: "该昵称已被占用",
      errorGameStarted: "游戏已开始，只有原玩家可以重连",
    },
  };

  // Safe localStorage wrapper for browsers with restricted storage (iOS private mode).
  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  const state = {
    ws: null,
    roomCode: null,
    playerId: null,
    name: null,
    room: null,
    myRole: null,
    myWord: null,
    isHost: false,
    lang: storageGet(LANG_KEY) || "en",
  };

  // DOM refs
  const els = {
    toast: document.getElementById("toast"),
    landing: document.getElementById("landing"),
    lobby: document.getElementById("lobby"),
    game: document.getElementById("game"),
    langEn: document.getElementById("lang-en"),
    langZh: document.getElementById("lang-zh"),
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
    lobbyLeaveBtn: document.getElementById("lobby-leave-btn"),
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
    storageSet(
      STORAGE_KEY,
      JSON.stringify({
        roomCode: state.roomCode,
        playerId: state.playerId,
        name: state.name,
      })
    );
  }

  function clearSession() {
    storageRemove(STORAGE_KEY);
  }

  function loadSession() {
    try {
      return JSON.parse(storageGet(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function t(key, fallback = key) {
    return (i18n[state.lang] && i18n[state.lang][key]) || fallback;
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    if (els.langEn) els.langEn.classList.toggle("active", state.lang === "en");
    if (els.langZh) els.langZh.classList.toggle("active", state.lang === "zh");
    document.querySelectorAll("[data-key]").forEach((el) => {
      const key = el.getAttribute("data-key");
      const text = t(key);
      if (el.tagName === "INPUT") {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    // Re-render dynamic screens so button text updates.
    renderLobby();
    renderGame();
  }

  function setLang(lang) {
    if (!i18n[lang]) return;
    state.lang = lang;
    storageSet(LANG_KEY, lang);
    applyLanguage();
  }

  function sanitizeCode(value) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  }

  function showToast(message, type = "error") {
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 4000);
  }

  // When the app is mounted under a path prefix (e.g. /who-is-the-undercover/)
  // all API/WebSocket calls must include that prefix. Locally the page is at /
  // so the prefix is empty. We compute it from the loaded script's URL because
  // that is more reliable across browsers (including iOS WebKit) than the
  // <base> tag or location.pathname.
  const currentScript = document.currentScript ||
    document.querySelector('script[src*="app.js"]');
  let BASE_PATH = "";
  try {
    const scriptUrl = new URL(currentScript?.src || "https://www.bvshen.com/who-is-the-undercover/static/app.js");
    // The script lives at <BASE_PATH>/static/app.js, so strip the last two segments.
    BASE_PATH = scriptUrl.pathname.replace(/\/[^/]+\/[^/]+$/, "");
  } catch {
    BASE_PATH = "/who-is-the-undercover";
  }

  function apiUrl(path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${location.origin}${BASE_PATH}${normalized}`;
  }

  function wsUrl(path) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${protocol}//${location.host}${BASE_PATH}${normalized}`;
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

    els.readyBtn.textContent = me.is_ready ? t("btnReadyOff") : t("btnReadyOn");
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
        if (p.is_host) badges.push(`<span class="badge host">${t("badgeHost")}</span>`);
        if (p.is_ready) badges.push(`<span class="badge ready">${t("badgeReady")}</span>`);
        if (!p.is_online) badges.push(`<span class="badge offline">${t("badgeOffline")}</span>`);
        return `
          <li>
            <span class="player-name">${escapeHtml(p.name)} ${p.id === state.playerId ? `(${t("you")})` : ""}</span>
            <span class="player-meta">${badges.join("")}</span>
          </li>
        `;
      })
      .join("");
  }

  function renderGame() {
    if (!state.room) return;
    const me = state.room.players.find((p) => p.id === state.playerId);

    // Players see only their own word, never their role label.
    els.roleWord.textContent = state.myWord || "?";
    els.roleLabel.textContent = t("labelYourWord");
    els.roleHint.textContent = t("hintWaitingRole");
    document.querySelector(".role-card").style.borderColor = "var(--primary)";

    state.isHost = state.playerId === state.room.host_id;
    const canVote = state.isHost && state.room.status === "playing";
    els.newRoundBtn.classList.toggle("hidden", !state.isHost);

    els.gamePlayerList.innerHTML = state.room.players
      .map((p) => {
        const badges = [];
        if (p.is_host) badges.push(`<span class="badge host">${t("badgeHost")}</span>`);
        if (!p.is_online) badges.push(`<span class="badge offline">${t("badgeOffline")}</span>`);
        if (p.is_voted_out) badges.push(`<span class="badge voted-out">${t("badgeVotedOut")}</span>`);
        if (p.is_voted_out) {
          const roleKey = p.role === "undercover" ? "badgeRevealedUndercover" : "badgeRevealedCivilian";
          badges.push(`<span class="badge revealed">${t(roleKey)}</span>`);
        }
        const voteButton =
          canVote && !p.is_voted_out && p.id !== state.playerId
            ? `<button type="button" class="btn small danger vote-out" data-player-id="${escapeHtml(p.id)}">${t("btnVoteOut")}</button>`
            : "";
        const dimmed = p.is_voted_out ? ' style="opacity:0.55"' : "";
        return `
          <li${dimmed}>
            <span class="player-name">${escapeHtml(p.name)} ${p.id === state.playerId ? `(${t("you")})` : ""}</span>
            <span class="player-meta">${badges.join("")}${voteButton}</span>
          </li>
        `;
      })
      .join("");

    // Bind vote-out buttons (re-created on every render).
    els.gamePlayerList.querySelectorAll(".vote-out").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-player-id");
        if (targetId) send("vote_out", { player_id: targetId });
      });
    });
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
      // Sync UI language with the room language determined by the host.
      if (state.room.language && state.room.language !== state.lang) {
        setLang(state.room.language);
      }
      if (state.room.status === "waiting") {
        setScreen("lobby");
        renderLobby();
      } else {
        setScreen("game");
        renderGame();
      }
    } else if (data.type === "your_word") {
      // Only the word is shown; role identity is hidden until voted out.
      state.myWord = data.word;
      setScreen("game");
      renderGame();
    } else if (data.type === "player_revealed") {
      const isUndercover = data.is_undercover || data.role === "undercover";
      const tmpl = isUndercover ? "toastRevealedUndercover" : "toastRevealedCivilian";
      showToast(t(tmpl).replace(/\{name\}/g, escapeHtml(data.name)).replace(/\{word\}/g, escapeHtml(data.word)));
    } else if (data.type === "game_started" || data.type === "new_round") {
      showToast(t("toastGameStarted"), "info");
    } else if (data.type === "room_ended") {
      const msg = data.reason === "host_left" ? t("toastHostLeft") : t("toastRoomEnded");
      showToast(msg);
      clearSession();
      state.room = null;
      state.roomCode = null;
      state.myRole = null;
      state.myWord = null;
      if (state.ws) {
        state.ws.close();
        state.ws = null;
      }
      setScreen("landing");
      switchTab("create");
    } else if (data.type === "error") {
      showToast(data.message);
      // If the server tells us the room is gone, stop trying and start over.
      if (
        data.message &&
        (data.message.toLowerCase().includes("room not found") ||
          data.message.includes("房间不存在"))
      ) {
        clearSession();
        state.room = null;
        state.roomCode = null;
        state.myRole = null;
        state.myWord = null;
        if (state.ws) {
          state.ws.close();
          state.ws = null;
        }
        setScreen("landing");
        switchTab("create");
      }
    }
  }

  function connectWS(code, playerId, name) {
    if (state.ws) {
      state.ws.close();
    }

    const url = wsUrl(`/ws/${code}?player_id=${encodeURIComponent(playerId)}&name=${encodeURIComponent(name)}&language=${encodeURIComponent(state.lang)}`);
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

    let reconnectAttempts = 0;
    const maxReconnects = 3;

    state.ws.onclose = () => {
      state.ws = null;
    };

    state.ws.onerror = () => {
      reconnectAttempts++;
      if (reconnectAttempts > maxReconnects) {
        showToast(t("toastRoomNotFound"));
        clearSession();
        state.room = null;
        state.roomCode = null;
        state.myRole = null;
        state.myWord = null;
        setScreen("landing");
        switchTab("create");
        return;
      }
      showToast(t("toastReconnecting"));
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
        language: state.lang,
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
    clearSession(); // ensure no stale session interferes
    state.playerId = generateId();
    state.name = name.trim();
    state.roomCode = sanitizeCode(code);

    if (state.roomCode.length === 0) {
      showToast(t("toastRoomNotFound"));
      return;
    }

    const submitBtn = els.joinForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "…";
    }

    try {
      const url = apiUrl(`/api/rooms/${state.roomCode}`);
      const check = await fetch(url);
      if (!check.ok) {
        const data = await check.json().catch(() => ({}));
        throw new Error(data.detail || `${t("toastRoomNotFound")} (${state.roomCode})`);
      }
      const roomInfo = await check.json();
      if (roomInfo.language && roomInfo.language !== state.lang) {
        const langName = i18n[roomInfo.language]?.langName || roomInfo.language;
        throw new Error(t("errorWrongLanguage").replace(/\{lang\}/g, langName));
      }
      saveSession();
      connectWS(state.roomCode, state.playerId, state.name);
      setScreen("lobby");
    } catch (err) {
      showToast(err.message || t("toastRoomNotFound"));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        applyLanguage();
      }
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
      showToast(t("toastCopied"), "info");
    } catch {
      showToast(t("toastCopyFailed"));
    }
  }

  async function init() {
    els.tabCreate.addEventListener("click", () => switchTab("create"));
    els.tabJoin.addEventListener("click", () => switchTab("join"));

    if (els.langEn) els.langEn.addEventListener("click", () => setLang("en"));
    if (els.langZh) els.langZh.addEventListener("click", () => setLang("zh"));

    els.createForm.addEventListener("submit", (e) => {
      e.preventDefault();
      createRoom(els.createName.value);
    });

    els.joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      joinRoom(els.joinCode.value, els.joinName.value);
    });

    els.joinCode.addEventListener("input", (e) => {
      e.target.value = sanitizeCode(e.target.value);
    });

    els.readyBtn.addEventListener("click", toggleReady);
    els.startBtn.addEventListener("click", startGame);
    els.newRoundBtn.addEventListener("click", newRound);
    els.leaveBtn.addEventListener("click", leaveRoom);
    if (els.lobbyLeaveBtn) els.lobbyLeaveBtn.addEventListener("click", leaveRoom);
    els.copyCode.addEventListener("click", copyCode);

    applyLanguage();

    const session = loadSession();
    if (session && session.roomCode && session.playerId && session.name) {
      // Validate that the stored room still exists before auto-reconnecting;
      // otherwise the join form won't work and the user gets stuck.
      try {
        const check = await fetch(apiUrl(`/api/rooms/${session.roomCode}`));
        if (check.ok) {
          const roomInfo = await check.json();
          state.roomCode = session.roomCode;
          state.playerId = session.playerId;
          state.name = session.name;
          if (roomInfo.language && roomInfo.language !== state.lang) {
            setLang(roomInfo.language);
          }
          connectWS(session.roomCode, session.playerId, session.name);
          setScreen("lobby");
        } else {
          clearSession();
          setScreen("landing");
        }
      } catch {
        clearSession();
        setScreen("landing");
      }
    }
  }

  init();
})();
