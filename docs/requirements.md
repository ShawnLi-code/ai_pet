# AI Pet 需求文档

## 1. 项目定位

AI Pet 是一个面向 Claude Code 和 Codex 的本地桌面宠物伴侣。

它不是普通聊天机器人，也不是单纯网页状态面板。目标是让用户在桌面上拥有一个可随时调出、可常驻、可提醒的 AI 编码宠物。这个宠物负责接收 Claude Code、Codex 等编码 agent 的动作和任务状态，并把关键事件以可视化、桌面提示或通知的方式反馈给用户。

## 2. 核心目标

- 用户启动 Claude Code 或 Codex 时，AI Pet 可以自动启动或连接。
- AI Pet 可以常驻桌面，也可以通过快捷键、托盘图标或命令随时显示/隐藏。
- AI Pet 能接收 Claude Code 和 Codex 的事件，包括启动、读文件、编辑、运行命令、测试、等待审批、失败、完成等。
- AI Pet 能根据事件切换状态和动作，例如待机、工作、等待、开心、困惑、报错。
- 当出现需要用户注意的事件时，AI Pet 能主动提醒，例如权限审批、测试失败、任务完成、长时间无进展。
- 多个 agent 可以同时接入，同一个 AI Pet 统一显示当前活跃 agent 和最近事件。

## 3. 非目标

第一阶段不做以下事情：

- 不让宠物自动替用户批准危险命令。
- 不让宠物直接修改代码或执行 shell 命令。
- 不做完整聊天伴侣系统。
- 不做复杂账号体系、云同步或多人协作。
- 不依赖外部云服务完成核心功能。

## 4. 当前状态

当前仓库已有基础骨架：

- Node 本地 HTTP/WebSocket daemon。
- `/state` 状态接口。
- `/event` 事件接收接口。
- 浏览器版宠物 UI。
- Electron 桌面入口初版。
- Claude Code / Codex PowerShell 启动包装器初版。

当前还不完整：

- Electron 二进制首次下载可能较慢。
- 桌面窗口还只是初步封装，不是成熟桌宠体验。
- Claude Code hooks 尚未真正接入。
- Codex 事件来源尚未完善。
- 缺少系统通知、拖动位置记忆、开机启动、窗口设置等桌面能力。

## 5. MVP 范围

MVP 目标是做出一个真正可用的本地桌面 AI Pet。

### 5.1 桌面能力

必须支持：

- Electron 或 Tauri 桌面窗口。
- 无边框窗口。
- 置顶显示。
- 可拖动。
- 可隐藏/显示。
- 托盘菜单。
- 全局快捷键显示/隐藏。
- 退出应用。

优先支持：

- 记住窗口位置。
- 透明背景。
- 窗口穿透开关。
- 系统通知。

### 5.2 Agent 事件接入

必须支持统一事件接口：

```http
POST /event
Content-Type: application/json
```

事件格式：

```json
{
  "agent": "codex",
  "event": "test_passed",
  "status": "测试通过",
  "task": "运行测试",
  "cwd": "E:\\Shawn\\micu",
  "severity": "info",
  "timestamp": "2026-05-23T15:00:00.000Z",
  "metadata": {}
}
```

字段说明：

- `agent`: 必填，来源 agent，例如 `codex`、`claude-code`。
- `event`: 必填，事件类型。
- `status`: 可选，显示给用户的短文本。
- `task`: 可选，当前任务。
- `cwd`: 可选，agent 所在工作目录。
- `severity`: 可选，`info`、`success`、`warning`、`error`。
- `timestamp`: 可选，缺省由服务端生成。
- `metadata`: 可选，扩展数据。

### 5.3 事件类型

第一阶段支持这些事件：

```text
started
idle
reading
editing
tool_started
command_started
command_finished
test_started
test_passed
test_failed
approval_needed
blocked
error
done
exited
```

### 5.4 宠物状态映射

```text
idle              -> 待机
started           -> 醒来/准备工作
reading           -> 看书/观察
editing           -> 打字/工作
tool_started      -> 使用工具
command_started   -> 紧张等待
test_started      -> 等待测试
test_passed       -> 开心
test_failed       -> 困惑/沮丧
approval_needed   -> 举牌提醒
blocked           -> 求助
error             -> 报错
done              -> 完成/庆祝
exited            -> 休息
```

## 6. Claude Code 接入方案

Claude Code 优先使用 hooks 接入。

目标：

- Claude Code 启动时通知 AI Pet。
- 工具调用前后通知 AI Pet。
- 需要权限审批时通知 AI Pet。
- 任务结束或异常时通知 AI Pet。

推荐结构：

```text
Claude Code hook
  -> PowerShell/Node hook script
  -> POST http://localhost:4243/event
  -> AI Pet daemon
  -> WebSocket 推送到桌面 UI
```

第一版可以先做 PowerShell hook 脚本：

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:4243/event `
  -ContentType "application/json" `
  -Body '{"agent":"claude-code","event":"tool_started","status":"Claude Code 正在使用工具"}'
```

注意：

- hook 脚本不能阻塞 Claude Code 主流程太久。
- hook 失败不能导致 Claude Code 任务失败。
- hook 不应泄露敏感环境变量、token 或完整 prompt。

## 7. Codex 接入方案

Codex 第一阶段用 wrapper 接入，后续再接 MCP、session 日志或 Codex Desktop pet 能力。

第一阶段：

```text
codex-pet.ps1
  -> 启动 AI Pet
  -> POST started
  -> 调用真实 codex
  -> 根据退出码 POST done/error/exited
```

后续增强：

- 监听 Codex session/log。
- 从 Codex MCP server/interface 获取更细事件。
- 如果 Codex Desktop pet 接口稳定，优先复用官方接口。

## 8. 本地服务设计

服务默认监听：

```text
127.0.0.1:4243
```

接口：

```text
GET  /state
POST /event
GET  /
WS   /
```

设计要求：

- 只监听 localhost。
- 请求体大小限制。
- JSON 解析失败要返回明确错误。
- 端口被占用时，桌面 app 应该尝试复用已有服务，而不是直接崩溃。
- 状态保存在内存中即可，后续可加入轻量本地持久化。

## 9. UI 设计要求

第一版 UI 不追求复杂美术，但要满足桌宠感：

- 宠物必须是主角，不要做成普通 dashboard。
- 信息面板可以存在，但不能喧宾夺主。
- 当前 agent、当前事件、最近任务要清楚。
- 宠物状态变化要明显。
- 关键事件要有提示动作或通知。
- 窗口尺寸要小，适合常驻桌面。

避免：

- 大面积营销页。
- 复杂配置页作为首屏。
- 纯表格/日志界面。
- 需要用户频繁手动刷新。

## 10. 安全边界

AI Pet 默认是观察者和提醒者。

允许：

- 接收事件。
- 显示状态。
- 发系统通知。
- 启动本地 UI。
- 启动 Claude Code/Codex wrapper。

不允许：

- 自动批准权限请求。
- 自动执行任意 shell 命令。
- 自动修改项目文件。
- 读取或上传 token、私钥、完整 prompt。
- 监听非 localhost 网络端口。

## 11. 里程碑

### M1: 桌面化可运行

- Electron/Tauri 桌面窗口可启动。
- 置顶、隐藏/显示、托盘、快捷键可用。
- `/event` 能驱动 UI 状态变化。

### M2: Claude Code 接入

- hooks 脚本完成。
- 至少支持 started、tool_started、approval_needed、error、done。
- hook 失败不影响 Claude Code。

### M3: Codex 接入

- wrapper 稳定。
- started、done、error、exited 可用。
- 能自动启动或复用 AI Pet。

### M4: 提醒体验

- 系统通知。
- 宠物提示气泡。
- 任务完成、审批请求、测试失败有明显提醒。

### M5: 体验完善

- 位置记忆。
- 开机启动可选。
- 窗口穿透可选。
- 事件历史。
- 设置页。

## 12. 验收标准

MVP 通过标准：

- 用户运行 `npm run desktop` 能看到桌面宠物。
- 用户按 `Ctrl+Shift+P` 能显示/隐藏宠物。
- 用户发送测试事件后，宠物状态和文字能变化。
- 用户通过 `codex-pet.ps1` 启动 Codex 时，宠物能收到 started/exited。
- Claude Code hook 触发时，宠物能收到对应事件。
- 没有 agent 活动时，宠物保持待机状态。
- 端口已有服务时，桌面窗口能复用现有 daemon。

## 13. 给后续实现者的注意事项

- 优先让本地闭环跑通，不要先做复杂美术。
- 不要把宠物做成聊天应用。
- 不要让宠物主动控制 agent。
- 先统一事件协议，再扩展 Claude Code/Codex 的具体接入。
- Windows 是当前优先平台。
- PowerShell wrapper 要避免递归调用 alias。
- 不要提交 `config/agents.json`、日志和 `node_modules`。
