# RAP DNA · 中文说唱作品与关系档案

现已收录 Asen、马思唯和张方钊（河南说唱之神），可在导航栏切换。各份档案共享：浅色玻璃导航、渐变标题、浮动唱片封面、作品年表、可搜索歌曲目录和可追溯的署名网络。原生 HTML/CSS/JavaScript，无运行时依赖；所有封面与肖像已本地缓存。

## 在线预览与更新

Asen：https://auutuumn222.github.io/rap-dna/

马思唯：https://auutuumn222.github.io/rap-dna/?artist=masiwei

张方钊：https://auutuumn222.github.io/rap-dna/?artist=zhangfangzhao

音乐人参数随作品分享链接保留；原有 Asen 链接继续有效。

这个版本使用 GitHub Pages 托管 `dist/`，无需自购域名或服务器。每次向 `main` 推送更新，GitHub Actions 会先核查目录及关系数据，再自动部署网页；发布进度可在仓库的 Actions 标签页查看。网页访客不需要 GitHub 账号。

仓库： https://github.com/auutuumn222/rap-dna 。源码与研究资料公开，网页只发布 `dist/` 中的静态资源。

## 网易云收听

歌曲目录、专辑曲目、关系作品及歌曲详情均可进入网易云官方外链播放器。只在用户点击后加载一个 iframe，并通过官方 `auto=1` 参数请求播放；首次打开和切歌时默认显示一条紧凑播放条，点击“展开播放器”查看完整组件。展开、收起保留同一播放器，切换歌曲、重新点击播放或关闭面板会移除原 iframe。Asen 的 166 条、马思唯的 318 条网易云记录提供此入口；各自的 Apple 补充记录保留原平台链接，不猜测匹配关系。

实际播放、试听时长及登录/会员/地区限制由网易云决定，浏览器也可能限制自动播放；展开后始终可用官方控件、“去网易云收听”链接及重新加载入口。跨域播放器无法可靠向本页报告播放状态，因此界面不会把“已加载”显示为“正在播放”。网站不获取、代理、缓存或提供歌曲音频下载。

## 启动

需要 Node.js 20+。Windows 双击 `Start-Demo.cmd`，自动启动并打开浏览器，使用期间保留终端窗口。也可以运行 `npm start`，访问 http://127.0.0.1:4173 。

## 马思唯数据范围（2026-10-28 核查）

- 网易云艺人 ID 1132392，全部四页返回 318 个不同歌曲 ID，平台报告 318，末页 more=false。
- Apple Music 中国区 41 项发行交叉对照，补充 4 条美国区歌曲记录；共 322 条平台记录。
- 10 张核心个人或联合项目当前平台曲单完整：A Few Good Kids、黑马王子、黑马、Humble Swag、Humble Swag GT Mixtape、特别怪人、冠军情歌 EP、狗咬狗、乐透人生、乐透人生GT：即刻入戏。
- 274 条记录有明确单曲署名字段；共 152 个发行容器，其中 147 个可辨识网易云发行、1 个待核占位及 4 个 Apple 补充发行。
- 有日期的记录跨度为 2014-01-01 至 2026-10-19；《心太软 (Live)》的平台发行 ID 和日期缺失，保留为待核，不显示成 1970 年。
- Higher Brothers 作品仅在马思唯有明确逐曲署名时计入；《最高》4 条已收录，未把 Black Cab / Five Stars 等整张团体目录自动归给成员。
- P.E.I 系列保留当前在架版本的 6 / 3 条记录，尚未证明原始发行曲单完整。Apple《Bu Zhi Dao》版本的时长及署名不同，保留来源，不断言独立作品或跨平台音源对应。

详见 [马思唯完整核查报告](research/MASIWEI-DISCOGRAPHY.md)。

## Asen 数据范围（2026-10-28 核查）

- 网易云艺人 ID 12198387 的全部公开分页：166 个不同歌曲 ID，平台报告 166，末页 more=false。
- Apple Music：18 项发行对照，另补 2 条歌曲记录；合计 168 条平台歌曲记录。
- 核心个人/联合专辑 7 张：Nesa Tape、Small Town Kid、Small Town Legend、NESA、狗咬狗、Life After Small Town、在雨后醒来。
- 保留 Next Wave 早期合作、DIGI GHETTO 团体项目及他人专辑中的客串；共 82 个关联发行容器，不是 82 张个人专辑。
- 共同署名网络与制作/编曲/混音/母带网络分别计算。每条连接可展开具体歌曲、角色及平台原始页。
- 158 条歌曲记录取得明确署名字段。不会将专辑级制作署名下放到单曲。

**这不是“出道以来无遗漏”的承诺。** 目前原始目录从 2018 年开始，2016–2017 年、已下架作品及部分视频发行仍有资料缺口。ICED OUT、God Gifted、天灵灵、RUN THIS GAME 的补证状态在页面与核查报告中单独列出。

歌曲数量包含伴奏和重复发行，不能当作 168 首独立原创歌曲。NESA 的 11/10 首版本差异，23、咋说的平台日期差异均保留。平台艺人栏包含制作人和团体，因而采用“共同署名”而非一律称为“共同演唱”。尚未核验的别名保持独立。

## 核查与测试

`npm test` 验证目录完整性、引用与署名证据、专辑曲目数、北京时间日期、来源差异、关系过滤和搜索。

`npm run test:browser` 使用 Playwright 检查桌面与移动端交互、深链接、导出和无横向溢出。可通过 `RAP_DNA_PLAYWRIGHT` 指定包路径，通过 `RAP_DNA_BROWSER` 指定浏览器可执行文件。截图输出在 `qa/asen/`。

`npm run test:masiwei` 检查马思唯作品、关系范围、日期缺失、导出、播放器、音乐人切换及手机布局。

`npm run test:player` 检查按需加载、单实例、切歌、收起、关闭、重试与跨平台兜底。该检查隔离第三方网络服务，不代表验证所有歌曲可播。

`npm run catalog:build` 与 `npm run catalog:masiwei` 分别从已保存的来源快照重新生成两份档案，不会自动联网采集。

马思唯资料采集：`node scripts/collect-masiwei.mjs` 读取官方目录分页，随后 `node scripts/harvest-masiwei.mjs` 采集署名元数据与封面；返回限制时记录失败，不绕过限制。

## 文件

- `dist/index.html`、`dist/asen.css`、`dist/asen.js`：页面与交互。
- `dist/model.js`：作品筛选与有证据支持的关系聚合。
- `dist/catalog.json`、`dist/catalog-masiwei.json`：各自的完整结构化数据、来源、差异与缺口。
- `dist/artists.js`、`dist/artists.css`：音乐人切换与档案配置。
- `research/ASEN-DISCOGRAPHY.md`、`research/MASIWEI-DISCOGRAPHY.md`：可阅读的核查报告及完整歌曲记录表。
- `research/`：来源元数据快照与采集日志；不含歌词或歌曲音频。
- `scripts/`：可复核的采集、元数据处理与档案生成脚本。

公开来源为网易云音乐、Apple Music 和艺人官方账号；具体作品链接附在各条记录中。平台目录可能变化，单曲字段也不等于已经核验的原始唱片内页。封面与肖像来自音乐平台公开资料，权利归相应权利人，用于音乐作品识别。


## 张方钊 / 河南说唱之神（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=zhangfangzhao`，或在导航中选择“张方钊”。沿用作品年表、歌曲搜索、逐曲署名网络、分享、导出和网易云官方播放器；姓名与旧艺名均可搜索。

- 网易云官方艺人 ID 15194340，别名字段为河南说唱之神；三页共 222 个不同歌曲 ID，平台报告 222，末页 more=false。同名其他账号不合并。
- Apple 中国区 24 项发行用于对照；补充《2022 wasted》12 条及《Bucktown》1 条，共 235 条平台记录、130 个关联发行容器、8 个核心项目。
- 核心项目为 2019 wasted、NEW WAVE、2020 wasted、答应我会幸福、哥们废了、钱专、2022 wasted、蛋专；每个当前平台曲单完整。
- WASTED CLUB《大牌走在东里路》9 首中只收录张方钊明确署名的 7 首；209 条歌曲取得明确单曲署名字段。
- 平台日期跨度 2016-07-02 至 2026-09-26，日期按来源保留，不视为首次发行或出道时间。Apple《2022 wasted》的平台日期为 2026-07-18，不从标题推定为 2022 年。
- 早期、已下架和视频作品尚未证明历史全量；详情受限的请求记录在采集日志中。封面、肖像已本地缓存，仅提供元数据和官方播放器入口。

核查报告：[ZHANGFANGZHAO-DISCOGRAPHY.md](research/ZHANGFANGZHAO-DISCOGRAPHY.md)。数据：`dist/catalog-zhangfangzhao.json`；来源快照：`research/zhangfangzhao/`。

采集：`node scripts/collect-zhangfangzhao.mjs`，然后 `node scripts/harvest-zhangfangzhao.mjs`。离线重建：`npm run catalog:zhangfangzhao`。目录与署名校验已接入 `npm test`；浏览器检查：`npm run test:zhangfangzhao`，截图在 `qa/zhangfangzhao/`。

