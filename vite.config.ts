import { defineConfig } from 'vite';
import playgamaBridge from '@playgama/bridge/vite';

// base './' — архив открывается из подкаталога площадки.
// mode 'local' — Bridge кладётся в сборку как playgama-bridge.js, без загрузки с CDN (CSP Яндекса).
export default defineConfig({
  base: './',
  plugins: [playgamaBridge({ mode: 'local' })],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    target: 'es2020',
  },
});
