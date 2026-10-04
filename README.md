# 点点岛 · DianDian Island

给 **3 岁半到 4 岁、说中文、还不识字** 的孩子的 iPad 数学小岛：数一数、比一比、分一分、合起来——让孩子真正理解数量与加法，而不是背诵。

**打开：<https://edliu1105.github.io/diandian-island/>**（iPad Safari → 分享 → 添加到主屏幕；第一次联网打开后可离线玩）

- 六个世界、24 个小游戏，覆盖 12 项早期数感：瞬识、一一对应、基数、给出 N 个、比较、守恒、序数、部分—整体、合并、接着数、凑十与十和几、符号映射。
- 玩完以后还有第二片海（7 个岛 28 个小游戏）和云上（7 个岛 28 个小游戏）：三个世界一共 80 种玩法互不重复，每个岛的第四关是推理测验；一关一关开，每个小游戏拿满 5 颗星才开下一个。
- 不用文字出题：语音 + 图标 + 动画示范；不打红叉、不扣分、没有失败音；答错就事论事说一句哪里不对，再换一道新题；永远不替孩子做、不显示答案，星星只给孩子自己第一次就答对的题。
- 家长功能藏在长按齿轮之后；家长面板有语音诊断、进度与难度下限。
- 一个 `index.html`（云上的 28 个玩法在 `assets/js/w3games.js`，点“开始”后再加载），没有任何第三方 JS/CSS 库或构建工具；Service Worker 离线。

文档：[设计稿](docs/DESIGN.md) · [部署与更新](docs/DEPLOY.md) · [iPad 真机验收清单](docs/IPAD-CHECKLIST.md) · [交付说明](docs/DELIVERY.md)

测试：`bash tests/run_all.sh webkit` / `bash tests/run_all.sh chromium`（Playwright，Python）。

**关于角色形象**：本项目为家庭非商业教育用途。39 个角色形象（小猪佩奇、Bluey、葫芦娃、汪汪队、西游记、复仇者）的权利归各自权利人所有，图片由委托方提供、未作改绘；如权利人提出要求，可用 `python tools/replace_char.py takedown <world>` 立即下架对应世界（见 [DEPLOY.md](docs/DEPLOY.md)）。
