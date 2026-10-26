/// <reference types="vite/client" />
declare module 'virtual:sprite-list' {
  const files: string[];
  export default files;
}

/** Версия сборки из package.json (vite.config.ts). */
declare const __BUILD_VERSION__: string;
