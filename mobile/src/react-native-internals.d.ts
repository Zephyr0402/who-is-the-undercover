/**
 * react-native ships no type declarations for this deep import (its exports
 * map sets `types: null` for `./Libraries/*`).
 */
declare module "react-native/Libraries/Core/Devtools/getDevServer" {
  export default function getDevServer(): {
    url: string;
    fullBundleUrl: string | null;
    bundleLoadedFromServer: boolean;
  };
}
