## 维度 1：幼儿教学法

结论：已经有真实的取放、配对、重排和遮挡活动，认知主线基本成立。但若干关卡仍把复述答案、固定动作或简单补空当成更高阶理解，掌握门尚不可靠。

R2 核对：J01-a 的持久化、J01-b 的补测、J02 的辅助标记、G03 的 P3 教学题排除、R2-J03 的同型复测均已修复；G07 的配对输入、G09/G10/G12 的初始化与序数、G11/G13 的 H4 流程及 A2 吹哨、G14 的变化量同步也有代码和日志支持。G16–G21、G23 所指旧问题已有实现；G05、G22 仍未完全闭环，见下文。（证据：[掌握记录](D:/ClaudeCode/kidmath3/review/R3/index.html:1595)、[补测与复测](D:/ClaudeCode/kidmath3/review/R3/index.html:1873)、[Chromium 汇总](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_summary_chromium.txt)、[WebKit 汇总](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_summary_webkit.txt)）

- [严重] R3-J01 **H3 可以始终“送一个、选一”，却通过分拆掌握门。** 孩子自行决定进洞数量，答案直接设为该数量；门槛只要求七题中六题正确及出现过 `selfsplit`，不要求不同分法、不同部分或迁移。本次对原掌握函数的内存核验确认：七条相同类型的正确记录即可使 H3 单关 `ok:true`。这只能证明认得“一”，不能证明理解部分与整体。（证据：[进洞与答案](D:/ClaudeCode/kidmath3/review/R3/index.html:4764)、[单关门槛](D:/ClaudeCode/kidmath3/review/R3/index.html:1643)）→ 建议：自由分拆保留为探索；掌握题另要求多种分法，并交替询问里面、外面和整体，记录实际数量组合。

- [严重] R3-J02 **A4、V1 仍可靠复述或抄答案取得“接着数”证据。** A4 L1–L2 吊猫时直接报到最终总数，随后询问总数；V1 所有等级都会给新英雄显示累计数量角标，最后角标与答案卡至少重叠约 720ms。它们没有像修复后的 P3 一样排除教学题证据，掌握门也不要求通过无答案提示的等级。（证据：[A4 报数后提问](D:/ClaudeCode/kidmath3/review/R3/index.html:5560)、[V1 角标与出卡时序](D:/ClaudeCode/kidmath3/review/R3/index.html:6231)、[证据过滤](D:/ClaudeCode/kidmath3/review/R3/index.html:1600)）→ 建议：报数教学与独立评估分开；评估前不播、不显示结果，必须取得新的独立接着数证据。

- [严重] R3-J03 **X4 求隐藏部分时，没有先建立可靠的整体。** 总数随题变化，但任务卡始终画三个小悟空；代码没有先告知或让孩子确认整体数量。全部分身出现后仅停留约 700ms，部分分身还挤在相邻位置，随后被遮走。孩子需要先完成短时视觉记忆，才能进入本应考查的部分整体推理。（证据：[X4 题面及遮挡](D:/ClaudeCode/kidmath3/review/R3/index.html:6052)、`index.html:6082–6114`；截图 `L_X4_L2_ready.png`）→ 建议：先让孩子逐个确认整体，再由孩子启动遮挡；保留整体的可理解表示，避免把视觉记忆失败误判成数学失败。

- [中等] R3-J04／G22 **V3 仍只评估“填满十”，没有评估亲手分解与剩余部分。** 正确答案固定为 `10-a`；提交后已经记录掌握，剩余部分由系统确定，孩子只需触发搬运，四秒不动也会自动完成。生成器仍允许候选段长超过原条长度，进一步削弱题目的数学真实性。（证据：[V3 答案定义](D:/ClaudeCode/kidmath3/review/R3/index.html:6475)、[作答后的自动搬运](D:/ClaudeCode/kidmath3/review/R3/index.html:6530)、`tests/logs/r3_generators_chromium.txt` 的四条 WARN）→ 建议：让孩子在原条上选切分位置、分别安放两部分，再确认剩余或总数；候选长度不得超过原条。

## 维度 2：三岁半可用性

结论：主要操作目标、成人门和点按兜底明显改善，但“无声也能独立学习”和“旋转、切后台后仍能继续原任务”尚不成立。

R2 核对：U01 的雨靴拥挤及 HUD 间距、U02/D06 的点按兜底、U05 成人门、D07 示范接管已修；U04 的计时漂移已修，但完成上限仍有问题。U03、V02/D08 只部分闭环。（证据：[输入兜底](D:/ClaudeCode/kidmath3/review/R3/index.html:1208)、[示范接管](D:/ClaudeCode/kidmath3/review/R3/index.html:2102)、[成人门日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_gates_webkit.txt)）

- [严重] R3-U01 **完全没有语音引擎时，正常学习路径无法解锁第三个世界。** P4 的 `giveN` 在失声时强制 `noEvidence`，而佩奇通关必须取得 `giveN`；葫芦娃又依赖佩奇通过。本次原函数核验中，即使四关全部答对，P4 证据仍为零。无语音测试只测每个世界第一关，并通过 `__go(...,1)` 直接解锁，绕过了这个阻断。（证据：[P4 无声分支](D:/ClaudeCode/kidmath3/review/R3/index.html:3672)、[解锁依赖](D:/ClaudeCode/kidmath3/review/R3/index.html:411)、[无语音测试](D:/ClaudeCode/kidmath3/review/R3/tests/test_nospeech.py:38)、`index.html:2870`）→ 建议：提供明确的无声学习与证据路径，分别记录听数取物和视觉数量构造能力；增加从新存档自然解锁的无语音测试。

- [中等] R3-U02／G05／U03 **部分无声任务仍要求先认识符号。** H1 目标旗默认只显示数字，滑过葫芦的序数解释仅靠声音；B1 示例中的“一样多”按钮仍是等号，与实际四点按钮不一致，回应中的“不再出现等号”并未实现。（证据：[旗帜表示](D:/ClaudeCode/kidmath3/review/R3/index.html:1441)、[H1 提示](D:/ClaudeCode/kidmath3/review/R3/index.html:4481)、[B1 示例与实际按钮](D:/ClaudeCode/kidmath3/review/R3/index.html:3786)）→ 建议：序数用起点、逐个经过和目标位置示范表达；示例按钮必须与实际按钮同形，并在当前操作物上演示。

- [中等] R3-U03／V02 **旋转后画面变了，手势参数没有变。** X1 注册时固定拉伸轴和单位，横转竖后仍按旧横轴处理；B4 旋转罐子的圆心同样只在注册时计算。孩子看到竖棒却要横拉，或围着新罐子转却无法正确触发。（证据：[X1 注册](D:/ClaudeCode/kidmath3/review/R3/index.html:5711)、`index.html:5670`；[B4 注册](D:/ClaudeCode/kidmath3/review/R3/index.html:4353)、[输入计算](D:/ClaudeCode/kidmath3/review/R3/index.html:1136)）→ 建议：重排时同步更新手势轴、单位和圆心；旋转后必须用新的自然手势完成题目。

- [中等] R3-U04／D08 **后台只暂停了提示时钟，没有暂停数学演示。** `Scope.wait/timeout` 使用原生计时器，动画也未统一暂停；可见性处理只停止 `Clock`、中断手势和挂起音频。因此 X4 遮挡、H4 拿走等关键过程没有完整的暂停恢复协议。（证据：[后台处理](D:/ClaudeCode/kidmath3/review/R3/index.html:736)、[作用域计时](D:/ClaudeCode/kidmath3/review/R3/index.html:342)、[后台测试只检查提示阶梯](D:/ClaudeCode/kidmath3/review/R3/tests/test_hints.py:78)）→ 建议：暂停题目演示时间线，或回前台重演关键过程并标记辅助；分别在展示、移动、遮挡中切后台验收。

- [中等] R3-U05／U04 **救援不再漂移，但仍可能超过幼儿注意力窗口。** 第一步在 25 秒，此后每十秒一步；需要五次分配加一次提交的题，单是等代做就到约 75 秒。测试只证明 H1 最终结束，没有证明所有关卡满足每题不超过 40 秒。（证据：[救援调度](D:/ClaudeCode/kidmath3/review/R3/index.html:2140)、[无人操作测试范围](D:/ClaudeCode/kidmath3/review/R3/tests/test_hints.py:90)、[任务书](D:/ClaudeCode/kidmath3/review/R3/docs/TASK.md:306)）→ 建议：设置题目总时限；孩子持续不操作时转为短而完整的示范或温和结束，避免逐步等待一分钟以上。

## 维度 3：视觉品质

结论：入口、地图和场景已经有产品完成度，横竖屏也经过专门布局；但数量表达和揭晓层仍有明确错误，同画师一致性尚未达到。

R2 核对：V03-a 的蜡烛分离、V03-b 的通用点阵几何已修；V02 的原静态裁切问题明显改善，但不能关闭全部动态布局。V01/D01 的素材体积感差异按开发方决定单列。（证据：[蜡烛排位](D:/ClaudeCode/kidmath3/review/R3/index.html:3650)、[点阵测试日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_dots_chromium.txt)）

- [中等] R3-V01 **P4 竖屏揭晓直接覆盖任务卡。** 大数字“5”压住顶部任务条，两颗白色点阵也落在卡内；这不是拼版缩小造成的，原图同样如此。代码把点阵固定飞到 `y=150…`，没有避让竖屏任务卡。（证据：[原始截图](D:/ClaudeCode/kidmath3/review/R3/shots/R3/raw/P_P4_L2_reveal.png)、[固定坐标](D:/ClaudeCode/kidmath3/review/R3/index.html:3730)）→ 建议：为揭晓预留独立区域，或揭晓时收起已完成的任务卡；验收实际动画中间帧。

- [中等] R3-V02 **部分数量图示没有忠实表达全部单位。** V1 飞机里可以有六、七位英雄，但展开时最多画五个头像，再附总数；V4 的成捆水晶以 40px 图片配 16/20px 间距，放入容器后不同捆又只相隔 28px，单位被遮叠。这些不受通用点阵测试保护。（证据：[V1 截断头像](D:/ClaudeCode/kidmath3/review/R3/index.html:6252)、[V4 水晶排布](D:/ClaudeCode/kidmath3/review/R3/index.html:6625)）→ 建议：完整展示每个单位；十个一组使用清楚的十格或可展开容器，揭晓时保证每个单位都能独立辨认。

## 维度 4：代码质量

结论：作用域取消、一次提交和异常恢复比 R2 扎实，但异常结果与掌握记录尚不一致，测试也不能支撑所有“全绿”推论。本次确认 HTML 哈希与汇总一致；没有重跑整套浏览器测试，额外核验采用快照原函数的内存内执行。

R2 核对：C01、C02-a、C02-b、C03 的所指旧问题已有修复；C05 的初始化和作答前异常修复成立，作答后异常仍有遗漏；C04 仅部分关闭。（证据：[取消契约](D:/ClaudeCode/kidmath3/review/R3/index.html:327)、[快进](D:/ClaudeCode/kidmath3/review/R3/index.html:2022)、[结束与清理](D:/ClaudeCode/kidmath3/review/R3/index.html:2049)）

- [中等] R3-C01／C05 **揭晓失败的题仍然计入掌握，甚至可能已经触发解锁。** `Mastery.record()` 在 `reveal()` 前执行；后续异常虽然返回 `error`，却没有撤销记录。本次向原 `runQ()` 的揭晓注入异常，结果为 `error`，但 `mastery` 和该技能正确次数均已加一。现有故障注入都发生在作答前。（证据：[记录与异常路径](D:/ClaudeCode/kidmath3/review/R3/index.html:1917)、[故障测试](D:/ClaudeCode/kidmath3/review/R3/tests/test_faults.py:64)）→ 建议：把本题记录作为事务，在有效结束时提交；覆盖揭晓、纠错、收尾异常及解锁边界。

- [严重] R3-C02／C04 **修正后的“猜题孩子”模型预先假定构造题必错，无法证明构造题抗投机。** 测试明确把没有选项的题交给 `wrong` 驱动；这排除了固定放一个、照图复制、复述最后报数等真实策略。固定策略和正向解锁又主要只覆盖佩奇、Bluey，不能外推世界 3–6。（证据：[猜题模型](D:/ClaudeCode/kidmath3/review/R3/tests/test_pedagogy.py:26)、`test_pedagogy.py:94、139`）→ 建议：保留此次 B4 测试建模修正，但补上不读取正确答案的具体行为策略，覆盖全部六世界、跨次保存和自然解锁。

- [中等] R3-C03／C04 **真实输入、旋转测试的证明范围被扩大描述了。** WebKit 明确跳过正常时序错误路径；揭晓旋转默认每世界只选一关，而且检查的是下一题，未检查正在揭晓的画面。真实输入仍由应用自己的 `__next/__physical` 提供正确动作，再读取自身 `st.ok`，能证明输入接通，不能独立证明数学正确。（证据：[错误路径引擎限制](D:/ClaudeCode/kidmath3/review/R3/tests/test_real_input.py:570)、[揭晓旋转实际检查](D:/ClaudeCode/kidmath3/review/R3/tests/test_rotate.py:522)、`test_rotate.py:605`、[同源驱动](D:/ClaudeCode/kidmath3/review/R3/tests/test_real_input.py:8)）→ 建议：补 WebKit 常速错误路径、24 关揭晓中间态、旋转后的自然手势；另用独立预期验证数量、语音与画面一致。

- [中等] R3-C04 **一键“门禁”会在子测试失败后返回成功。** 脚本保存了各专项退出码，但不汇总失败状态，最后执行 `cat`；正常输出汇总后，脚本退出码仍可为零。（证据：[run_all.sh](D:/ClaudeCode/kidmath3/review/R3/tests/run_all.sh:13)）→ 建议：累积非零退出码，缺少 SUMMARY 也判失败，最终明确返回失败状态；为已批准的环境 WARN 单独设规则。

## 维度 5：性能

结论：入口资源延迟加载及动画清理有实质进展；同哈希的 Chromium soak 重跑可采信为受测资源没有持续累加的证据，不能进一步证明真机帧率、温度或完整更新安全。

R2 核对：F03 的直升机循环、孤儿动画及资源统计问题可关闭；F01 的实现优化成立，预算验收仍不完整；F02 的安装失败与 503 回退已修，但版本一致性仍有缺口。（证据：[soak 重跑日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_soak15_rerun_chromium.txt)、[离线日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_offline_chromium.txt)）

- [中等] R3-F01 **首屏预算测试排除了最大的首屏文件，时间阈值也放宽了。** 450KiB 断言不计约 448KiB 的 HTML；实际本地响应合计约 708KiB，含压缩 HTML 的约 382KiB 只是估算。可交互门槛设为 2500ms，而任务书要求小于一秒。这不证明线上一定超预算，但不足以宣布预算通过。（证据：[预算与时间阈值](D:/ClaudeCode/kidmath3/review/R3/tests/test_boot.py:19)、[首屏请求日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_boot_chromium.txt)）→ 建议：按真实传输字节统计全部首屏响应，验证实际压缩响应头；将验收阈值与任务书一致，区分本地性能和目标设备冷启动。

- [中等] R3-F02／F02 **更新安装失败时，旧 worker 仍可能接收并缓存新 HTML。** `networkFirst()` 不等待新版本安装完成，直接把服务器新页面写进当前核心缓存；素材却仍从旧版本缓存返回。因此“新页面需要新素材、该素材下载失败”仍可形成混合版本。当前断更测试只替换 SW 和一个素材，没有同时替换 HTML。（证据：[页面更新路径](D:/ClaudeCode/kidmath3/review/R3/sw.js:76)、[素材路径](D:/ClaudeCode/kidmath3/review/R3/sw.js:87)、[断更测试](D:/ClaudeCode/kidmath3/review/R3/tests/test_offline.py:121)）→ 建议：将应用壳与素材绑定为同一发布版本，完整安装后整体切换；测试新 HTML、新素材同时变化且下载中断后的在线、离线重载。

## 维度 6：iOS/WebKit 军规

结论：十条中的大部分机制已经补齐，R2 的 I01、I02、I04 旧缺陷有对应修复；③、⑦、⑨仍因事件误判不能判通过，真实 iPad 实效另列待验。

| 条目 | 本轮核对 |
|---|---|
| ① 入口同步 speak | 代码和调用时序日志通过；入口前不再 cancel。 |
| ② cancel 后 ≥150ms | 统一取消入口已实现，两引擎 stress/voice 日志支持关闭 I01。 |
| ③ 状态轮询与超时 | 超时、忙碌恢复已实现；仍把事件当成功证据，未通过。 |
| ④ speak 前及可见性 resume | 已实现。 |
| ⑤ WebAudio 与无声媒体会话 | 创建、恢复、首帧、媒体播放及失败诊断已实现，I02 代码层关闭；真机待验。 |
| ⑥ 中文声音与晚到补说 | 选声、引用保留、补说愿望及重试已实现。 |
| ⑦ 补说节流 | 1.5 秒条件、忙碌检查、上下文代次已修；首句确认仍受事件误判影响。 |
| ⑧ 快速连点只保留有效新请求 | 所属题目校验、过期淘汰和二十连点日志支持代码层通过。 |
| ⑨ 失声提示与诊断 | 大喇叭、头像脉动及家长诊断已实现；失声判定仍有漏洞。 |
| ⑩ 独立计数与看门狗 | 序号、归属、保护回退、看门狗已实现；Chromium 注入有证明力，WebKit 无 AudioContext 不能证明 MP3 实播。 |

证据：[语音实现](D:/ClaudeCode/kidmath3/review/R3/index.html:710)、[计数通道](D:/ClaudeCode/kidmath3/review/R3/index.html:986)、[Chromium 语音日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_voice_chromium.txt)、[WebKit 语音日志](D:/ClaudeCode/kidmath3/review/R3/tests/logs/r3_voice_webkit.txt)。

- [严重] R3-I01／I03／I05 **失声检测仍然信任 `onstart/onend`，违背状态确认要求。** `onstart` 直接设置已听见和首句确认；即使从未观察到 `speaking/pending`，只要收到持续超过 250ms 的 `onend`，也会清零失败计数、隐藏失声提示。本次原函数核验确认了这一误判；静默引擎测试完全不发事件，因此没有覆盖它。（证据：[事件处理与成功判定](D:/ClaudeCode/kidmath3/review/R3/index.html:849)、[静默注入](D:/ClaudeCode/kidmath3/review/R3/tests/test_voice.py:174)）→ 建议：把事件作为流程信号，成功确认仅来自所属请求期间观察到的引擎状态或家长主动确认；增加“事件照发、状态始终静默”的故障测试。

## 维度 7：设计品味与惊喜细节

结论：岛屿品牌、生活场景和持续留下的小礼物，让它超过普通网页练习册；但角色关系、信息层次和等待节奏仍有明显工程实现痕迹，尚不到编辑推荐级。

§3.10 逐项核对：

| 要求组 | 结论 |
|---|---|
| 视觉语言 | 公共颜色、圆角、阴影、缓动已建立；品牌明确；同画师一致性未达成。禁滚动等有代码，白闪、字体回退、加载跳变未充分证明；数学表征仍有 V01/V02 问题。 |
| 动效 | 配对、重排、迁移有解释作用；转场和奖励飞回已实现。统一时长未达标，60fps 未证明。 |
| 声音 | 音色家族、正确/完成区别、环境声及 ducking 已实现；语音和音效轮换关闭 R2-D03。跨十音阶仍有下述问题，实际听感与静音实效待验。 |
| 角色 | 呼吸、眨眼、不同反应已有；长等待时的哈欠/招手未证明。`lookAt` 已接入，关闭“从未调用”的旧问题，但角色互动仍偏通用。 |
| 惊喜 | 小鸟、连胜、第 3/5/10 次变化及终场合影已有；礼物与地图装饰可保留。第五次列队及跨题注意力控制仍不完整。 |
| 触控 | 按压、松手、拖放、点按兜底和示范接管有实现；小于 50ms 的实测未证明。无声目标、旋转手势及单一焦点仍有缺陷。 |
| 节奏与结束 | 跑动等待画面、自动下一题、奖励回地图、固定退出入口已实现；R2 节末快进缺陷已修。首屏一秒及自然等待节奏仍未完全验收。 |
| 稳健 | 静态横竖屏、Chromium 离线及资源清理有证据；旋转、后台、混合版本问题未闭环，真机十五分钟温度/帧率待验。 |

- [中等] R3-D01／D04／D05 **“伙伴关系”和第五次列队仍主要停留在命名。** `lineup()` 只是按横坐标排序后依次倾身、跳动，并没有移动成队列；`lookAt()` 是整张角色图倾斜，庆祝仍以通用跳动为主。第三次礼物和第十次帽子可以关闭，不能据此关闭全部角色互动承诺。（证据：[角色看向动作](D:/ClaudeCode/kidmath3/review/R3/index.html:1321)、[第五次欢迎](D:/ClaudeCode/kidmath3/review/R3/index.html:2677)）→ 建议：为少量核心同框角色制作真正的列队、递物、互相回应动作，让变化发生在角色关系中。

- [中等] R3-D02／D02 **可快进不等于默认节奏合适，彩蛋也未完全隔离思考阶段。** P4 揭晓除逐根计数外固定等待 2.3 秒歌曲，五根蜡烛的揭晓约需 5.7 秒，之后还有通用赞许；小鸟动画另用不归题目作用域的 4.2 秒动画，快进可使它延续到下一题。（证据：[P4 揭晓](D:/ClaudeCode/kidmath3/review/R3/index.html:3719)、[小鸟动画](D:/ClaudeCode/kidmath3/review/R3/index.html:2011)）→ 建议：保留必要的数学展示，缩短纯庆祝等待；所有彩蛋绑定阶段，进入新题思考时结束或撤去。

- [轻微] R3-D03 **跨十时计数音高突然下降。** `count(10)` 为 1760Hz，`count(11)` 回到约 785Hz，不符合逐级上升的声音规则。（证据：[Sfx.count](D:/ClaudeCode/kidmath3/review/R3/index.html:597)）→ 建议：提供完整的 1–20 上行音阶，或明确设计十位与个位分组音色。

**开发方已决策的未关闭项（单列）**

1. **IP 使用与下架**：按委托方素材要求执行的决定成立；不作为本轮技术缺陷。
2. **真机音频、媒体会话、离线启动等**：可以按 M4 保留，但清单尚未回填；不能解释本轮已从代码确认的语音、后台缺陷。
3. **道具与角色体积感差异**：继续保留视觉扣分。“不可改画角色”不妨碍调整新生成道具，因此只能解释延期，不能认定达到同画师标准。
4. **钢铁侠面罩替代**：推进器与升空替代在约束下合理，代码已有实现。
5. **保留 24 个语音对象**：引用数量有上限，接受该兼容性选择；但不等于只保留“上一局”，回应提到的 96 局稳定探测未附日志，本轮只能采信所附十五分钟结果。

依据：[开发方决定](D:/ClaudeCode/kidmath3/review/R3/docs/RESPONSE-R2.md:127)、[真机清单](D:/ClaudeCode/kidmath3/review/R3/docs/IPAD-CHECKLIST.md)、[语音引用上限](D:/ClaudeCode/kidmath3/review/R3/index.html:809)。

SCORE: 6/10 — 完整度和工程质量显著进步，但掌握证据、无声解锁和关键状态恢复仍不足以支撑幼儿独立学习。

离下一分最关键的三件事：
1. 重做 H3、A4、V1、X4、V3 的独立掌握证据，阻断固定动作、复述和抄答案路径。
2. 打通自然无声解锁，修复旋转手势、后台演示及语音误判，并用完整用户路径验证。
3. 让门禁真正能否决失败，补齐独立数学预期与揭晓中间态检查，消除数量图示和遮挡错误。

VERDICT: REJECT