import {readFile, writeFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Run from any directory. Only public NetEase artist metadata is requested.
const project = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const people = new Map();
const anchors = new Map([[12198387, 'ASen'], [1132392, '马思唯']]);
for (const [directory, anchor] of [['research', 12198387], ['research/masiwei', 1132392]]) {
  for (const file of (await readdir(project + directory)).filter(n => /^netease-songs.*\.json$/.test(n))) {
    const data = JSON.parse(await readFile(project + directory + '/' + file, 'utf8'));
    for (const song of data.songs || []) {
      // A directory hit alone is insufficient: require the anchor's actual credit.
      if (!song.artists?.some(a => a.id === anchor)) continue;
      for (const artist of song.artists) {
        if (!people.has(artist.id)) people.set(artist.id, {id: artist.id, name: artist.name, evidence: []});
        const p = people.get(artist.id);
        if (!p.evidence.some(e => e.songId === song.id && e.anchorId === anchor)) {
          p.evidence.push({anchorId: anchor, anchor: anchors.get(anchor), songId: song.id, title: song.name, url: `https://music.163.com/song?id=${song.id}`});
        }
      }
    }
  }
}

// First expansion batch: rap artists already evidenced in these catalogs.
// Genre/priority membership is editorial; counts and artist IDs are never estimated.
const mainNames = new Set([
  '艾志恒Asen', '马思唯', 'mac ova seas', 'THOME', 'MULA SAKEE', 'TOYOKI', 'KIV', '付思遥',
  '谢帝', '连麻Swimming', '斑比Bambii', 'Maikon Flocka Flame', 'GALI', '李佳隆',
  '王嗣尧TURBO', '黄格雷', 'Vansdaddy', '马伯骞Victor Ma', 'ATM Hanson', 'ØZI',
  '王以太', 'KnowKnow', '罗言', '姜云升', 'KKECHO', 'Dough-Boy', 'Melo', '李大奔BENZO',
  'Capper', 'PSY.P', 'CashTrippy', 'kkluv', '那奇沃夫', 'ICE杨长青', 'APMOZART',
  '派克特（PACT）', '邓典果DDG', 'J.Mag', 'TizzyT', 'Mengzi', '李尔新', '弹壳Danko', 'Ty.',
  'NINEONE#乃万', '潘玮柏', 'ljz329', '刘柏辛Lexie', 'MC HotDog 热狗', 'AnsrJ', 'YTH Chopie',
  'FENDIGHEE RICCH', 'YOUNG13DBABY', 'DP龙猪', '阿达娃', 'Bohan 冷博涵', '孙瑄阳Xtina',
  '建坤YOUNG', 'KANNA BUSH', 'SASIOVERLXRD', 'DiESi', '朴宰范', 'MadeinTYO', 'Lil Gnar',
  'Awich', 'KR$NA', 'VannDa', 'Spence Lee', 'pH-1', '21 Savage', 'Rich Brian', 'Warren Hue',
  'Avatar Darko', 'Rome Fortune',
]);
const groupNames = new Set(['DIGI GHETTO', 'P.C.G (紫猫帮）', 'Gosh Music', 'Wave Muzik', 'V.O.B', 'Higher Brothers', '88rising', '1999 WRITE THE FUTURE', 'A Few Good Kids Records', '成都集团', 'VVSGANG', 'P.O.E', '地磁卡']);
async function getJSON(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 200) throw Error(`API ${data.code}: ${data.message || data.msg || ''}`);
  return data;
}
const fromSnapshot = process.argv.includes('--from-snapshot');
const candidates = fromSnapshot
  ? JSON.parse(await readFile(project + 'research/rapper-priority-snapshot.json', 'utf8')).artists
  : [...people.values()];
let cursor = 0;
if (!fromSnapshot) await Promise.all(Array.from({length: 3}, async () => {
  while (cursor < candidates.length) {
    const p = candidates[cursor++];
    p.category = anchors.has(p.id) ? '已收录' : mainNames.has(p.name) ? '首批rapper' : groupNames.has(p.name) ? '团体/厂牌/组合' : '其他关联艺人';
    p.artistUrl = p.id > 0 ? `https://music.163.com/artist?id=${p.id}` : null;
    p.fansSource = p.id > 0 ? `https://music.163.com/api/artist/follow/count/get?id=${p.id}` : null;
    if (!p.id) {p.fans = null; p.error = '原始目录 artistId=0，不能据此生成主页或查询粉丝数'; continue;}
    try {
      const counts = await getJSON(p.fansSource);
      if (!Number.isSafeInteger(counts.data?.fansCnt) || counts.data.fansCnt < 0) throw Error('Missing/invalid fansCnt');
      p.fans = counts.data.fansCnt;
      p.fansResponse = counts;
      p.checkedAt = new Date().toISOString();
      // Official head metadata confirms identity and exposes the bound musician profile.
      const head = await getJSON(`https://music.163.com/api/artist/head/info/get?id=${p.id}`);
      if (head.data?.artist?.id !== p.id) throw Error('Artist ID mismatch');
      p.verifiedName = head.data.artist.name;
      p.userId = head.data.user?.userId ?? null;
      p.userUrl = p.userId ? `https://music.163.com/user/home?id=${p.userId}` : null;
      p.identityVerified = true;
    } catch (e) {p.fans ??= null; p.error = e.message;}
    console.log(JSON.stringify({name: p.name, fans: p.fans, verified: p.identityVerified ?? false, error: p.error}));
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}));
for (const p of candidates) p.category = anchors.has(p.id) ? '已收录' : mainNames.has(p.name) ? '首批rapper' : groupNames.has(p.name) ? '团体/厂牌/组合' : '其他关联艺人';
const compare = (a, b) => (b.fans ?? -1) - (a.fans ?? -1) || a.id - b.id;
const snapshot = {schemaVersion: 1, collectedAt: fromSnapshot ? JSON.parse(await readFile(project + 'research/rapper-priority-snapshot.json', 'utf8')).collectedAt : new Date().toISOString(), timezone: 'Asia/Shanghai', fansField: 'data.fansCnt', scope: 'ASen / 马思唯网易云已采集目录中的直接共同艺人署名；不是社交关系判断，也不是所有关联歌手的穷尽名单。', artists: candidates.sort(compare)};
await writeFile(project + 'research/rapper-priority-snapshot.json', JSON.stringify(snapshot, null, 2) + '\n');
await writeFile(root + 'rapper-priority.snapshot.json', JSON.stringify(snapshot, null, 2) + '\n');

const clean = s => String(s).replace(/\|/g, '／').replace(/\r?\n/g, ' ');
const num = n => n === null ? '待核' : n.toLocaleString('en-US');
const when = iso => new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'medium', hour12: false}).format(new Date(iso));
function evidence(p) {
  return [...anchors].filter(([id]) => id !== p.id).map(([id, name]) => {
    const matches = p.evidence.filter(e => e.anchorId === id);
    const sample = matches.find(e => !/伴奏|instrumental|\blive\b/i.test(e.title)) || matches[0];
    return sample ? `${name}：[${clean(sample.title)}](${sample.url})` : null;
  }).filter(Boolean).join('；') || '已建档的起点艺人';
}
function links(p) {
  return [p.artistUrl ? `[歌手主页](${p.artistUrl})` : '主页待核', p.userUrl ? `[音乐人账号](${p.userUrl})` : null].filter(Boolean).join(' / ');
}
function table(rows, withState = false) {
  return `|顺序|艺人|网易云粉丝数|网易云主页|与起点艺人的作品联系|${withState ? '进度|' : ''}\n|---:|---|---:|---|---|${withState ? '---|' : ''}\n` + rows.map((p, i) => `|${i + 1}|${clean(p.verifiedName || p.name)}|${num(p.fans)}|${links(p)}|${evidence(p)}|${withState ? '待增加|' : ''}`).join('\n') + '\n';
}
const main = candidates.filter(p => p.category === '首批rapper').sort(compare);
const existing = candidates.filter(p => p.category === '已收录').sort(compare);
const other = candidates.filter(p => p.category === '其他关联艺人').sort(compare);
const groups = candidates.filter(p => p.category === '团体/厂牌/组合').sort(compare);
let md = `# RAP-DNA：rapper 逐步增加顺序\n\n核查时间：${when(snapshot.collectedAt)}（北京时间）。\n\n以 ASen 和马思唯为起点，首批增加 ${main.length} 位有共同作品署名的说唱及相邻风格艺人（含海外 rapper）。下面“下一批 rapper”按网易云粉丝数从高到低排列，直接作为后续增加顺序；两位已收录艺人单列。每行作品链接用于说明实际联系，不把共同署名扩大解释为私人关系或同一厂牌。\n\n## 统计口径\n\n- 粉丝数来自网易云官方公开接口 \`/api/artist/follow/count/get?id=歌手ID\` 的 \`data.fansCnt\`，为本次核查时的精确人数，不采用热度、歌曲收藏数、其他平台关注数或估算值。\n- 每位有效歌手 ID 均另查官方 \`/api/artist/head/info/get\` 核对身份；同时提供歌手作品主页和已绑定的音乐人账号主页。\n- 作品证据来自本地当日已采集的网易云目录，仅在歌曲艺人列表同时包含 ASen 或马思唯时认定为直接共同署名。制作/演唱等具体角色需新增档案时逐曲再核对。\n- 这是基于当前目录的第一批名单，不代表全部合作历史；粉丝数会变化，后续可刷新快照并重排。其他风格歌手、尚待细分的艺人以及团体另列，暂不占首批 rapper 的增加序号。\n\n## 已收录的起点艺人\n\n`;
md += table(existing);
md += '\n## 下一批 rapper：按粉丝数从高到低逐位增加\n\n' + table(main, true);
md += '\n## 其他关联艺人候选：按粉丝数降序\n\n包含海外说唱、其他风格歌手、制作人及尚待细分的艺人；需要时可将其中人选提升到下一批。\n\n' + table(other);
md += '\n## 团体、厂牌及组合：按粉丝数降序\n\n团体或厂牌账号单列，避免重复计入成员的个人粉丝数。\n\n' + table(groups);
const errors = candidates.filter(p => p.error);
if (errors.length) md += '\n## 待核项\n\n' + errors.map(p => `- ${clean(p.name)}（ID ${p.id}）：${clean(p.error)}。`).join('\n') + '\n';
md += '\n## 后续使用\n\n按“下一批 rapper”的序号从上往下增加，完成后把进度改为“已增加”；每次新增仍核对作品、版本和署名。重排前保留当前完成状态。\n\n本次原始粉丝返回、查询时间、主页 ID 和全部作品关系证据保存在同目录的 [rapper-priority.snapshot.json](./rapper-priority.snapshot.json)。刷新采集脚本位于 `rap-dna/scripts/collect-rapper-priority.mjs`；重跑会重新生成名单并重置表内进度，已有进度时先备份文件。\n';
await writeFile(root + 'rapper新增顺序.md', md, 'utf8');
console.log(JSON.stringify({output: root + 'rapper新增顺序.md', main: main.length, existing: existing.length, other: other.length, groups: groups.length, errors: errors.length, top10: main.slice(0,10).map(p => ({name:p.name,fans:p.fans}))}, null, 2));
