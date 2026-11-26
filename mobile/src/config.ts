import Constants from "expo-constants";
import { Platform } from "react-native";
// Deep import: react-native has no public API for the dev server URL, and
// NativeModules.SourceCode is unavailable under the New Architecture.
import getDevServer from "react-native/Libraries/Core/Devtools/getDevServer";

// Expo inlines EXPO_PUBLIC_* variables at build time; declare the minimal
// shape so TypeScript does not require @types/node.
declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

/** Backend used by release builds of the native app. */
const PRODUCTION_BASE_URL = "https://www.bvshen.com/who-is-the-undercover";
const DEV_BACKEND_PORT = 8000;

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function webBaseUrl(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return "";
  }
  if (__DEV__) {
    // `expo start --web` serves the app on the Metro port while FastAPI runs
    // on 8000, so point API calls at the backend on the same host.
    return `http://${window.location.hostname}:${DEV_BACKEND_PORT}`;
  }
  // The exported site is mounted at /who-is-the-undercover/. Caddy strips that
  // prefix before proxying to FastAPI, so the browser has to add it back.
  const path = window.location.pathname.replace(/\/index\.html$/, "");
  return stripTrailingSlash(path);
}

/** Host of the Metro server, e.g. "192.168.1.88". */
function packagerHost(): string | null {
  if (!__DEV__) {
    return null;
  }
  const match = /^https?:\/\/([^/:?#]+)/.exec(getDevServer().url);
  return match?.[1] ?? null;
}

function nativeBaseUrl(): string {
  if (__DEV__) {
    // Derive the dev machine's LAN address from the Expo dev server so the app
    // also works on a physical iPhone. Expo Go exposes hostUri; bare dev builds
    // created by `expo run:ios` only expose the JS bundle URL.
    const hostUri = Constants.expoConfig?.hostUri;
    const host = hostUri ? hostUri.split(":")[0] : packagerHost();
    if (host) {
      return `http://${host}:${DEV_BACKEND_PORT}`;
    }
    return `http://localhost:${DEV_BACKEND_PORT}`;
  }
  return PRODUCTION_BASE_URL;
}

export const API_BASE_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Platform.OS === "web" ? webBaseUrl() : nativeBaseUrl())
);

function normalize(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** Absolute (native) or origin-relative (web) HTTP URL. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${normalize(path)}`;
}

/** WebSocket URL for a given API path. */
export function wsUrl(path: string): string {
  const absolute = apiUrl(path);
  if (absolute.startsWith("https://")) {
    return `wss://${absolute.slice("https://".length)}`;
  }
  if (absolute.startsWith("http://")) {
    return `ws://${absolute.slice("http://".length)}`;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${absolute}`;
  }
  return absolute;
}
