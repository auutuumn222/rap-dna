// 署名姓名与署名原文的排版归一化。
//
// 目的很窄：只消除「同一串字符的不同排版写法」，不承担任何「别名 / 同人」推断。
// 上游 personId 由 `'c' + base64url(normalize(name))` 派生，normalize 太弱会让
// `Mai ＂No Label Crew＂` 与 `Mai “No Label Crew”` 落成两个身份。本模块修正的正是
// 这一层，因此它产出的 key 只用于「排版等价」判定，绝不用于跨平台账号合并。

const NAMED_ENTITIES = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};

// 全角/兼容字符在 NFKC 后仍可能残留的不可见码位：韩文填充符、零宽字符、BOM 等。
const INVISIBLE = /[\u0000-\u0008\u000b-\u001f\u007f\u00a0\u115f\u1160\u3164\ufeff\u200b-\u200f\u202a-\u202e\u2060-\u2064]/g;
const DOUBLE_QUOTES = /[\u201c\u201d\u201e\u201f\u2033\u2036\u3003]/g;
const SINGLE_QUOTES = /[\u2018\u2019\u201a\u201b\u2032\u2035]/g;
// 名称末尾的括注，例如「吴冠仑HusH!    （HusH!）」。
const TRAILING_PAREN = /[（(]([^（()）]*)[)）]$/;
// 名称末尾的残留标点，含未闭合的左括号，例如「影帝inDy（」「ATM Hanson，」。
const TRAILING_PUNCT = /[\s,;:、，；：。．.!！?？·・|\\/（）()\[\]【】"'‘’“”]+$/;
const HAS_WORD = /[\p{L}\p{N}]/u;

function decodeEntities(value){
 return value.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g,(match,dec,hex,named)=>{
  if(named)return NAMED_ENTITIES[named.toLowerCase()]??match;
  const code=dec?Number(dec):parseInt(hex,16);
  return Number.isFinite(code)&&code>0&&code<=0x10ffff?String.fromCodePoint(code):match;
 });
}

function fold(value){
 return decodeEntities(String(value??''))
  .normalize('NFKC')
  .replace(DOUBLE_QUOTES,'"')
  .replace(SINGLE_QUOTES,"'")
  .replace(INVISIBLE,'');
}

/**
 * 署名姓名 → 排版等价 key。
 * 折叠：HTML 实体、全半角、弯直引号、全部空白、末尾标点、大小写。
 * 末尾括注只在「括注内容是姓名自身的重复」时才折叠，例如
 * 「吴冠仑HusH!（HusH!）」。像「BEAT SHARE ( G.7 )」与「BEAT SHARE ( Provoke )」
 * 这样用括注区分团体内不同成员的写法必须保持独立，否则会把两个人并成一个身份。
 * 不折叠：姓名内部的标点与连字符（`T. Q` 与 `TQ` 仍视为不同写法）。
 */
export function normalizeCreditName(value){
 let key=fold(value).replace(/\s+/g,'').toLowerCase();
 const paren=key.match(TRAILING_PAREN);
 if(paren){
  const base=key.slice(0,paren.index),inner=paren[1].replace(TRAILING_PUNCT,'');
  if(base&&HAS_WORD.test(base)&&inner&&HAS_WORD.test(inner)&&base.includes(inner))key=base;
 }
 return key.replace(TRAILING_PUNCT,'');
}

/**
 * 署名原文 → 等价 key，用于同一首歌内的重复署名判定。
 * 比 normalizeCreditName 保守：不动末尾括注与标点，只对齐分隔符与空白，
 * 避免把「编曲：A」和「编曲：A/B」这类信息量不同的两行判成同一行。
 */
export function normalizeCreditRaw(value){
 return fold(value).replace(/\s+/g,'').toLowerCase();
}

/** 归一化后不含任何字母或数字的姓名是平台占位符（`“”`、`ㅤ`、`!`），不构成创作者身份。 */
export function isPlaceholderName(key){
 return !HAS_WORD.test(key);
}
