# AI Pet

AI Pet 是一个面向 Claude Code 和 Codex 的桌面宠物伴侣项目。目标不是做一个普通聊天机器人，而是做一个可以常驻桌面、随时调出、感知编码 agent 动作并主动提示用户的本地伴侣。

## 项目目标

最终形态：

- 桌宠可以常驻桌面，也可以通过快捷键、托盘图标或命令随时调出来。
- 桌宠连接 Claude Code 和 Codex，接收它们的运行状态、工具调用、任务进度和结果。
- 当 agent 需要用户审批、测试失败、任务完成、出现错误或长时间卡住时，桌宠可以主动提示。
- Claude Code 和 Codex 可以同时接入，同一个桌宠负责统一显示多 agent 状态。
- 默认只做状态展示和提醒，不让宠物直接替用户执行危险命令。

## 当前版本

当前版本是第一版技术骨架，已经具备：

- 本地 HTTP/WebSocket 服务，默认运行在 `http://localhost:4243`。
- 浏览器版宠物 UI，用于验证状态展示。
- `claude-pet.ps1` 和 `codex-pet.ps1` 启动包装器：先启动宠物服务，再启动真实的 Claude Code 或 Codex。
- `/event` 接口：外部脚本、hooks 或后续 MCP 集成都可以把 agent 事件发给宠物。

当前还不是完整桌面浮窗应用。下一步会把浏览器 UI 封装成桌面常驻窗口，并增加托盘、快捷键和通知。

## 目录结构

```text
src/server.js                本地 daemon，负责状态和事件分发
public/                      当前浏览器版宠物 UI
scripts/Start-PetServer.ps1  启动宠物服务
scripts/claude-pet.ps1       Claude Code 启动包装器
scripts/codex-pet.ps1        Codex 启动包装器
config/agents.example.json   本机命令路径示例配置
```

## 本地运行

```powershell
npm install
npm start
```

打开：

```text
http://localhost:4243
```

## 发送测试事件

```powershell
curl.exe -X POST http://localhost:4243/event `
  -H "Content-Type: application/json" `
  --data-raw "{\"agent\":\"codex\",\"event\":\"test_passed\",\"status\":\"测试通过\"}"
```

查看当前状态：

```powershell
curl.exe http://localhost:4243/state
```

## 接入 Claude Code 和 Codex

复制配置文件：

```powershell
Copy-Item config\agents.example.json config\agents.json
```

确认 `config/agents.json` 里的路径指向真实命令：

```json
{
  "petPort": 4243,
  "claudePath": "C:\\Users\\Shawn\\AppData\\Roaming\\npm\\claude.ps1",
  "codexPath": "C:\\Users\\Shawn\\AppData\\Roaming\\npm\\codex.ps1"
}
```

然后可以通过包装器启动：

```powershell
.\scripts\claude-pet.ps1
.\scripts\codex-pet.ps1
```

如果要让输入 `claude` / `codex` 时自动启动宠物，可以在 PowerShell profile 里设置 alias：

```powershell
Set-Alias claude E:\Shawn\micu\agent-pet-companion\scripts\claude-pet.ps1
Set-Alias codex E:\Shawn\micu\agent-pet-companion\scripts\codex-pet.ps1
```

注意：包装器内部必须调用真实的 Claude Code / Codex 路径，不能再调用 alias，否则会递归启动自己。

## 后续路线

优先级从高到低：

1. 桌面化：用 Tauri 或 Electron 把当前 UI 变成可置顶、可隐藏、可托盘唤起的桌面宠物。
2. Claude Code hooks：把工具调用、审批请求、任务完成、错误等事件发送到 `/event`。
3. Codex 接入：通过 wrapper、session 日志、MCP 或 Codex Desktop pet 能力接入更多状态。
4. 通知系统：审批、失败、完成、长时间无进展时弹出宠物提示。
5. 宠物状态机：根据 agent 行为切换待机、工作、等待、开心、困惑等动作。
