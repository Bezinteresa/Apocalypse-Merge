import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import playgamaBridge from '@playgama/bridge/vite';

// virtual:sprite-list — every image in public/sprites, so the game knows which placeholders have real art.
// Dropping a file with the right name (see art/generation-prompts.json) replaces the placeholder; dev server reloads.
function spriteListPlugin(): Plugin {
  const root = fileURLToPath(new URL('./public/sprites', import.meta.url));
  const id = 'virtual:sprite-list';
  const resolved = '\0' + id;
  const scan = (dir: string, base = ''): string[] =>
    !fs.existsSync(dir)
      ? []
      : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory() ? scan(path.join(dir, e.name), base + e.name + '/') : /\.(png|webp)$/i.test(e.name) ? [base + e.name] : [],
        );
  return {
    name: 'sprite-list',
    resolveId: (s) => (s === id ? resolved : undefined),
    load: (s) => (s === resolved ? `export default ${JSON.stringify(scan(root))}` : undefined),
    configureServer(server) {
      server.watcher.add(root);
      const changed = (file: string) => {
        if (!path.resolve(file).startsWith(root)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', changed);
      server.watcher.on('unlink', changed);
    },
  };
}

// base './' — архив открывается из подкаталога площадки.
// mode 'local' — Bridge кладётся в сборку как playgama-bridge.js, без загрузки с CDN (CSP Яндекса).
// версия сборки из package.json — в телеметрию (session_start, performance_sample), чтобы сравнивать выпуски
const BUILD_VERSION = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

export default defineConfig({
  base: './',
  define: { __BUILD_VERSION__: JSON.stringify(BUILD_VERSION) },
  plugins: [playgamaBridge({ mode: 'local' }), spriteListPlugin()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    target: 'es2020',
  },
});
