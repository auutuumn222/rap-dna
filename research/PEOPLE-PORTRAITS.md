# 共享人物头像

2026-10-29 按 Asen 与马思唯两份已发布档案中的网易云人物 ID 核对，共取得 141 个有效头像，其中 2 个直接复用已有主档案照片。

- 注册表：`dist/people-portraits.json`，同一个人物 ID 在各关系网中共用一张照片。
- 新照片：`dist/assets/people/`；主档案照片继续使用原路径。
- 来源：网易云对应 ID 的公开艺人资料 `img1v1Url`，每条记录保留艺人页、原图地址及核查日期。团体使用对应团体页的头像。
- 未按名字搜索或推断制作人的照片。无有效平台人物 ID、头像为平台默认图、下载失败或浏览器加载失败时，显示姓名缩写。
- Rainbow（n31699751）与 Avatar Darko（n989028）仅取得默认图片，未加入注册表。
- 图片保持原色，以圆形裁剪显示。关系计数和署名证据不由头像数据改变。

采集脚本：`node scripts/collect-portraits.mjs`。轻量来源与失败日志：`research/people-portraits.json`。

核查：`node --test tests/portraits.test.mjs`；浏览器交互检查：`node tests/portraits-browser.mjs`，使用项目既有的 Playwright 环境参数。

图片来自公开平台资料，权利归相应权利人。
