# REVIEW-OX2 · 五个选项 + 答错后看为什么（第 2 轮，Fable 5.1 · high）

评审对象：`index.html`（md5 `d47aab78c6`）、`assets/js/w3games.js`、`w4games.js`、`v2games.js`、`sw.js`、`assets/voice/bank.json`，即 `fcfa8c0`（撤回规则三）之后的交付目录。
方法：先确认构建结果和加规则三之前的版本（`096c54c`）逐字节相同，再跑交付的测试，然后用自己写的 Playwright 脚本独立验证（星星逐题各算各的、答错后说的每一句话和录音、真实速度下真实鼠标点一下跳过、三种尺寸截图）。脚本、日志和截图在 `tests/logs/ox2/`，交付测试的输出在 `tests/logs/ox2_*.txt`。没有改 app 的代码。

## 1. 总体结论

**第 1 轮的六条全部改好，没有带出新问题；撤回的"一局错 3 题不算星"没有留下任何痕迹。**

- 构建结果：`index.html`、三个游戏文件、`sw.js`、`bank.json` 的 md5 和 `096c54c` 的逐一相同；`a718df0b.mp3`（"再来一局吧！"的录音）已不在目录里；代码、测试、文档里都搜不到 Ledger、再来一局、voidrule、"不算星"之类的字样（文档里只剩 `DELIVERY.md` 1x 第 6 点和 `OPTIONS-EXPLAIN-SPEC.md` 对撤回这件事的记录）。
- 星星逐题各算各的：四个世界 + 运算岛的 14 个游戏，每个游戏两局（第一局错 3 对 2、第二局错 2 对 3），每一次答对星托盘和存档都加一颗、答错的那道不加、没有一颗星变灰、没有"再来一局吧"，第二局第 5 颗星时"集满啦！"、游戏打勾、下一个游戏开。`test_stars`（每个游戏连错 3 道再答对一道 → 1 颗星）347 项全过。存档的键里没有任何像账本或错题计数的字段，家长面板也没有"未计入"的行。
- 答错后：112 个游戏 × 两次答错 × 两个种子，收尾语全是"下一题来啦！/ 再来一个！/ 再来一题！"，没有"再试一次"；讲解里说的 1300 多句话每一句都有录音（`Bank.has`，录音表 4970 条已加载）；没有欢呼、没有答对音、圈只有蓝 / 金 / 墨色；下一题都是新题（`retest`，key 不同）。
- 平台错误不再结束当前题：`test_rejections` 27 项全过（DOMException、`play()` 被拒、fetch TypeError、Service Worker 更新失败都被接住，题目照常；游戏自己的 Error 仍结束题目）。
- 点一下就能跳过：云上、运算岛、复习题、星空 31 个游戏 × 级别，真实速度、真实 `page.mouse.click`，0.4 秒点一下 0.91–1.39 秒内结束（第 1 轮的 U4 L2 是 3.0 秒、R4 L3 是 2.4 秒）；不碰的话 2.9–5.3 秒。第一、二世界 L5 全部 52 个游戏最长 5.2 秒、跳过都在 1.6 秒内。
- 回归：交付的 22 个套件全绿（见第 4 节），首屏 442.1 KB / 450 KB，离线 20 项。
- 画面：三种尺寸共 79 张截图，5 个选项都 ≥ 88 px、在屏内，没有挡顶栏、题目条和角色；一题两问第二问的大圆点在屏上清楚可见。

## 2. 第 1 轮各条的结论

| 第 1 轮 | 结论 | 证据 |
|---|---|---|
| P1 讲解句没有录音（`这里不是十八`、`橙色！`、`在两个中间！` 等三族） | **已修好** | `test_explain` 讲解部分现在逐句查 `Bank.has`，229 项全过（录音表没加载也算失败）。我自己的 `ox2_again.py`（112 个游戏 × 2 次答错，种子 5 和 9）两轮都是"lines without a recording: []"；三句收尾语也都有录音。`tests/logs/ox2/again.log` |
| P2 两处讲解超过 6 秒、叠一叠 / 水管点一下跳过要 2.4–3 秒 | **已修好** | `time_explain all 5`：W1 24 个游戏最长 P2 5.2 s，W2 28 个最长 D3 5.2 s，跳过全部 ≤ 1.6 s（`ox2_time_w1/w2.txt`）。我自己真实鼠标点一下（`ox2_skip.py`）：U4 L2 5.2 s / 点后 1.07 s，U4 L4 4.7 s / 1.08 s，R4 L3 4.0 s / 1.09 s，M3 L2 4.3 s / 1.10 s，I1 L5 4.2 s，I4 L4 5.1 s；31 项全过，最慢的是 R3 L4 1.39 s。`test_opt3` T 部分、`test_w4` 计时部分也全过 |
| P3 "谁剩得多"讲解时选错的卡还亮着绿勾 | **已修好** | `tests/logs/ox2/shots/M3_L2_L_explain.png`：他选的那组只有蓝色虚线圈，卡上没有绿勾、没有黄底，对的那张金圈。`test_w4` 对 M3、N1、N2、O2 检查讲解结束时选错的那个身上没有选中标记，全过 |
| P4 `test_opt3.py` 依赖交付目录里没有的 `raw/...voice.txt` | **已修好** | 交付目录没有 `raw/`，`test_opt3.py:29-30` 文件不存在就当空表；G,E,R 402 项、L,T 184 项、S 82 项全部正常跑完 |
| P5 乱点仍能拿星，只是慢了（说明） | **按委托方决定处理，当前无痕迹** | 委托方先加"一局错 3 题不算星"又撤回；现在的构建和加之前逐字节相同，星星每道题各算各的（第 1 节、第 4 节第 1 项）。防乱点仍靠 5 个选项和一题两问，这是委托方自己选的上限，不扣分 |
| P6 一题两问的小圆点太小（18 px） | **已修好** | `Two.pips`（`index.html:4035-4044`）：当前这一问 30 px，第二问开始时脉动两下。实测 Q2 L2、Y2 L2 三种尺寸：`style.width = 30px`，1180 宽时屏上 35 px、第二问一开始就有 1 个动画在跑，脉动中量到 46 px；1024 宽时 30 → 41 px。截图 `shots/Q2_L2_L_ask2.png`、`Y2_L2_P_ask2.png` 上黄色大圆点很显眼，"还有一个！"照旧 |

第 1 轮之后的其他改动：

- **收尾语**：`AGAIN = ['再来一题！', '下一题来啦！', '再来一个！']`（`index.html:2550`），在 `runQ` 答错讲解之后说（`:2296`）。112 个游戏 × 2 个种子的 448 次答错全部落在这三句里，没有"再试一次"。
- **平台错误**：`platformRejection`（`index.html:2663-2678`）+ `unhandledrejection` 处理（`:2679-2686`）只把游戏自己的 Error 交给 `Session.crash`；`SWU.watch` 自己接住 `reg.update()` 的失败（`:3517`）。`test_rejections` 27 项全过，控制组（游戏自己的 Error）仍结束题目。
- **点一下跳过**：见 P2。`fastForward` 在 `explain` 阶段可用（`:2425`），点击落在 `#ff` 层上。

## 3. 问题（按严重程度）

没有发现需要修的问题。以下是说明，不扣分：

1. **（说明）一局最多 5 轮，错 3 道的那一局最多只能拿 2 颗星** —— 这是原有的"一局 = 5 轮、答错的题也算一轮"（`DESIGN.md` §5.3，`Session.round`），不是规则三的残留：那 2 颗星照记、下一局接着从托盘第 3 格开始。我第一版脚本按"错 4 道再对 5 道"写，结果一局在第 5 轮就正常收尾了（1 颗星照记），改成两局后 14 个游戏全过。写在这里是给以后的评审省一次误判。
2. **（说明）收尾语的轮换从"下一题来啦！"开始**：`AGAIN[(G.again = (G.again || 0) + 1) % 3]` 让每局第一次答错总说"下一题来啦！"，第三次才轮到"再来一题！"。三句意思一样，无需改。
3. **（说明）就事论事的反馈里有"形状不对哦 / 方向不对哦 / 个数不对哦 / 大小不对哦"**（G4、Y2、Y4、W3、U4、K4、L4，种子 5 出现、种子 9 没出现）。这是第 2 轮以前就有的、针对属性的陈述，不是"你错了"，符合铁则；我的第一轮脚本把它误标成了 BAD，`again_run.txt` 里的 8 条 FAIL 全是这个原因加上我对"三句都要出现"的错误预期，`again_run9.txt`（修正后）116 项全过。
4. **（说明）旧的测试警告照旧**：`test_explain` gen 部分 C3 L1 "对的数多为五个里最小的"（1 warn，和第 1 轮相同）；`test_generators` B3 L1–L3 BORDERLINE 三条（更早就有）。
5. **（说明，和 app 无关）** `test_v2r1` 在本机和别的套件并行时超过 5 分钟（单跑 10 项全过，约 10 分钟）；`test_stars` 在 `timeout` 包装下有一次退出码 127、没打 SUMMARY，重跑 347 项全过。都是机器 / 环境的事。另外家长面板里"不算'听数取物'"是看图模式的旧说明文字，与星星无关。

## 4. 抽查了什么

**先确认构建**：`md5sum` 对比 `git show 096c54c:` 的 `index.html`、`v2games.js`、`w3games.js`、`w4games.js`、`sw.js`、`assets/voice/bank.json`，六个全部相同；`git diff --stat 096c54c HEAD` 只剩 `DELIVERY.md`、`OPTIONS-EXPLAIN-SPEC.md`、`REVIEW-OX2-TASK.md` 和 `test_explain.py` 的 B1 读选项竞态修正；全目录（html / js / py / md）搜 ledger、再来一局、voidrule、guessable、not credited、不算星：只有文档里关于撤回的记录。

**交付的测试（本机 Chromium，输出在 `tests/logs/ox2_*.txt`）**：

| 套件 | 结果 |
|---|---|
| `test_explain.py` gen / explain / layout（第一、二世界） | 411（1 warn，旧）/ 229 / 685 pass |
| `test_opt3.py 3` G,E,R / L,T / S（云上、运算岛、复习题） | 402 / 184 / 82 pass |
| `test_w4.py chromium 3`（星空，全量含进度）+ `W4_TIMING=1` 分两半 | 812 pass；含计时 456 + 442 pass |
| `time_explain.py` W1 全部 L5 / W2 全部 L5 | 49 / 57 pass，最长 5.2 s |
| `test_rejections.py` | 27 pass |
| `test_stars.py` | 347 pass |
| `test_boot.py chromium` | 12 pass，首屏 442.1 KB / 450 KB |
| `test_offline.py chromium` | 20 pass |
| `test_v2` / `test_v2r1` / `v2r2` / `v2r3` | 19 / 10 / 6 / 12 pass |
| `test_w2 chromium` / `test_w3 chromium 3` | 189 / 500 pass |
| `test_generators` / `spotcheck 4242` / `r11_check` / `depth_audit` | 725（3 warn，旧）/ 56 / 37 / 182 pass |

没跑任务说明里列为已知旧问题的 `test_flow`、`test_hints`、`test_real_input`、`test_consistency`。

**自己的实验（脚本和日志在 `tests/logs/ox2/`）**：

1. `ox2_stars3.py`（`stars3.log`，43 pass + 1 条是家长面板旧文字的误报）：P1、B1、H1、Q1、J2、Y2、E1、U4、T1、Z1、F1、M3、I2、O2 各两局：第一局错、错、错、对、对 → 存档 2 颗星、游戏没打勾、下一个没开；第二局错、错、对、对、对 → 每次答对 `G.stars`、`gstars`、托盘亮的格数同步加一，没有一格是灰的（opacity / filter 检查），第 5 颗"集满啦！"、回地图、`gameDone` 为真、下一个游戏开。全程 Voice 钩子里没有"再来一局"、没有"错"。另外列出 `Store.s`、两个世界的 `ws`、`Mem.today()` 的全部键，没有像账本的字段；`Parent.open()` 后面板全文里没有"未计 / 作废 / 不计"。
2. `ox2_again.py`（`again_run.txt` 种子 5、`again_run9.txt` 种子 9）：四个世界 + 运算岛 112 个游戏，每个两次答错，钩住 `Voice.say`、`K.ring`、`Actor.cheer`、`Sfx.correct`：收尾语 224 + 224 次全在三句之内；反馈 / 讲解 / 收尾里说的每一句都 `Bank.has`；没有超过 8 个字的句子；没有"错 / 真棒 / 太棒 / 厉害 / 再试一次"；圈的颜色只有 ink、`#4F7BFF`（蓝）、`#FFC93C`（金）；讲解期间 cheer 0、答对音 0；两次答错后的题都是新 key、同 kind、`retest`。
3. `ox2_skip.py`（`skip_w3.log`、`skip_w4.log`，33 pass）：`window.__fast = 0` 真实速度，每项两遍：不碰测讲解时长，再 `page.mouse.click(590, 430)` 在 0.4 秒点一下测多久结束。云上 U4(L2,L4)、R4、K4、E4、S4、T1、L4、K2、R3；运算岛 Z1–Z4；复习题 P2 cmp10 / add10 / part10 / ten20 / F+3+4；星空 F1、F4、I1 L5、I4 L4、M3、M4、N1、N4、O2、O4、F8、I8。不碰 2.9–5.3 s，点一下 0.91–1.39 s。
4. `ox2_shots.py`（`shots/`，79 张，`shots_L/P/S.log`）：横屏 1180×820、竖屏 820×1180、1024×768 各一遍，真实速度：B1、Q2、Y2（一题两问，含第二问的圆点测量）、J2、X2、U4、K4、Z1 L3、P2 cmp10、F1、M3、N4 的选项画面和讲解中途（金圈出现后 0.5 s）。逐张看过的：U4 竖屏 3 + 2 两行、他选的卡和对的卡上不一样的格子都圈蓝、金圈在对的卡上；K4 1024×768 一行五张卡 ≥ 120 px、金圈 + 蓝圈；J2 竖屏五个机器人 3 + 2；Z1 1024×768 两组 = / ≠；F1 两张鳄鱼嘴、金圈在第一问的答案上；X2 竖屏 1–10 十朵云；M3 见 P3。没有一处选项挡住回家、主持人、星托盘、题目条或角色。
5. 代码对读：`Session.round` / `runQ` / `reward` / `fullTray` / `finish`（`index.html:2207-2366, 2448-2477`）：星只在 `res === 'ok' && !helped(st)` 时 `reward`，答错直接 `return 'wrong'` 进下一轮，没有任何按局结算的分支；`cheerAll` 在 `st.explaining` 时直接返回（`:8204`）。

## 5. 分数

SCORE: 10/10

## 6. 结论

VERDICT: APPROVE
