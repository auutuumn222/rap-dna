import { mkdir, writeFile } from 'node:fs/promises';

const base = 'research/taigexi';
await mkdir(base, { recursive: true });

async function snapshot(name, url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(25000)
  });
  if (!r.ok) throw Error(`${name}: HTTP ${r.status}`);
  const d = await r.json();
  if (d.code && d.code !== 200) throw Error(`${name}: API ${d.code}`);
  await writeFile(`${base}/${name}.json`, JSON.stringify(d, null, 2) + '\n');
  return d;
}

// 1. NetEase Identity & Head Info
const identity = await snapshot('netease-identity', 'https://music.163.com/api/search/get?s=' + encodeURIComponent('泰格西') + '&type=100&limit=10');
if (!identity.result?.artists?.some(a => a.id === 52410166 && a.name === '泰格西')) {
  throw Error('Artist identity mismatch');
}

await snapshot('netease-artist', 'https://music.163.com/api/artist/52410166');
await snapshot('netease-head', 'https://music.163.com/api/artist/head/info/get?id=52410166');
await snapshot('netease-fans', 'https://music.163.com/api/artist/follow/count/get?id=52410166');

// 2. NetEase Albums pagination
let albums = [], albumPages = [];
for (let offset = 0; ; offset += 100) {
  const d = await snapshot(`netease-albums-${offset}`, `https://music.163.com/api/artist/albums/52410166?id=52410166&offset=${offset}&limit=100`);
  albumPages.push({ offset, count: d.hotAlbums.length, more: d.more });
  albums.push(...d.hotAlbums);
  if (!d.more) break;
  if (!d.hotAlbums.length) throw Error('Empty album page with more=true');
}
await writeFile(`${base}/netease-albums.json`, JSON.stringify({ hotAlbums: [...new Map(albums.map(a => [a.id, a])).values()], pages: albumPages }, null, 2));

// 3. NetEase Songs pagination (all public songs)
let totalSongs = 0;
for (let offset = 0; ; offset += 100) {
  const d = await snapshot(`netease-songs-${offset}`, `https://music.163.com/api/v1/artist/songs?id=52410166&offset=${offset}&limit=100&order=time`);
  totalSongs += d.songs.length;
  console.log(JSON.stringify({ offset, count: d.songs.length, total: d.total, more: d.more }));
  if (!d.more) break;
  if (!d.songs.length) throw Error('Empty page with more=true');
}
console.log(`Total NetEase songs paginated: ${totalSongs}`);

// 4. Apple Music
const apple = await snapshot('apple-search-cn', 'https://itunes.apple.com/search?term=' + encodeURIComponent('泰格西') + '&entity=musicArtist&country=cn&limit=10');
const artist = apple.results.find(a => a.artistId === 1645496384);
if (!artist) throw Error('No exact Apple artist identity');

for (const country of ['cn', 'us']) {
  await snapshot(`apple-albums-${country}`, `https://itunes.apple.com/lookup?id=${artist.artistId}&entity=album&country=${country}&limit=200`);
}

console.log('Taigexi initial collection complete');
