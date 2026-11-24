# RAP DNA · 中文说唱关系档案

从一首喜欢的歌出发，认识参与制作、编曲、混音和母带的创作者。

**[打开 RAP DNA](https://auutuumn222.github.io/rap-dna/)**

## 为什么做 RAP DNA

中文说唱越来越火，大家记住了更多 Rapper 和他们的歌。我希望，也有更多听众能认识那些塑造歌曲声音的幕后创作者。想知道一段喜欢的编曲出自谁手、这个人还参与过哪些歌，往往得在不同作品之间来回翻署名。

比如 Asen 的《英雄》和马思唯的《Pop Music》，编曲署名里都有 ATM Hanson。把两首歌放在一起看，就能顺着这个名字继续听到他和其他 Rapper 的合作。我做 RAP DNA，就是想让这样的发现更容易发生。 [查看 ATM Hanson 的档案](https://auutuumn222.github.io/rap-dna/?creator=n13911452)

## 从哪里开始

| 想做什么 | 从这里开始 |
| --- | --- |
| 听听两首歌，看看它们有哪些共同的幕后署名 | [发现 · 原来也是 TA](https://auutuumn222.github.io/rap-dna/#discover) |
| 查一位创作者合作过谁，按制作、编曲、混音或母带筛选 | [制作人档案](https://auutuumn222.github.io/rap-dna/?view=creators) |
| 选两位 Rapper，查看他们共同合作过的幕后创作者和对应作品 | [找共同幕后](https://auutuumn222.github.io/rap-dna/?view=common&a=asen&b=masiwei) |
| 按年份浏览专辑、搜索歌曲，或查看共同署名与幕后合作网络 | [Rapper 档案](https://auutuumn222.github.io/rap-dna/?view=rappers) |

收录了网易云歌曲 ID 的记录可以打开官方播放器，其他平台的记录可沿来源链接查看。

## 署名怎么核对

- 关系来自已收录作品的逐曲署名。点开一条关系，可以查看对应的歌曲、角色和原始来源。专辑级署名只有在拿到单曲依据后才会归到某首歌。
- 已确认的艺名和拼写归到同一档案，原始署名保留。仍待核实的同名账号和姓名记录各自独立。
- 来源主要是网易云音乐、Apple Music 和艺人官方发布。各档案记录平台版本、日期差异，以及早期和下架作品的资料缺口。网站保存元数据、署名和识别图片，音频由原平台提供。

各艺人的采集快照与核查报告在 [research/](research/)，例如 [Asen](research/ASEN-DISCOGRAPHY.md)、[马思唯](research/MASIWEI-DISCOGRAPHY.md) 和 [谢帝](research/XIEDI-DISCOGRAPHY.md)。如果发现关联有误，可以在 [GitHub Issues](https://github.com/auutuumn222/rap-dna/issues/new) 附上歌曲链接、署名角色和原始来源。

## 本地运行

项目采用原生 HTML、CSS 和 JavaScript。建议使用与 GitHub Actions 一致的 Node.js 24，进入仓库目录后运行下面的命令。

```bash
npm start
```

浏览器打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。Windows 也可以双击 `Start-Demo.cmd`。

修改档案或别名后，运行下面的命令可以重建创作者索引并检查数据。

```bash
node scripts/build-creators.mjs
npm test
node --test tests/identity.test.mjs tests/creators.test.mjs
```

页面与结构化目录位于 [`dist/`](dist/)，采集和重建脚本位于 [`scripts/`](scripts/)。推送到 `main` 后，[GitHub Actions](https://github.com/auutuumn222/rap-dna/actions) 会重新生成索引、运行校验并把 `dist/` 发布到 GitHub Pages。
