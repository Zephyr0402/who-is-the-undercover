import type { Lang } from "./types";

const en = {
  appTitle: "Who Is The Undercover",
  appSubtitle: "Create a room, share the code, find the spy.",
  privacyPolicy: "Privacy policy",
  errorOpenPrivacyPolicy: "Could not open the privacy policy. Please try again.",
  tabCreate: "Create room",
  tabJoin: "Join room",
  langEn: "EN",
  langZh: "中文",
  labelName: "Your nickname",
  labelCode: "Room code",
  placeholderName: "e.g. Alice",
  placeholderCode: "X7K9PQ",
  placeholderCodeName: "e.g. Bob",
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
  toastRevealedCivilian: "{name} was a Civilian!",
  toastRevealedUndercover: "{name} was the Undercover! Word: {word}",
  badgeVotedOut: "Out",
  badgeRevealedUndercover: "Undercover",
  badgeRevealedCivilian: "Civilian",
  btnVoteOut: "Vote out",
  errorWrongLanguage:
    "This room uses {lang}. Please switch the language to {lang} before joining.",
  errorNameRequired: "Please enter a nickname.",
  errorGeneric: "Something went wrong. Please try again.",
} as const;

type StringKey = keyof typeof en;

const zh: Record<StringKey, string> = {
  appTitle: "谁是卧底",
  appSubtitle: "创建房间，分享房间号，找出卧底。",
  privacyPolicy: "隐私政策",
  errorOpenPrivacyPolicy: "无法打开隐私政策，请重试。",
  tabCreate: "创建房间",
  tabJoin: "加入房间",
  langEn: "EN",
  langZh: "中文",
  labelName: "你的昵称",
  labelCode: "房间号",
  placeholderName: "例如：小红",
  placeholderCode: "X7K9PQ",
  placeholderCodeName: "例如：小明",
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
  toastRevealedCivilian: "{name} 是平民！",
  toastRevealedUndercover: "{name} 是卧底！词语：{word}",
  badgeVotedOut: "出局",
  badgeRevealedUndercover: "卧底",
  badgeRevealedCivilian: "平民",
  btnVoteOut: "投票出局",
  errorWrongLanguage: "本房间使用{lang}语言，请先切换为{lang}再加入。",
  errorNameRequired: "请输入昵称。",
  errorGeneric: "出了点问题，请重试。",
};

const strings: Record<Lang, Record<StringKey, string>> = { en, zh };

export const languageNames: Record<Lang, string> = {
  en: "English",
  zh: "中文",
};

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "zh";
}

export function t(
  lang: Lang,
  key: StringKey,
  vars?: Record<string, string>
): string {
  let value = strings[lang][key] ?? strings.en[key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.split(`{${name}}`).join(replacement);
    }
  }
  return value;
}
