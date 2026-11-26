// Deep import: react-native has no public API for the dev server URL, and
// NativeModules.SourceCode is unavailable under the New Architecture.
import getDevServer from "react-native/Libraries/Core/Devtools/getDevServer";

/** Host of the Metro server, e.g. "192.168.1.88". */
export function packagerHost(): string | null {
  if (!__DEV__) {
    return null;
  }
  const match = /^https?:\/\/([^/:?#]+)/.exec(getDevServer().url);
  return match?.[1] ?? null;
}
