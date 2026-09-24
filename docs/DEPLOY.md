# 点点岛 · 部署与更新

- 仓库：`https://github.com/edliu1105/diandian-island`（组织 `edliu1105` 名下的公开仓库，**不放在个人账号下**——个人账号的 Pages 会被自定义域名 301 劫持且没有 HTTPS）
- 网址：`https://edliu1105.github.io/diandian-island/`（HTTPS，GitHub Pages，`main` 分支根目录）
- 整个应用 = `index.html`（全部代码，无第三方库、无构建）+ `sw.js`（离线）+ `manifest.webmanifest` + `assets/`；根目录的 `.nojekyll` 让 Pages 原样发布所有文件。

## 第一次发布（已完成，记录备查）

```bash
gh repo create edliu1105/diandian-island --public --source . --remote origin --push
gh api -X POST repos/edliu1105/diandian-island/pages -f "source[branch]=main" -f "source[path]=/"
gh api -X PUT repos/edliu1105/diandian-island/pages -F https_enforced=true
python tools/make_qr.py                      # docs/qr.png、docs/qr-card.png
python tests/smoke.py                        # 线上冒烟：HTTPS、全部素材、两引擎各玩六个世界、离线
```

## 日常更新（改了代码或素材之后）

1. **每次发布都要**重新生成离线清单与版本号（版本号 = index.html + manifest + 全部素材的哈希；页面与素材属于同一个版本）：
   ```bash
   python tools/gen_sw_list.py
   ```
   忘了这一步时 `tests/test_offline.py` 会失败（`python tools/gen_sw_list.py --check` 可单独检查）。
2. 发布前跑完整门禁（两个引擎各约 1.5 小时；全部 `rc=0` 才发布）：
   ```bash
   bash tests/run_all.sh webkit gate
   bash tests/run_all.sh chromium gate
   ```
   汇总表在 `tests/logs/gate_summary_<引擎>.txt`。
3. 提交并推送：
   ```bash
   git add -A && git commit -m "说明这次改了什么" && git push
   ```
4. 1–2 分钟后 Pages 生效，跑线上冒烟：
   ```bash
   python tests/smoke.py
   ```

## iPad 上怎么拿到新版本

- 联网打开时，新版本（新页面 + 新素材，作为一个整体）在后台完整下载；下载不完整时什么都不变，旧版本继续完整工作（不会出现新页面配旧素材）。
- 下载完成的新版本先“等待”；在安全的时刻才切换：下次打开停在入口页时，或点点岛切到后台时——此时让新版本接管并立即重新载入，页面与素材同时换新。正在玩的一局永远不会被中途换版本。
- 家长无需任何操作。

## 回滚

```bash
git revert <出问题的提交>     # 或 git revert HEAD
git push
```

## IP 安全阀（替换或下架某个角色 / 世界）

```bash
python tools/replace_char.py list                          # 列出 39 个角色与所属世界
python tools/replace_char.py replace spiderman new.png     # 换掉一张角色图（原图移到 incoming/replaced/）
python tools/replace_char.py takedown avengers             # 整个世界下架：从地图、终场、入口消失，图片不再发布
python tools/replace_char.py restore avengers              # 恢复
```
之后照“日常更新”第 2–4 步发布。下架的世界在解锁链里视为“已通过”，后面的世界照常可以打开。
注意：原图备份在本机的 `incoming/`（不进仓库），恢复需在保存了备份的这台电脑上进行。
