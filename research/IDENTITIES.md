# 创作者身份与别名

`dist/identity-registry.js` 是人工审定的身份映射表，使用已核实的平台 person ID 作为当前统一 ID。每个别名按旧 person ID 精确映射，保留姓名、核对方式、作品来源与核查日期。运行时不执行模糊匹配，不依据头像合并身份。

第一批为 20 位幕后人物的 23 条姓名署名映射。主要依据为已有档案中同一个歌曲 ID、同一角色、相符原始姓名字段分别关联了姓名 ID 与平台 ID。ATM Hanson 的无空格写法额外由《PIPE DOWN》同曲编曲与制作字段核对；尾部逗号写法只消除末尾标点差异，不拆分或合并共同署名。

原始 catalog JSON 不修改。`identity.js` 在内存中生成统一人物与署名视图，并保存 `originalPersonId`、`originalName` 和原始 `raw` 字段。创作者索引保留不同原始身份来源的证据行，作品计数按平台歌曲 ID 去重，不把旧页面数量相加。身份层同时用于歌手页关系图、侧栏、头像、歌曲搜索、创作者主页、共同幕后、别名搜索和旧主页链接。

每位已映射创作者的主页提供可展开的核对依据；歌曲证据区显示原始署名和关联后的创作者。未经核实的身份继续分开显示。The Heatmakerz 不属于 ATM Hanson 的任何身份映射。

维护步骤：

1. 执行 `node scripts/audit-identities.mjs` 生成待核对候选；此报告不会自动改变网站。
2. 核查来源后，向 registry 添加明确的旧 ID 映射及证据；无法确认的候选保持 pending。
3. 执行 `node scripts/build-creators.mjs`、`node --test tests/identity.test.mjs tests/creators.test.mjs`。
4. 如需撤销，删除相应 alias 映射并重建索引。原始 catalog 无损保留，可恢复拆分前署名。

姓名完全相同也可能属于不同人，多个正数平台 ID 不做自动归并。组合署名、厂牌、团体和人名不互相替换。
