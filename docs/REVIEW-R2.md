## 维度 1：幼儿教学法

结论：已经有取物、配对、遮挡、重排等数感活动，但“完成游戏”与“真正掌握”的证据链仍不可靠。R1 的 G01、G02、G04、G06、G08、G15 所指旧问题已有对应代码修正；其余未闭环项及新问题如下。

- [严重] J01-a **重新打开应用会丢失分技能掌握记录。** `Mastery.record()` 保存 `{g,ok}` 窗口及 `g`、`log`；`Store.validate()` 却将窗口按 0/1 数组过滤，并完全不恢复 `g`、`log`。于是历史总分还在，四关的独立证据消失，跨次学习无法正常累计。（证据：[存储校验](D:/ClaudeCode/kidmath3/review/R2/index.html:401)、[掌握记录与门槛](D:/ClaudeCode/kidmath3/review/R2/index.html:1361)）→ 建议：统一持久化结构，校验并恢复技能、题型及辅助记录；增加“玩两关→重载→玩另两关→解锁”的测试。

- [严重] J01-b **提高难度可能让必需证据永远无法取得。** 门槛要求 P1 的 `sub`、B2 的 `match`，但这两关 L3 分别只出 `chunk`、`remember`；家长把最低等级设为 L3 后，没有补测低阶技能的路径。（证据：[必需题型](D:/ClaudeCode/kidmath3/review/R2/index.html:1350)、[P1](D:/ClaudeCode/kidmath3/review/R2/index.html:2536)、[B2](D:/ClaudeCode/kidmath3/review/R2/index.html:3305)、[最低等级设置](D:/ClaudeCode/kidmath3/review/R2/index.html:2191)）→ 建议：将技能补测与练习难度分开，缺少关键证据时主动安排对应题型，不能要求孩子先故意答错降级。

- [严重] J02 **“用过帮助不计掌握”没有完整实现。** `act` 阶段的重听、指向正确目标、系统代做均不设置 `hinted`；但 H3 的亲手分拆等数学操作就在该阶段。大小袋、语义袋已增加，但不能弥补把辅助操作记成独立证据的问题，固定策略专项也尚无结果。（证据：[重听](D:/ClaudeCode/kidmath3/review/R2/index.html:1713)、[提示与代做](D:/ClaudeCode/kidmath3/review/R2/index.html:1805)、[证据过滤](D:/ClaudeCode/kidmath3/review/R2/index.html:1366)）→ 建议：凡提示透露目标或系统改变数学状态，立即标记本题受辅助；再做固定位置、固定语义、随机策略和跨次复测验收。

- [严重] G03 **P3 的低阶“基数掌握”仍可能只是复述最后一个数。** L2 起不报数、取消提前接着数，确实修正了部分旧问题；但 L1 最后一次收纳会报数并显示大数字，随后立即询问总数，且这类正确答案可以满足 `card` 门槛。回应承诺的“提问前重排”实际发生在作答后的翻转中。（证据：[收纳与提问](D:/ClaudeCode/kidmath3/review/R2/index.html:2900)、[作答后重排](D:/ClaudeCode/kidmath3/review/R2/index.html:2945)、[题型证据](D:/ClaudeCode/kidmath3/review/R2/index.html:1373)）→ 建议：保留报数教学，但掌握判定必须增加无答案播报、改变排列或材料后的独立基数题。

- [中等] R2-J03 **答错后的“复测”不保证测同一种理解。** `round()` 只传 `retest`，没有保留错误题的 `kind`；下一题重新抽题型，可能从“拿走”跳到“不变”，没有验证刚才的误解是否纠正。（证据：[抽题](D:/ClaudeCode/kidmath3/review/R2/index.html:1573)、[错题循环](D:/ClaudeCode/kidmath3/review/R2/index.html:1589)）→ 建议：保持技能与错误类型，改变数量、位置或材料，完成同类新题后再回到混合题。

- [中等] G05 **B1 去掉了高矮暗示，但无声目标仍表达不清。** 任务卡把“找多／找少”的配对图连接到等号和“一样多”，容易被理解为“把两边变成一样多”；不能证明孩子知道当前应选多、少还是相等。（证据：[任务卡](D:/ClaudeCode/kidmath3/review/R2/index.html:3247)、截图 `L_bluey_B1_L2_reveal`、`P_bluey_B1_L1_reveal`）→ 建议：三种目标分别做可观察的示范，最后停在对应选择动作上，避免共用一条以“相等”收尾的流程。

- [严重] G07／U02 **B3 所谓“亲手配对纠错”实际无法操作。** 纠错进入 `pairing` 后，统一输入入口拒绝该阶段；`pairWait` 没有任何输入调用者，只能每对等待四秒超时。三至六对就是至少 12–24 秒被动观看，该阶段还不接受快进。三类比例和纠错结论虽已改正，手做数学仍未闭环。（证据：[纠错实现](D:/ClaudeCode/kidmath3/review/R2/index.html:3579)、[阶段限制](D:/ClaudeCode/kidmath3/review/R2/index.html:1841)、[快进限制](D:/ClaudeCode/kidmath3/review/R2/index.html:1706)）→ 建议：接通逐对点按处理，每次真实操作才建立一条对应线；超时辅助必须明确标记，另测正常速度错题路径。

- [严重] G09／G10／G12 **H2、H3、A1 的设计修改不能算已交付。** 随机排列、亲手分拆、剩余部分从一数起已有代码，但相关关卡在呈现阶段就会访问尚未初始化的 `st.map`，见 C05。另 H1 报的是“本次经过了几个葫芦”，不是“从起点算第几个”：直接从第三个开始摸，会先听到“第一”。（证据：[H1 报序数](D:/ClaudeCode/kidmath3/review/R2/index.html:3799)、[H2](D:/ClaudeCode/kidmath3/review/R2/index.html:3902)、[H3](D:/ClaudeCode/kidmath3/review/R2/index.html:4027)、[A1](D:/ClaudeCode/kidmath3/review/R2/index.html:4331)）→ 建议：先修复可运行性；序数按当前对象相对起点的位置播报，并覆盖中途起摸、反向、重复经过。

- [中等] G11／G13 **部分修改只有局部闭环。** H4 已遮住拿走过程并重排剩余物，但其前置亲手分拆 H3 尚不能运行，且没有 H4 流程日志；A2 已区分 Count-All／Count-On，但 L3 起直接自动集合，回应中的“孩子点集合哨”被跳过。（证据：[H4 遮挡](D:/ClaudeCode/kidmath3/review/R2/index.html:4169)、[A2 自动集合](D:/ClaudeCode/kidmath3/review/R2/index.html:4505)）→ 建议：补齐 H3→H4 学习链验证；A2 保留由孩子触发合并的动作，并重新核算操作预算。

- [严重] G14 **A3 的减二题仍会教错。** L4 可以生成 `d=2`，答案按减二计算；提示却固定说“出来一只”，动画也只出来一只狗。结果范围限制已经修正，但数量变化、语言和答案仍不一致。（证据：[生成器](D:/ClaudeCode/kidmath3/review/R2/index.html:4614)、[提示与动画](D:/ClaudeCode/kidmath3/review/R2/index.html:4664)）→ 建议：让变化对象数、任务卡、语音、动画和答案统一由 `d` 驱动，穷举加减一、二的全部分支。

- [中等] G16–G23 **仍未证明闭环，按后续范围保留。** 分别涉及 X1 首答、X2 落点、X3 补数供给、X4 格数、V1 人数与预算、V2 十／二十及题型证据、V3 亲手分解、V4 符号映射；本轮只有设计回应，没有相应实现和运行证据。（证据：[逐项回应](D:/ClaudeCode/kidmath3/review/R2/docs/RESPONSE-R1.md)、`index.html` 的 `GAMES` 定义止于 A4）→ 建议：M2 逐项附生成器与操作证据；本评审不把世界 5、6 未实现单独作为 M1 拒绝理由。

## 维度 2：三岁半可用性

结论：截图中的主要入口和操作物容易辨认，但“完全靠点按、无文字无声音也能独立完成”不成立。U05 的两道加法加输入式键盘已落实，原四选一猜门问题得到修正；成人门专项仍未证明，排查文字隔离问题见第⑨条。

- [严重] U02／D06 **B3、B4 的纯点按兜底在真实触控入口失效。** `Input.up()` 遇到 `stretch` 或 `rotate` 就返回，不会发出 `tap`；而 B3 拉伸区、B4 罐子恰好依赖这个 `tap` 分支实现兜底。测试直接调用 `__gesture`，所以可以通过。（证据：[pointerup](D:/ClaudeCode/kidmath3/review/R2/index.html:993)、[B3](D:/ClaudeCode/kidmath3/review/R2/index.html:3559)、[B4](D:/ClaudeCode/kidmath3/review/R2/index.html:3668)）→ 建议：未发生有效旋转／拉伸时，在松手后派发等价点击；用真实 pointer/touch 事件完成整关验收。

- [中等] U01 **扩大热区没有解决拥挤和重叠。** P2 L3 把七个宽 100 的雨靴目标塞进竖屏宽 540 的凳子区域，公式算出的间距约为 −33；再扩大热区会进一步争抢触点。HUD 的两个按钮间隔也只有 16，未达到任务书的 20。（证据：[凳子尺寸](D:/ClaudeCode/kidmath3/review/R2/index.html:2729)、[雨靴位置](D:/ClaudeCode/kidmath3/review/R2/index.html:2748)、`index.html:136、138`）→ 建议：七双雨靴改为两排或扩大容器；验收实际命中区域的尺寸、间距和重叠，不能只检查元素宽高。

- [严重] U03 **无声任务卡仍依赖尚未学会的数字符号。** P4 默认只用数字“3／4”说明要插几根蜡烛，图标只能解释“蜡烛放蛋糕上”，不能解释数量；截图已经呈现这一问题。P4 的手势提示还演示拖拽，但蜡烛盒注册时没有启用拖拽。（证据：[数字默认呈现](D:/ClaudeCode/kidmath3/review/R2/index.html:1182)、[P4 注册与任务卡](D:/ClaudeCode/kidmath3/review/R2/index.html:3028)、`index.html:3121`、截图 `P_peppa_P4_L1_ready`）→ 建议：早期数量目标始终同时提供可数物／点阵；每个新任务分支都有无声示范，并确保示范动作与真实输入一致。

- [严重] U04 **卡住后的救援越来越慢。** 自动帮助把“空闲时长”写入 `lastAuto`，执行一步又重置 `lastOp`，两者基准不同；即使忽略语音耗时，后续步骤也可能落在约第 25、60、105、160 秒，而不是每十秒一步。150 秒结束检查只发生在轮与轮之间，不能救出一题内长时间停滞的孩子。（证据：[提示计时](D:/ClaudeCode/kidmath3/review/R2/index.html:1799)、[自动操作](D:/ClaudeCode/kidmath3/review/R2/index.html:1809)、[时长检查](D:/ClaudeCode/kidmath3/review/R2/index.html:1528)）→ 建议：使用同一单调时钟记录绝对截止时间，分别管理孩子活动、提示和系统代做；测试完全不操作时的正常速度完成上限。

- [严重] V02／D08 **中途旋转会把提交按钮留在屏幕外。** 按钮只在创建时定位：横屏默认 `x=892`，转为宽 704 的竖屏后，P2、P4、B4 的重排没有重新放置它；任务卡也保留横屏顶部位置。分别启动横屏、竖屏的截图不能证明旋转安全。（证据：[按钮定位](D:/ClaudeCode/kidmath3/review/R2/index.html:2454)、[旋转回调](D:/ClaudeCode/kidmath3/review/R2/index.html:1544)、[P2 重排](D:/ClaudeCode/kidmath3/review/R2/index.html:2737)、[P4 重排](D:/ClaudeCode/kidmath3/review/R2/index.html:3010)）→ 建议：将任务卡、提交按钮及题目元素纳入统一重排；覆盖作答中、拖拽中、翻转中的双向旋转。

## 维度 3：视觉品质

结论：入口、岛屿和生活场景已有明确品牌与吸引力，比通用网页模板完整；但还不能称为“同一位画师”的统一作品。更关键的是，一些美术与排布已经损害数量辨认。

- [严重] V03-a **四根蜡烛被画成难以分辨的重叠组。** `L_peppa_P4_L2_reveal` 中四个火焰集中在两组烛身上，前后蜡烛相互遮挡；代码也使用相同或接近的横坐标、仅约 22 的纵向差。Give-N 的反馈必须让孩子清楚看到每一个单位。（证据：[蜡烛排位](D:/ClaudeCode/kidmath3/review/R2/index.html:3011)、截图 `3_peppa_P3_P4.jpg` 右下）→ 建议：至少在确认与翻转阶段将每根完整分开，逐根对应点亮，避免透视遮挡数量。

- [中等] V03-b **点阵存在裁边和粘连。** P1 的 7、8 选项中，五点行两端被切平、相邻点挤在一起；点阵半径有下限，但边距仍按宽度比例计算，未为半径及描边留足空间。（证据：[点阵计算](D:/ClaudeCode/kidmath3/review/R2/index.html:1156)、截图 `L_peppa_P1_L3_ready`）→ 建议：先由半径、描边、点距计算容器，再布局；逐一检查 1–20 在所有实际卡片尺寸下的完整性。

- [中等] V01／D01 **角色、道具与数学前景仍有拼装感。** 佩奇／乔治较扁平，猪妈妈、雨靴、宝箱和蛋糕有明显不同的体积与高光处理；Bluey 场景里又叠加通用半透明圆角底板、硬边方块和白色任务条。背景精细，但数学操作物没有始终成为第一视觉焦点。（证据：截图 `2_peppa_P1_P2.jpg`、`3_peppa_P3_P4.jpg`、`5_bluey.jpg`）→ 建议：以不可改画的角色为基准统一新增素材的线宽、阴影和饱和度；降低操作区后方细节，把容器设计成场景中的真实物件。

- [中等] V02 **静态布局也尚未全部收好。** P3 横屏两侧角色被画面边缘截断，竖屏生日场景的角色又被蛋糕大面积遮挡；当前截图仅覆盖部分等级，不能外推全部题型都完整。（证据：截图 `L_peppa_P3_L1_ready`、`P_peppa_P4_L1_ready`）→ 建议：为人物和数学操作分别规定安全边界，按最大物件数验收横竖屏，主动安排遮挡层次。

## 维度 4：代码质量

结论：模块划分、作用域、一次提交保护和存储异常捕获已有基础，C03 原有的读写异常容错问题可在代码层关闭。当前主要风险是异步任务失效后仍继续写全局状态，以及测试把异常完成当成成功。

- [严重] C02-a **结束流程退出后仍会继续执行。** `finish()` 等待结束后不检查 `G.dead` 或 `this.G === G`；而 `dispose()` 会主动解除等待。因此离开后仍会记录会话、切换全局页面；若会话已被替换，随后无参数的 `teardown()` 会销毁当前会话。（证据：[结束流程](D:/ClaudeCode/kidmath3/review/R2/index.html:1728)、[dispose 解除等待](D:/ClaudeCode/kidmath3/review/R2/index.html:343)）→ 建议：每个异步恢复点校验所属会话；清理函数接收并校验明确的会话对象，旧任务不得操作当前全局会话。

- [严重] C02-b **B2 的旧题动画取消后仍可能写回界面和语音。** 盖子动画之后没有存活检查，直接删除全局舞台的 `.badge`、添加旧题选项并播报“给几个币”。取消动画会让等待返回，并不会终止后面的代码。（证据：[B2 异步呈现](D:/ClaudeCode/kidmath3/review/R2/index.html:3381)、[动画取消处理](D:/ClaudeCode/kidmath3/review/R2/index.html:328)）→ 建议：动画后立即检查题目代次；所有查询和新增节点限定在题目容器内，语音请求也携带所属题目。

- [中等] C01 **一次性提交已实现，但快进仍会重复总结。** 快进入口主动播 `st.summary`，同时解除原 reveal 的等待；例如 P1 随后又无条件播同一总结。这里未发现应当宣称的“双重提交”，但快进的语音幂等没有闭环。（证据：[提交保护](D:/ClaudeCode/kidmath3/review/R2/index.html:1657)、[快进](D:/ClaudeCode/kidmath3/review/R2/index.html:1704)、[P1 总结](D:/ClaudeCode/kidmath3/review/R2/index.html:2639)）→ 建议：总结只保留一个负责播报的出口，快进仅改变时间进度；断言一次快进只产生一次总结。

- [严重] C05 **H2、H3、A1、A3 加法分支存在确定性初始化错误，而且异常被包装成完成。** 新题没有初始化 `map`，这些呈现函数在首次 `K.reg()` 前直接写 `st.map[...]`；异常捕获只 `console.warn`，随后返回 `'ok'`，外层继续发参与星。（证据：[新题状态](D:/ClaudeCode/kidmath3/review/R2/index.html:1578)、[H2](D:/ClaudeCode/kidmath3/review/R2/index.html:3902)、[H3](D:/ClaudeCode/kidmath3/review/R2/index.html:4027)、[A1](D:/ClaudeCode/kidmath3/review/R2/index.html:4331)、[A3](D:/ClaudeCode/kidmath3/review/R2/index.html:4656)、[异常转成功](D:/ClaudeCode/kidmath3/review/R2/index.html:1644)）→ 建议：在题目构造时完整初始化状态；异常返回独立失败状态，不能走正常奖励路径；补这四关的呈现冒烟测试。

- [严重] C04 **现有“全绿”不足以证明所宣称的流程质量。** 四份日志确实分别得到 428／828 个通过断言，但测试固定种子、关闭首次示范、全程 `__fast`，直接请求游戏自己的正确步骤；缺少布局数据时直接通过，等待异常可以跳出循环，返回地图即记录完成，甚至不要求答过题。应用捕获的 `console.warn` 也不在错误收集范围。（证据：[流程测试](D:/ClaudeCode/kidmath3/review/R2/tests/test_flow.py:20)、[运行配置与错误收集](D:/ClaudeCode/kidmath3/review/R2/tests/harness.py:92)、[WebKit 全对日志](D:/ClaudeCode/kidmath3/review/R2/tests/logs/r2_webkit_right.txt:429)、[全错日志](D:/ClaudeCode/kidmath3/review/R2/tests/logs/r2_webkit_wrong.txt:829)）→ 建议：保留快速冒烟，但增加真实输入、正常时钟和故障注入；要求实际提交数量、结果、奖励与预期一致，必需布局数据缺失应失败，题目异常必须使测试失败。

## 维度 5：性能

结论：素材已经压缩、计数音频较小，作用域也提供了清理机制；但首屏预算没有落实，帧率、内存稳定性和离线完整性仍未证明。F01–F03 均不能关闭。

- [中等] F01 **入口就加载了超出预算的资源。** `boot()` 在孩子进入地图前构建完整地图，入口同时放六个角色；按启动引用去重后的文件体积静态合计约 1.60 MB，尚未计入 Service Worker 预缓存，明显高于设计的 450 KB。该数字是文件体积，不是实际网络耗时。（证据：[启动顺序](D:/ClaudeCode/kidmath3/review/R2/index.html:2302)、[入口角色](D:/ClaudeCode/kidmath3/review/R2/index.html:2273)、[资源预算](D:/ClaudeCode/kidmath3/review/R2/docs/DESIGN.md:583)）→ 建议：延后地图及非入口角色加载，按预算限制入口资源；提交目标 iPad 冷启动首个可交互时间和实际请求记录。

- [严重] F02 **Service Worker 可以用不完整的新缓存替换可用旧缓存。** 核心页面缓存失败被吞掉，安装仍成功；激活阶段随即删除旧版。网络优先路径收到 404／503 也直接返回，不回落已缓存页面。版本号、`skipWaiting`、`claim` 已实现，不能据此认定离线更新安全。（证据：[安装与激活](D:/ClaudeCode/kidmath3/review/R2/sw.js:14)、[网络优先](D:/ClaudeCode/kidmath3/review/R2/sw.js:37)）→ 建议：核心文件完整缓存后才能激活并清旧版；非成功 HTTP 响应进入缓存回退；测试更新中断、缺文件和离线重载。

- [中等] F03 **已有无限动画累加点，且没有 soak 证据。** A4 每次 `layout()` 都新增一个无限循环直升机动画，没有复用或取消；每题和旋转都会再次调用。`__res()` 也没有设计承诺的音频源统计，不能据此证明全部资源稳定。（证据：[无限动画](D:/ClaudeCode/kidmath3/review/R2/index.html:4746)、[资源统计](D:/ClaudeCode/kidmath3/review/R2/index.html:2326)）→ 建议：循环动画在 build 时建立一次并归属会话；补正常速度十五分钟的动画、定时器、音频源和内存趋势记录。当前不能宣称已发生发热，也不能宣称通过。

## 维度 6：iOS/WebKit 军规

结论：十条未通过。①入口确实在 `click` 同步栈调用 `speak` 并解锁 WebAudio，④每次播报前及页面恢复可见时的 `resume` 也有实现；但入口安全打断、计数回退和补说管理仍存在明确缺陷，真实 iPad 效果另属未验证事项。

- [严重] I01／第②条：**入口直接违反 cancel 后至少 150ms。** `Voice.unlock()` 在同一同步栈先 `cancel()` 再 `speak()`，也没有更新 `lastCancelAt`；正常 `hush()`／`pump()` 的等待保护覆盖不到这里。看门狗仍直接调用 cancel，未按 R1 回应统一入口。（证据：[入口解锁](D:/ClaudeCode/kidmath3/review/R2/index.html:664)、[安全间隔](D:/ClaudeCode/kidmath3/review/R2/index.html:720)、[看门狗](D:/ClaudeCode/kidmath3/review/R2/index.html:609)）→ 建议：首次同步解锁不要先执行不必要的 cancel；其余打断统一记录禁播截止时间，测试所有 cancel→speak 间隔。

- [严重] 第③条：**有超时兜底，却没有让真实引擎状态约束后续播报。** 450ms 探测只更新标志；`busy()` 和 `pump()` 依据本地 `cur/q`。超时将 `cur` 清空后，即使引擎仍 `speaking/pending`，90ms 后也会继续塞入下一句。（证据：[探测与超时](D:/ClaudeCode/kidmath3/review/R2/index.html:688)、[调度与 busy](D:/ClaudeCode/kidmath3/review/R2/index.html:735)）→ 建议：分别维护本地请求和引擎状态，超时后进入明确恢复流程；注入“不触发事件且持续 busy”的引擎进行验证。

- [中等] I02／第⑤条：**解锁基本动作齐全，失败可观测性不足。** 惰性 AudioContext、无声 buffer、循环 audio、后续手势重试都有实现；但 `play()` 拒绝被静默吞掉，`resume()` 的 Promise 拒绝未处理，`unlocked` 在未确认成功时就置为真。诊断只能显示当下暂停状态，无法解释失败原因。（证据：[WebAudio 与媒体会话](D:/ClaudeCode/kidmath3/review/R2/index.html:439)、[诊断](D:/ClaudeCode/kidmath3/review/R2/index.html:2172)）→ 建议：记录每次解锁结果、拒绝原因和重试状态，以实际状态更新成功标志。

- [中等] 第⑥条：**中文声音选择和引用保留已实现，晚到补说会漏掉。** `voiceschanged` 当下若因忙碌或 1.5 秒限制无法补说，就直接放弃，没有空闲后重试；1600ms 的首次无声补说也可能被尚未超时的 `cur` 拦住。（证据：[选声](D:/ClaudeCode/kidmath3/review/R2/index.html:625)、[晚到声音](D:/ClaudeCode/kidmath3/review/R2/index.html:643)、[首次补说](D:/ClaudeCode/kidmath3/review/R2/index.html:678)）→ 建议：保存待补说请求，在允许插话时重新判断，并同时检查上下文是否仍有效。

- [严重] I03／第⑦条：**节流条件存在，上下文令牌和首句确认没有真正落实。** `ctxToken` 只被赋值，没有参与校验；进入小游戏后仍可能补说入口句。`probe(item,true)` 不检查 `item` 是否仍是当前首句，旧定时器可能把后一句的引擎活动记为“首句确认”。（证据：[补说条件](D:/ClaudeCode/kidmath3/review/R2/index.html:649)、[确认逻辑](D:/ClaudeCode/kidmath3/review/R2/index.html:688)、[孤立令牌赋值](D:/ClaudeCode/kidmath3/review/R2/index.html:2295)）→ 建议：绑定首句请求 ID 与入口上下文代次；上下文离开立即失效，探测只能确认所属请求。

- [中等] 第⑧条：**普通点按会清队列，但“永远只有最新一条”仍未覆盖异步续写。** `sayNow()` 和输入前 `hush()` 是有效基础；C01 的快进双总结、C02 的旧题恢复写入仍能重新排入过期语音。现有测试没有快速连点时间线断言。（证据：[输入打断](D:/ClaudeCode/kidmath3/review/R2/index.html:1846)、[语音队列](D:/ClaudeCode/kidmath3/review/R2/index.html:709)、[快进](D:/ClaudeCode/kidmath3/review/R2/index.html:1708)）→ 建议：语音请求带所属题目与请求序号，入队和执行前都淘汰过期请求；测试连续十次、二十次真实点击后的实际播报序列。

- [严重] I05／第⑨条：**无声提示只覆盖入口的一次检测。** `engineActive` 是“曾经活动过”的永久标志，没有连续三句失败检测；游戏中后来失声不会触发提示。完全没有合成器时，条件 `&& Voice.synth` 又阻止提示出现；地图上的提示还是小号文字排查条，而非回应承诺的儿童大喇叭。（证据：[永久活动标志](D:/ClaudeCode/kidmath3/review/R2/index.html:599)、[提示触发与关闭](D:/ClaudeCode/kidmath3/review/R2/index.html:2296)、`index.html:115、241`）→ 建议：按请求维护近期成功／失败状态，所有游戏页面提供大目标重试入口；技术排查文字留在成人门内。声音列表、选择持久化、测试按钮已有实现，应保留。

- [严重] I04／第⑩条：**独立 MP3 通道已建立，但缺失回退保护和生命周期隔离。** 回退只是普通 `Voice.sayNow()`，下一次点按或提交即可把数词切掉；解码完成只比较 `pendingName`，没有请求序号或题目归属，退出后仍可能播放旧数词；AudioContext 非 running 时直接丢弃播放。看门狗要求本地 `cur` 为空，持续补入新句又可能推迟卡死复位。（证据：[计数加载与播放](D:/ClaudeCode/kidmath3/review/R2/index.html:801)、[回退](D:/ClaudeCode/kidmath3/review/R2/index.html:824)、[提交打断](D:/ClaudeCode/kidmath3/review/R2/index.html:1660)、[看门狗](D:/ClaudeCode/kidmath3/review/R2/index.html:609)）→ 建议：数词回退使用受保护优先级；解码请求携带序号及会话代次，退出时失效并停止所属音源；恢复音频后仅补播仍有效的最新数词。用缺 MP3、解码延迟、上下文暂停和引擎永久 busy 验证最终计数确实播放，不能只检查请求日志。

## 维度 7：设计品味与惊喜细节

结论：有讨喜的岛屿品牌、场景和自由选择入口，但距离编辑推荐级产品仍明显不足。§3.10 的八组要求中，品牌和基础视觉最接近完成；动效、声音、角色、惊喜、触控、节奏与稳健性均只部分落实。

- [中等] D01 **品牌成立，整套视觉与数学语言尚未成立。** 图标、入口和岛面板已有成品方向；数学前景仍依赖重复的白色圆角条和通用浮层，数量显示还存在 V03 的可读性问题。静态截图也不能证明没有白闪、字体回退和加载跳变。（证据：截图 `1_shell_landscape.jpg`、`5_bluey.jpg`、[任务卡组件](D:/ClaudeCode/kidmath3/review/R2/index.html:2436)）→ 建议：先统一数学单位、反馈层和场景容器，再补冷启动与切换的正常速度录像验收。

- [中等] D02 **配对线、圈组和重排有教学意义，节奏控制却不可靠。** B3 纠错长时间等待、快进重复总结已见上文；节末虽然启用了快进层，当前题已为 `done` 时入口又不接受快进。没有正常速度证据证明翻转、庆典与帧率达到要求。（证据：[节末](D:/ClaudeCode/kidmath3/review/R2/index.html:1728)、[快进阶段](D:/ClaudeCode/kidmath3/review/R2/index.html:1706)、G07、C01）→ 建议：统一可跳过阶段与唯一完成路径，按真实儿童操作记录一整节的等待时间。

- [中等] D03 **语音有轮换，庆祝音效与声音让位未按回应完成。** 表扬池避免连续重复已有代码；正确音效却始终是同一组四音，环境音增益也没有与讲解／计数联动的 ducking。（证据：[固定正确音效](D:/ClaudeCode/kidmath3/review/R2/index.html:524)、[环境音增益](D:/ClaudeCode/kidmath3/review/R2/index.html:563)、[表扬轮换](D:/ClaudeCode/kidmath3/review/R2/index.html:1664)）→ 建议：实现三至四个同音色变体及讲解期间的音量让位；实际音质仍需听测。

- [中等] D04 **角色会动，但相互关系和自主反应不足。** 呼吸、眼睛锚点眨眼、点按反应已有基础；`lookAt()` 只有定义，没有调用，庆祝主要是各自跳动，不能证明“互相看、一起回应孩子”的角色关系。（证据：[角色实现](D:/ClaudeCode/kidmath3/review/R2/index.html:1054)、[未接入的看向动作](D:/ClaudeCode/kidmath3/review/R2/index.html:1101)、[集体庆祝](D:/ClaudeCode/kidmath3/review/R2/index.html:1733)）→ 建议：给核心同框组合设计少量有因果的互看、接物、共同庆祝动作，并与数学事件对应。

- [中等] D05 **自由重玩已闭环，“第三次还想来”的小故事没有按设计完成。** 四枚徽章可自选值得保留；第三次只有“又见面啦”，没有礼物，第五次只是各自 cheer，没有列队欢迎，第十次帽子才有明确视觉变化。（证据：[访问次数实现](D:/ClaudeCode/kidmath3/review/R2/index.html:1559)、[设计承诺](D:/ClaudeCode/kidmath3/review/R2/docs/DESIGN.md:569)、截图 `L_panel`）→ 建议：至少完成一个可看见、能保留、下次会继续变化的小故事，让重复打开的价值超出换一句问候。

- [中等] D06／D07 **基础按压和松手触发已有实现，单一注意力与接管体验未闭环。** 点按兜底失效见 U02；首次示范驱动器在孩子开始操作后仍会继续取“正确步骤”并代做，没有让出控制权。首屏一秒、缓存转场及跟手延迟也没有测量证据。（证据：[示范驱动](D:/ClaudeCode/kidmath3/review/R2/index.html:1772)、[输入适配](D:/ClaudeCode/kidmath3/review/R2/index.html:955)、F01）→ 建议：孩子首次有效输入立即接管示范；提示、角色表演和彩蛋共享注意力调度，并用真实输入测响应时间。

- [严重] D08 **“任何时候退出都安全”和后台恢复尚未达到。** 除旋转与退出竞态外，`visibilitychange` 只处理音频，没有暂停／重置题目提示计时和演示状态；后台时间可能被当成孩子卡住的时间。离线与十五分钟稳定性也未验收。（证据：[可见性处理](D:/ClaudeCode/kidmath3/review/R2/index.html:617)、U04、C02、F02、F03）→ 建议：明确后台暂停与回前台恢复协议，保留题目数学状态，重新计算提示截止时间；纳入正常速度进出后台测试。

**开发方已决策的未关闭项（单列）**

- **IP**：按委托方指定使用素材的决定成立；交付所需替换说明仍属于后续交付项，不作为本轮技术缺陷。（证据：[DESIGN.md:609](D:/ClaudeCode/kidmath3/review/R2/docs/DESIGN.md:609)）
- **真机音频**：静音开关、媒体会话、真实 TTS 和后台恢复确实需要真 iPad 验证；本快照没有已完成记录。可以保留此验收项，但不能用它解释第②、⑦、⑩条已经能从代码确认的缺陷。（证据：[DESIGN.md:610](D:/ClaudeCode/kidmath3/review/R2/docs/DESIGN.md:610)）
- **钢铁侠面罩开合**：在不可改画原图的约束下，用光效与推进器替代有合理性；本轮世界 6 尚未实现，替代效果仍未证明。（证据：[DESIGN.md:611](D:/ClaudeCode/kidmath3/review/R2/docs/DESIGN.md:611)）

SCORE: 5/10 — 场景与玩法已有完成度，但真实点按、跨次掌握、数量反馈和语音竞态仍有阻断性缺陷，尚不足以让幼儿可靠独立使用。

离下一分最关键的三件事：

1. 修通真实儿童操作：点按兜底、B3 亲手纠错、旋转后的提交、无声数量目标及稳定救援；用真实触控、正常速度验收。
2. 修复学习证据链：持久化技能记录、补测缺失题型、所有辅助排除掌握、同类新题复测，并证明猜测策略不能解锁。
3. 收紧生命周期与音频调度：所有异步恢复校验归属，异常不得当成功，落实安全打断和受保护计数，再用故障注入验证退出、快进及语音异常。

VERDICT: REJECT