import fs from 'fs';
import path from 'path';

const ARTIST_ID = 12200580; // 谟西Mercy NetEase
const APPLE_ARTIST_ID = 1604315395; // 谟西Mercy Apple Music
const OUT_DIR = 'research/moximercy';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://music.163.com/',
      ...opts.headers
    },
    ...opts
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function collectNetEaseSongs() {
  console.log('Fetching NetEase songs for artist:', ARTIST_ID);
  let offset = 0;
  const limit = 50;
  const allSongs = [];
  let total = null;

  while (true) {
    const url = `https://music.163.com/api/v1/artist/songs?id=${ARTIST_ID}&offset=${offset}&limit=${limit}&order=hot`;
    const data = await fetchJSON(url);
    if (!data.songs || data.songs.length === 0) {
      console.log(`Finished at offset ${offset}, no more songs.`);
      break;
    }
    total = data.total ?? total;
    allSongs.push(...data.songs);
    console.log(`Fetched offset ${offset}, count ${data.songs.length}, accumulated: ${allSongs.length}, total: ${total}, more: ${data.more}`);
    if (!data.more && offset + data.songs.length >= total) {
      break;
    }
    offset += data.songs.length;
    await new Promise(r => setTimeout(r, 200));
  }

  // Deduplicate songs by id
  const songMap = new Map();
  for (const s of allSongs) {
    songMap.set(s.id, s);
  }
  const uniqueSongs = Array.from(songMap.values());
  console.log(`Unique NetEase songs: ${uniqueSongs.length}`);
  fs.writeFileSync(path.join(OUT_DIR, 'netease-songs.json'), JSON.stringify(uniqueSongs, null, 2));
  return uniqueSongs;
}

async function collectNetEaseAlbums() {
  console.log('Fetching NetEase albums for artist:', ARTIST_ID);
  let offset = 0;
  const limit = 50;
  const allAlbums = [];
  while (true) {
    const url = `https://music.163.com/api/artist/albums/${ARTIST_ID}?offset=${offset}&limit=${limit}`;
    const data = await fetchJSON(url);
    if (!data.hotAlbums || data.hotAlbums.length === 0) break;
    allAlbums.push(...data.hotAlbums);
    console.log(`Fetched albums offset ${offset}, count ${data.hotAlbums.length}, accumulated: ${allAlbums.length}, more: ${data.more}`);
    if (!data.more) break;
    offset += data.hotAlbums.length;
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`Total NetEase albums: ${allAlbums.length}`);
  fs.writeFileSync(path.join(OUT_DIR, 'netease-albums.json'), JSON.stringify(allAlbums, null, 2));
  return allAlbums;
}

async function collectAppleMusic() {
  console.log('Fetching Apple Music data for artist ID:', APPLE_ARTIST_ID);
  const lookupUrl = `https://itunes.apple.com/lookup?id=${APPLE_ARTIST_ID}&entity=album&limit=200`;
  const res = await fetchJSON(lookupUrl);
  console.log(`Apple Music lookup results: ${res.resultCount}`);
  fs.writeFileSync(path.join(OUT_DIR, 'apple-lookup.json'), JSON.stringify(res, null, 2));
}

async function main() {
  await collectNetEaseSongs();
  await collectNetEaseAlbums();
  await collectAppleMusic();
  console.log('Collection completed!');
}

main().catch(err => {
  console.error('Error in collection:', err);
  process.exit(1);
});
