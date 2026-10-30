# RAP DNA · 中文说唱作品与关系档案

现已收录 Asen、马思唯、张方钊（河南说唱之神）、SASIOVERLXRD、法老和连麻Swimming、MULA SAKEE、Capper、贝贝、mac ova seas、PSY.P、KnowKnow、GALI，可在导航栏切换。各份档案共享：浅色玻璃导航、渐变标题、浮动唱片封面、作品年表、可搜索歌曲目录和可追溯的署名网络。原生 HTML/CSS/JavaScript，无运行时依赖；所有封面与肖像已本地缓存。

## 在线预览与更新

Asen：https://auutuumn222.github.io/rap-dna/

马思唯：https://auutuumn222.github.io/rap-dna/?artist=masiwei

张方钊：https://auutuumn222.github.io/rap-dna/?artist=zhangfangzhao

法老：https://auutuumn222.github.io/rap-dna/?artist=pharaoh

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



## 法老 Pharaoh（2026-10-29 核查）

入口：`?artist=pharaoh`，或在导航中选择“法老”。复用作品年表、搜索、共同署名与幕后关系网、分享导出和网易云官方播放器。支持法老、Pharaoh、MC法老、孙权搜索。

- 网易云艺人 ID 865007，三页 250 个不同歌曲 ID，平台报告 250，末页 more=false；215 条取得明确逐曲署名。
- Apple 中国区 23 项发行交叉对照；从经作品核实的 ID 1449028292 补充 In 10 Years, Pt. 1 的 3 条记录，共 253 条平台记录。
- 7 个核心项目：MC法老的Demo、东海岸、生于未来、上学嗨mixtape、科幻小说、退潮、健将mixtape。联合项目健将mixtape 共 11 条，仅计法老明确署名的 9 条；Apple 版本为 10 条，保留差异。
- 活死人 Woken Day 计入 2 / 11 条；上海站现场计入 11 / 14 条，不因成员身份或专场标题补齐全曲单。Apple 理想国的发行级 featuring 不自动归入每首歌。
- 143 个关联发行容器（140 个网易云发行、2 个待核占位、1 个 Apple 补充发行）。家有儿女PLUS (Live)、重返街头的发行与日期为空，保留为待核；有日期记录为 2014-12-01 至 2026-08-25。
- Apple 另一个同名 ID 1441077319 待逐曲核验，不自动合并。早期、下架与视频作品尚未证明历史全量。

[完整核查报告](research/PHARAOH-DISCOGRAPHY.md)，结构化数据 `dist/catalog-pharaoh.json`，来源快照 `research/pharaoh/`。仅保存公开元数据、署名与识别图片，不保存歌词或音频。

采集：`node scripts/collect-pharaoh.mjs` → `node scripts/harvest-pharaoh.mjs`；离线重建：`npm run catalog:pharaoh`；浏览器检查：`npm run test:pharaoh`。数据检查已接入 `npm test`，截图在 `qa/pharaoh/`。

## 连麻Swimming 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=lianma`，或在导航中选择“连麻Swimming”。作品年表、搜索、逐曲署名关系、分享、导出和官方播放器沿用现有档案。

- 网易云主艺人 ID 12064019，两页共 158 条，末页 more=false；其他同名账号不自动合并。
- CHUNGHWA 官方发行页补入 8 条艺人 ID 为零但逐曲姓名明确署名的歌曲，另补 Apple Music《比心》《My Universe》，共 168 条平台记录、90 个关联发行容器。
- 7 个核心项目：Wake Up、YELLER、Yuppie“雅痞”、CHUNGHWA、真假美猴王、邻家小丈夫、斩鸭线。Wake Up 保留 4/5 条主账号署名，另一首复合艺人账号待核；其他 6 个项目当前曲单完整。
- 132 条记录取得单曲明确署名；有日期的范围为 2017-08-05 至 2026-10-24，不代表历史全量。Apple 中国/美国区 4/7 项发行分别保留；部分发行未返回逐曲资料。
- 部分网易云详情接口返回 -462，记录在采集日志中；保留已取得的发行列表和歌曲分页，不绕过平台限制。图片均已本地缓存。

采集依次运行 `node scripts/collect-lianma.mjs`、`node scripts/harvest-lianma.mjs`、`node scripts/supplement-lianma.mjs`；离线重建：`npm run catalog:lianma`。目录检查已接入 `npm test`，浏览器检查 `npm run test:lianma`。

核查报告：[LIANMA-DISCOGRAPHY.md](research/LIANMA-DISCOGRAPHY.md)。来源快照：`research/lianma/`，页面数据：`dist/catalog-lianma.json`。



## SASIOVERLXRD 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=sasioverlxrd`，也可从导航切换。

- 网易云艺人 ID 14117457，三页共返回 244 个不同歌曲 ID，末页 more=false；其中 8 条原发行署名 Sasi 的身份待核记录隔离，不进入作品统计和关系网。原始快照及导出中的 excludedRecords 保留这些记录。
- 收录 236 条网易云记录，另补 Apple Music 的 SHANG-CHI尚气、旁光、萃取，共 239 条平台记录；218 条取得明确单曲署名。
- 主线 8 个项目：SAMURDER、MUD、冰冷热带鱼、成嶋亮、纳萨力克、那小子真帅、超级孙先生、赫鬼。冰冷热带鱼的 12 条总曲单中仅返回 11 条本人署名，不补算其他人的独立曲目。
- 早期 OVERLXRD 系列保留 6 / 10 / 10 条本人署名，平台发行总数为 7 / 13 / 12。收录范围为 2018-04-20 至 2026-09-26，不代表历史全量。
- 共 119 个关联发行容器。Apple 中国 / 美国区 7 / 9 项发行分别保留为 16 项地区对照，成嶋亮与超级孙先生的曲目数差异保留原来源。

完整记录、身份隔离依据及来源见 [SASIOVERLXRD 核查报告](research/SASIOVERLXRD-DISCOGRAPHY.md)。

`node scripts/collect-sasioverlxrd.mjs` 采集目录，`node scripts/harvest-sasioverlxrd.mjs` 采集逐曲署名、发行详情与图片，`node scripts/cache-sasioverlxrd-extras.mjs` 缓存补充封面；失败请求保留在采集日志中，不绕过平台限制。

`npm run catalog:sasioverlxrd` 从快照重建；`npm test` 检查完整分页的收录 / 隔离、关系证据和资源；`npm run test:sasioverlxrd` 检查页面、深链接、播放器、音乐人切换及 390 / 320px 布局，截图在 `qa/sasioverlxrd/`。



## MULA SAKEE 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=mulasakee`，或从导航选择 MULA SAKEE。沿用 ASEN、马思唯的作品年表、歌曲搜索、逐曲署名关系网、详情深链接、JSON 导出及网易云官方播放器。

- 网易云主账号 ID 14925064，两页共 148 个不同歌曲 ID，平台报告 148，末页 more=false。同名其他账号不合并。
- 5 个个人项目：7 7 7 WAR BABII、PROJ3CT D3MON、SSS、SAINT JUICE、永玄大典，分别收录 9 / 9 / 16 / 17 / 20 条。DIGI GHETTO 团体专辑总数 18，本人明确署名 9 条。
- 共 69 个关联发行容器，138 条歌曲取得明确逐曲署名；日期跨度 2018-06-01 至 2026-08-06，不代表历史全量。
- Apple Music 中国 / 美国区分别保留 11 / 10 项地区发行对照；美国区歌曲接口返回 32 条、中国区未返回歌曲，不据发行容器猜测缺失曲目。《神机妙算》保留待核条目。已核对的 Apple 歌曲不重复加入目录。
- 部分网易云发行详情返回 API -462，失败请求保留日志；主账号目录、歌曲字段及封面已取得，部分详情复用已有来源快照。封面及肖像本地缓存。

完整核查：[MULASAKEE-DISCOGRAPHY.md](research/MULASAKEE-DISCOGRAPHY.md)。数据：`dist/catalog-mulasakee.json`；来源：`research/mulasakee/`。

采集：`node scripts/collect-mulasakee.mjs`，随后 `node scripts/harvest-mulasakee.mjs`；离线重建：`npm run catalog:mulasakee`。`npm test` 已纳入目录、曲单参与范围、关系证据及资源校验；`npm run test:mulasakee` 检查页面交互、分享深链接、导出、播放器、音乐人切换及 390 / 320px 布局，截图在 `qa/mulasakee/`。浏览器测试可使用 README 前述的 Playwright 和浏览器路径环境变量。



## Capper 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=capper`，或从导航选择 Capper。沿用作品年表、歌曲搜索、逐曲署名关系网、歌曲深链接、导出与网易云播放器。

- 网易云主账号 ID 12193174，两页完整返回 200 个不同歌曲 ID，末页 more=false；同名其他账号不合并。
- 4 张个人专辑：剑，蔷薇、Uniconfication、P.I.G.、槍火天使，分别 22 / 14 / 23 / 20 条；与周震南联合署名的 EP 子弹与花期 7 条，5 个主线项目曲目完整。
- Apple Music 艺人 ID 1574279636，中国 / 美国区分别 22 / 22 项发行，保留为 44 项地区对照；美国区取得 103 条歌曲，中国区歌曲接口未返回曲目。终章 Final Chapter 及伴奏补充 2 条，共 202 条平台记录、96 个关联发行容器，176 条有明确逐曲署名。
- 收录日期跨度 2017-09-04 至 2026-10-25，包含单曲、专辑、现场、伴奏及重复发行，不等于历史全量或独立原创总数。Apple《终章》单曲日期 2021-10-18，发行容器日期 2022-06-06，分别保留。
- 部分发行详情返回 API -462，失败请求保留日志，缺失曲单或制作角色不猜测。封面及肖像本地缓存。

核查报告：[CAPPER-DISCOGRAPHY.md](research/CAPPER-DISCOGRAPHY.md)。结构化数据：`dist/catalog-capper.json`；来源快照：`research/capper/`。

采集：`node scripts/collect-capper.mjs`、`node scripts/harvest-capper.mjs`、`node scripts/cache-capper-extras.mjs`。离线重建：`npm run catalog:capper`。`npm test` 校验分页、身份、联合 EP、合作范围和逐曲关系证据；`npm run test:capper` 检查桌面、390 / 320px 布局、搜索、深链接、Apple 外链、导出、网易云播放器及音乐人切换，截图在 `qa/capper/`。

## Thome / thomeboydontkill（2026-10-29 核查）

导航选择 Thome，或访问 `?artist=thome`。新旧艺名均可搜索，沿用年表、目录、逐曲署名关系、分享、导出与网易云官方播放器。

- 网易云 ID 12110173，三页返回全部 203 条，末页 more=false；另一同名账号不合并。
- 105 个关联发行容器，6 个个人核心项目；玉童子当前为 4/5，其余五个曲单完整。
- DIGI GHETTO 仅收本人署名 10/18；BEDROOM TAPE 1/5，The Collections（集）1/4。不把艺人页关联发行整张归为个人作品。
- 191 条取得明确逐曲署名，有日期的范围 2018-03-30 至 2026-08-29；不代表历史全量。
- Apple 新旧账号共享发行 ID，保留新旧身份快照；新账号中国/美国区 20/21 项发行分别对照。英译与版本差异没有逐项证实时不重复补入。
- 部分发行详情返回 -462，记录在采集日志；不绕过限制，仅保留元数据、署名及图片，不保存歌词或音频。

采集：`node scripts/collect-thome.mjs`，再 `node scripts/harvest-thome.mjs`。离线重建：`npm run catalog:thome`。目录测试已纳入 `npm test`，浏览器检查 `npm run test:thome`。

完整报告：[THOME-DISCOGRAPHY.md](research/THOME-DISCOGRAPHY.md)，来源：`research/thome/`，数据：`dist/catalog-thome.json`。


## 贝贝 / ljz329 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=beibei`，也可从导航选择“贝贝（ljz329）”。支持贝贝、ljz329 与用户提供的拼写 lij329 搜索，保留来源中的实际平台名。

- 网易云主账号 ID 51957057，完整返回 32 条不同歌曲记录，报告总数 32，末页 more=false；20 个艺人页单曲发行，30 个已知关联发行容器及 2 条发行待核记录。
- 当前没有已核实的完整个人专辑，页面采用单曲主线；31 条取得明确逐曲署名。合作方专辑只列 ljz329 明确参与的歌曲。
- 30 条有日期记录跨度 2019-12-11 至 2026-07-29；TALKING SH*T FREESTYLE（2017）与 How You Feel 的发行 ID 为 0、日期为空，保留待核，不从标题推定年份。
- Apple 搜索返回的 404 RAPPER 与网易云 ljz329 在 backbone、POUR IT UP 中分别署名，不能证明是同一身份。其中国 / 美国区 9 / 6 项发行及 12 条歌曲只保留候选研究快照，不进入目录、统计或关系网；没有确认的 Apple 补充曲目。
- 当前主账号公开目录完整，不代表早期、下架与视频作品历史全量。部分发行详情接口受限，失败保留日志；封面肖像本地缓存，待核发行使用肖像作占位并明确标示。

核查报告：[BEIBEI-DISCOGRAPHY.md](research/BEIBEI-DISCOGRAPHY.md)。数据：`dist/catalog-beibei.json`；来源：`research/beibei/`。

采集：`node scripts/collect-beibei.mjs`，随后 `node scripts/harvest-beibei.mjs`；离线重建：`npm run catalog:beibei`。`npm test` 校验完整分页、身份隔离、单曲及合作范围、日期缺口和关系证据；`npm run test:beibei` 检查搜索别名、单曲主线、详情深链接、导出、播放器、切换与 390 / 320px 布局。截图在 `qa/beibei/`。

## JinJiBeWater_隼（2026-10-29 核查）

导航选择 JinJiBeWater_隼，或访问 `?artist=jinji`。沿用年表、搜索、逐曲署名关系网、分享、导出和网易云官方播放器。

- 网易云主账号 ID 13451886，完整一页返回 97 条歌曲记录，more=false；同名账号 50149549 不自动合并。
- 5 个核心个人/联合项目：冰冷热带鱼、树敌SHOOTING、真假美猴王、纯白小背心、自在极意；冰冷热带鱼收本人 7/12 条，其余四个当前曲单完整。
- 0828 发行总数 4，仅收本人逐曲署名的 say good bye 1 条；共 60 个关联发行容器，不等于 60 张个人专辑。
- 87 条取得明确单曲署名，有日期的范围为 2018-04-27 至 2026-09-26；不代表历史全量。
- Apple Music ID 1625179719，中国/美国区分别 5/6 项发行，保留为 11 项地区对照。中国区逐曲接口未返回歌曲，美国区取得 8 条；未因标题差异重复补入。
- 部分发行详情返回 -462，保留采集日志，不绕过限制；封面、肖像本地缓存，仅保留元数据和署名，不保存歌词或音频。

采集：`node scripts/collect-jinji.mjs`，随后 `node scripts/harvest-jinji.mjs`。离线重建：`npm run catalog:jinji`。目录检查接入 `npm test`，浏览器检查 `npm run test:jinji`。

核查报告：[JINJI-DISCOGRAPHY.md](research/JINJI-DISCOGRAPHY.md)，数据：`dist/catalog-jinji.json`，来源快照：`research/jinji/`。


## mac ova seas 数据范围（2026-10-29 核查）

本地启动后访问 `http://127.0.0.1:4173/?artist=macovaseas`，或从导航选择 mac ova seas。沿用作品年表、歌曲搜索、逐曲署名关系网、深链接、导出与网易云官方播放器。

- 网易云主账号 ID 30704161，两页共 156 个不同歌曲 ID，报告总数 156，末页 more=false；36 个艺人页发行条目、86 个已知关联发行容器及 2 条发行待核记录。
- 4 个个人项目：Born 2 Be、MOSLOS、>¥、Rebuild，分别收录 15 / 16 / 7 / 15 条。DIGI GHETTO 共 18 首，本人署名 6 首；The Collections（集）共 4 首，只收有 mac 署名的莫来头 1 首；KenRobb 的 Retro Vol.1 共 9 首，其中本人署名 7 首。
- 142 条取得明确逐曲署名；有日期记录跨度 2018-05-29 至 2026-05-31。七里香 (Remix)、巧克力自由缺失发行 ID 与日期，保留待核，不填为 1970 年；占位图使用艺人肖像。
- Apple Music 艺人 ID 1529239270，中国 / 美国区分别 18 / 17 项发行，保留为 35 项地区对照；歌曲接口返回美国区 30 条、中国区 0 条。已取得的歌曲均在当前网易云目录找到对应曲目，没有重复补入歌曲。
- Born 2 Be 的网易云版本有 15 首，包含 Party&BullShit Remix；Amazon Music 版本有 14 首，差异及来源保留在报告中。平台标题、日期与艺人栏按各自来源保留，不自动合并英文别名或推断制作角色。
- 当前公开分页完整，不代表历史全量；部分发行详情返回 API -462，失败请求保留日志。封面及肖像本地缓存。

核查报告：[MACOVASEAS-DISCOGRAPHY.md](research/MACOVASEAS-DISCOGRAPHY.md)。数据：`dist/catalog-macovaseas.json`；来源：`research/macovaseas/`。

采集：`node scripts/collect-macovaseas.mjs`、`node scripts/harvest-macovaseas.mjs`；离线重建：`npm run catalog:macovaseas`。`npm test` 校验完整分页、个人项目、合作范围、日期缺口、关系证据及资源；`npm run test:macovaseas` 检查页面、搜索、深链接、导出、播放器、音乐人切换及 390 / 320px 布局。截图在 `qa/macovaseas/`。


## 杨和苏 KeyNG（2026-10-29 核查）

入口：`?artist=keyng`。网易云 ID 13899303，三页共 203 个歌曲 ID，末页 more=false；154 条取得明确单曲署名。Apple ID 1440715265 的中国区 25 项发行作交叉对照，补充《豫章書院》1 条，共 204 条平台记录、114 个发行容器、7 个核心项目。

主线：加冕、辩护人、荒诞故事、关于、一千公里、理想国、旷野。《加冕》网易云 10 条中取得 8 条，《辩护人》12 条中取得 11 条；Apple 两者分别为 8 / 11 条，保留曲单差异，不宣称原始曲单完整。Woken Day 只计 2 / 11 条，《捕风追影》原声只计 3 / 5 条。平台日期范围 2017-07-26 至 2026-09-25，早期及下架作品历史全量未证明。

[完整核查报告](research/KEYNG-DISCOGRAPHY.md)，目录 `dist/catalog-keyng.json`，来源快照 `research/keyng/`。采集：`node scripts/collect-keyng.mjs` → `node scripts/harvest-keyng.mjs`；离线重建：`npm run catalog:keyng`；浏览器检查：`npm run test:keyng`。支持杨和苏、杨和苏KeyNG、KeyNG 搜索，复用年表、关系网、播放器、分享及导出。

线上入口：https://auutuumn222.github.io/rap-dna/?artist=keyng

## Vansdaddy / VD（2026-10-29 核查）

导航选择 Vansdaddy，或访问 `?artist=vansdaddy`。支持艺人官方别名 VD 搜索，年表、歌曲目录、逐曲署名关系、分享、导出与官方播放器沿用现有页面。

- 网易云 ID 35009085，两页完整返回 157 条，末页 more=false；有日期范围 2020-01-27 至 2026-10-25，不代表历史全量。
- 7 个核心个人/联合项目：VEN10、200Q、Balloon、牛窝坑之子、牛窝坑秋冬随笔2024、都市醉漢、都市醉漢春日随笔2026，当前本人署名曲单均完整。
- Candytape2022 / Candytape2 分别保留本人署名 13/16、12/17 条，标记团体项目。共 71 个关联发行容器；147 条有明确单曲署名。不把发行级联合署名自动下放到每首歌。
- Apple ID 1654111268，中国/美国区分别 4/5 项发行。美国区相同发行和单曲显示硫克男孩Ryukboi，原样保留冲突，不认定两人为别名，不生成额外作品或关系。同名候选 ID 1819308208 未返回发行，另存快照。
- 部分发行详情返回 -462，保留采集日志，不绕过限制。封面与肖像已本地缓存；仅保留元数据和署名，不保存歌词或音频。

采集：`node scripts/collect-vansdaddy.mjs`，再 `node scripts/harvest-vansdaddy.mjs`。离线重建：`npm run catalog:vansdaddy`。目录检查已纳入 `npm test`；浏览器检查：`npm run test:vansdaddy`。

核查报告：[VANSDADDY-DISCOGRAPHY.md](research/VANSDADDY-DISCOGRAPHY.md)，数据：`dist/catalog-vansdaddy.json`，来源：`research/vansdaddy/`。


## PSY.P 数据范围（2026-10-29 核查）

入口 `?artist=psyp`。网易云账号 29303235，Apple Music 账号 1373552959（杨俊逸 / Psy.P）。完整取得网易云 233 条、补充 Apple《一个清醒的梦》《Why We Follow》2 条，共 235 条、119 个关联发行容器，172 条有明确逐曲署名。8 个个人项目；Higher Brothers 按逐曲署名收录。M.V.P 只有发行容器，当前分页无曲目，不填造曲单；其他表达方式为网易云 9 条、Apple 8 条，保留差异。

有日期记录范围 2017-03-27 至 2026-10-10，不代表历史全量。Apple 共 91 项地区发行分别保留，部分曲单接口及网易云发行详情受限，失败保留日志。无歌词、音频缓存。

报告：[PSYP-DISCOGRAPHY.md](research/PSYP-DISCOGRAPHY.md)。数据 `dist/catalog-psyp.json`，来源 `research/psyp/`。采集 `node scripts/collect-psyp.mjs`、`node scripts/harvest-psyp.mjs`；离线重建 `npm run catalog:psyp`；浏览器检查 `npm run test:psyp`。


## KnowKnow 数据范围（2026-10-29 核查）

入口 `?artist=knowknow`。网易云账号 27868624，Apple Music 1435562780。四页完整返回 335 条，8 个个人项目，266 条有明确逐曲署名，186 个关联发行容器。Higher Brothers 按逐曲署名收录。52hz remix 一条异常日期保留原平台字段 1994-09-03，显示日期留空待核。Apple 84 项地区发行分别保留；Mr. Enjoy Da Money 网易云 15 / Apple 14，街头贝多芬网易云 18 / Apple 美国区 17。历史全量未证明，受限请求保留日志。

报告：[KNOWKNOW-DISCOGRAPHY.md](research/KNOWKNOW-DISCOGRAPHY.md)。数据 `dist/catalog-knowknow.json`；来源 `research/knowknow/`。采集 `node scripts/collect-knowknow.mjs`、`node scripts/harvest-knowknow.mjs`；离线重建 `npm run catalog:knowknow`；浏览器检查 `npm run test:knowknow`。

## CashTrippy（2026-10-29 核查）

访问 `?artist=cashtrippy` 或在导航选择 CashTrippy。沿用年表、搜索、逐曲署名关系、播放器、分享和导出。

- 网易云ID 33937972，三页209条，末页more=false；同名账号58322051不合并。Apple明确合作曲No Brakes补充1条，共210条平台记录、135个关联发行容器。
- 六个核心项目：TrippyHood、Slayer、Two Head Snake双头蛇、Nafia Fever、万古、RACER，当前曲单完整。Goodkidstape 1仅收本人署名9/13，The Collections（集）1/4；HEATROOM TAPE 4th单列现场企划。
- 195条有明确单曲署名；有日期范围2019-06-06至2026-09-26，不代表历史全量。Apple中国/美国区10/13项发行分别保留为23项地区对照。部分详情返回-462，保留日志，不绕过限制。

采集依次运行 `node scripts/collect-cashtrippy.mjs`、`node scripts/harvest-cashtrippy.mjs`、`node scripts/cache-cashtrippy-extras.mjs`。离线重建 `npm run catalog:cashtrippy`；目录测试纳入 `npm test`；浏览器检查 `npm run test:cashtrippy`。

核查报告：[CASHTRIPPY-DISCOGRAPHY.md](research/CASHTRIPPY-DISCOGRAPHY.md)，来源：`research/cashtrippy/`，数据：`dist/catalog-cashtrippy.json`。仅保留元数据、署名与图片，不保存歌词或音频。

## GAI周延（三平台，2026-10-30核查）

访问 `?artist=gai`。网易云ID1211046，四页387条；QQ歌手mid004LV0lb4fOw89，五页442条，发行分页109项。Apple官方艺人ID1522410451，网页核对REAL G、G-BLOCK Mixtape、底层逻辑、杜康、烻、光宗耀祖六项发行；接口403/429没有绕过。

共829条平台歌曲记录、299个合并后发行条目（原469个平台发行容器），含跨平台重合，不是独立原创作品总数。六个核心项目：QQ的REAL G 16首，以及网易云五项17/9/13/11/14首。Apple光宗耀祖9首与网易云17首版本差异分别保留。275条取得明确单曲署名；QQ制作字段未采得则留空。QQ共同署名账号不凭名字与网易云同行账号合并。

有日期范围2015-07-21至2026-05-15。四条网易云记录缺失发行ID和日期；QQ空发行记录逐曲保留占位；占位图使用艺人肖像，不声称是专辑封面。当前公开目录不保证历史全量，实际版权、会员与收听限制由平台决定。

QQ记录只提供官方页面入口，不猜网易云ID。QQ搜索报告449首而歌曲目录报告442条，保留差异。详见 [GAI-DISCOGRAPHY.md](research/GAI-DISCOGRAPHY.md)，来源快照 `research/gai/`。

采集：collect-gai.mjs、harvest-gai.mjs、collect-gai-platforms.mjs、supplement-gai.mjs、cache-gai-platforms.mjs。离线重建 `npm run catalog:gai`；目录测试 `npm test`，浏览器 `npm run test:gai`。

GAI专辑展示已去除跨平台重复：同名网易云/QQ发行合为一张卡片；原始日期、曲单和链接保留在sourceEditions。年表按最早取得的平台日期排序，详情默认参考曲单，其余平台曲单单独展开，旧QQ专辑深链接继续有效。歌曲仍保留829条平台记录。


## GALI 数据范围（2026-10-30 核查）

入口 `?artist=gali`。网易云账号 12127362，Apple Music 1378752191。三页完整返回 217 条；补充魔法士、Crystal、God, Man and Ghost: Pathetic 三条明确署名的 Apple 记录，共 220 条、167 个关联发行容器，201 条有明确逐曲署名。

VINTAGE、晚霞AfterLight、亚特兰蒂斯、STRIPELIFE 四个个人项目分别收录 7 / 6 / 16 / 12 条。BEDROOM TAPE 共 5 首取本人署名 1 首，D.N.A 共 13 首取 3 首。日期范围 2016-11-01 至 2026-10-28；历史全量未证明。Apple 共 72 项地区发行分别保留，Know You Better 与一知半解时长和艺人对应，暂作版本对照，不重复补入。部分详情接口受限，日志保留。

报告：[GALI-DISCOGRAPHY.md](research/GALI-DISCOGRAPHY.md)。数据 `dist/catalog-gali.json`，来源 `research/gali/`。采集 `node scripts/collect-gali.mjs`、`node scripts/harvest-gali.mjs`；离线重建 `npm run catalog:gali`；浏览器验证 `npm run test:gali`。
