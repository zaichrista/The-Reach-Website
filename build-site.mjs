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
    const response = env.ASSETS
      ? await env.ASSETS.fetch(request)
      : new Response('Asset binding missing', { status: 500 });
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self'; media-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    if (new URL(request.url).protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};\n`);
writeFileSync('dist/server/wrangler.json', JSON.stringify({
  name: 'the-reach-website',
  main: 'index.js',
  compatibility_date: '2026-05-15',
  no_bundle: true,
  assets: { directory: '../client', binding: 'ASSETS', run_worker_first: true },
}, null, 2) + '\n');
console.log(`Built ${assets.length} static assets for hosting.`);
