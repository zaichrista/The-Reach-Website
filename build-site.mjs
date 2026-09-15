import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const assets = [
  'index.html', 'about.html', 'menu.html', 'styles.css', 'site.js',
  'Reach trial 1 transparent.png', 'The Reach Promo live.mp4',
  'legal/privacy.html', 'legal/cookies.html',
  'public/cookie-consent.js', 'public/cookie-consent.css',
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/client', { recursive: true });
mkdirSync('dist/server', { recursive: true });
for (const asset of assets) {
  const target = join('dist/client', asset);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(asset, target);
}
copyFileSync('deployment-headers.txt', 'dist/client/_headers');
writeFileSync('dist/server/index.js', `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(new URL('/index.html', url), 302);
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};\n`);
writeFileSync('dist/server/wrangler.json', JSON.stringify({
  name: 'the-reach-website',
  main: 'index.js',
  compatibility_date: '2026-05-15',
  no_bundle: true,
  assets: { directory: '../client' },
}, null, 2) + '\n');
console.log(`Built ${assets.length} static assets for hosting.`);
