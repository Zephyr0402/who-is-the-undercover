export const colors = {
  bg: "#f2f2f7",
  card: "rgba(255, 255, 255, 0.55)",
  text: "#1c1c1e",
  muted: "#6e6e73",
  faint: "rgba(60, 60, 67, 0.45)",
  primary: "#007aff",
  primaryHover: "#0066d6",
  primarySoft: "rgba(0, 122, 255, 0.12)",
  secondary: "rgba(255, 255, 255, 0.6)",
  secondaryText: "#1c1c1e",
  accent: "#ff9f0a",
  danger: "#ff3b30",
  dangerHover: "#d70015",
  readyBg: "rgba(52, 199, 89, 0.16)",
  readyText: "#1b7f3b",
  hostBg: "rgba(175, 82, 222, 0.14)",
  hostText: "#7d2fa8",
  white: "#ffffff",
} as const;

/** Glass surface tokens for the light liquid-glass material. */
export const glass = {
  tint: "rgba(255, 255, 255, 0.5)",
  tintStrong: "rgba(255, 255, 255, 0.72)",
  tintSoft: "rgba(255, 255, 255, 0.34)",
  border: "rgba(255, 255, 255, 0.7)",
  borderSoft: "rgba(255, 255, 255, 0.45)",
  highlight: "rgba(255, 255, 255, 0.9)",
  hairline: "rgba(60, 60, 67, 0.12)",
  shadow: "#000000",
} as const;

/** Soft sheen used inside glass surfaces. */
export const gradients = {
  glassBody: [
    "rgba(255, 255, 255, 0.5)",
    "rgba(255, 255, 255, 0.06)",
    "rgba(255, 255, 255, 0.16)",
  ] as const,
} as const;

export const radius = 24;
export const radiusSmall = 16;
export const radiusPill = 999;

export const cardShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.08,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const softShadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;
