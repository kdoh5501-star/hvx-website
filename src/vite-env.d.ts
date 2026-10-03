/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** WalletConnect / Reown Cloud project ID (cloud.reown.com). Leave empty to hide the QR option. */
  readonly VITE_WC_PROJECT_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
