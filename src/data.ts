import fs from 'node:fs';
import path from 'node:path';

export interface Area {
  name: string; slug: string; lng: number; lat: number;
  kwh: number | null; solarInstalls: number | null; hpInstalls: number | null; bus: number | null;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.length > 1);
}
const num = (s: string) => (s === undefined || s.trim() === '' || isNaN(Number(s)) ? null : Number(s));

export function loadAreas(): Area[] {
  const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/areas.csv'), 'utf8');
  const [head, ...rest] = parseCSV(raw);
  const ix = (n: string) => head.indexOf(n);
  return rest.map(r => {
    const lng = Number(r[ix('lng')]), lat = Number(r[ix('lat')]);
    // Sanity check: UK longitudes sit between about -9 and +2. Anything else is a data-entry error.
    const coordsOk = lng >= -9 && lng <= 2 && lat >= 49 && lat <= 61;
    return {
      name: r[ix('la_name')], slug: r[ix('la_slug')], lng, lat,
      kwh: coordsOk ? num(r[ix('pvgis_kwh_per_kwp')]) : null,
      solarInstalls: num(r[ix('solar_installs')]), hpInstalls: num(r[ix('heatpump_installs')]), bus: num(r[ix('bus_vouchers')]),
    };
  });
}

export function distKm(a: Area, b: Area) {
  const R = 6371, rad = (x: number) => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const fmt = (n: number) => n.toLocaleString('en-GB');
