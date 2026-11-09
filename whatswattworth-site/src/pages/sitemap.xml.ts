import { loadAreas } from '../data';
export function GET() {
  const base = 'https://whatswattworth.com';
  const urls = ['/', '/solar', '/about', '/methodology', '/privacy', '/disclosure',
    ...loadAreas().filter(a => a.kwh !== null).map(a => `/solar/${a.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
