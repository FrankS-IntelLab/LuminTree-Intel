# LuminTree-Intel

AI-powered novel creation studio — a Chrome/Edge extension that provides structured worldbuilding, plot design, character profiling, and chapter management in your browser sidebar. Built for fiction writers who think in trees.

## Features

- **Fixed 6-category creative tree** — Structured hierarchy for novel development:
  - 📖 Core Concept & Story Positioning
  - 🌍 Worldview Setting
  - 📐 Plot Framework
  - 👤 Character Profile Library (OOC prevention)
  - 📑 Chapter Structure Sorting
  - 🗂 Writing Material Library
- **Category-aware AI agent** — Each category has a specialized AI prompt for targeted creative assistance
- **Reference capture** — Select text on any webpage, right-click → "Push to Panel" to collect writing materials
- **AI chat per node** — Click any node to discuss plot, characters, worldbuilding with context-aware AI
- **OOC prevention** — Character library AI flags actions that break established character logic
- **Pin & branch** — Pin a category or node as parent, push new content as children; branch from AI responses
- **Voice input** — Click 🎤 to dictate ideas via speech recognition overlay
- **Mermaid flowchart export** — Visualize your novel structure as a mind map
- **Preview & download** — Preview rendered exports in sidebar, or download as `.md` / `.json`
- **JSON import/export** — Transfer novel projects between devices with full structure preservation
- **Timestamps** — Every node and chat message is timestamped
- **Configurable LLM** — Bring your own API key; presets for DashScope (Qwen) and OpenAI
- **Persistent storage** — All data in `chrome.storage.local`, no backend required

## Install

1. Clone this repo
2. Open `chrome://extensions/` in Chrome or Edge
3. Enable **Developer mode**
4. Click **Load unpacked** → select the project folder
5. Click the extension icon to open the sidebar panel

## Configure LLM

Click the ⚙️ icon in the sidebar:

| Field | Example |
|---|---|
| Preset | DashScope (Qwen) / OpenAI / Custom |
| API Endpoint | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | Your API key |
| Model | `qwen-plus`, `gpt-4o-mini`, etc. |

Any OpenAI-compatible API endpoint works (OpenAI, DashScope, OpenRouter, Ollama, etc.).

## Usage

1. Open the sidebar → 6 fixed category nodes are pre-created
2. Click any category to chat with the AI about that aspect of your novel
3. Pin a category (🔗) → select reference text on any webpage → right-click → "Push to Panel" → it becomes a child node under that category
4. Click any node → discuss it with the category-aware AI
5. Select text in an AI response → click 🌿 to branch it as a child node
6. Use 🎤 for voice input, 👁 for preview, 📥 for export

## Creative Tree Structure

```
📖 Core Concept & Story Positioning
  └── Genre, theme, logline, target audience, core conflict
🌍 Worldview Setting
  └── World rules, geography, magic systems, history, factions
📐 Plot Framework
  └── Story arcs, turning points, act structure, subplots
👤 Character Profile Library
  └── Character bios, motivations, relationships, OOC boundaries
📑 Chapter Structure
  └── Chapter outlines, scene breakdowns, pacing, POV
🗂 Writing Material Library
  └── Reference snippets, inspiration, research notes
```

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JS / HTML / CSS
- KaTeX (math rendering, bundled locally)
- Marked (Markdown parsing, bundled locally)
- Mermaid (flowchart rendering, bundled locally)
- Web Speech API (voice input)

## Roadmap

- [ ] Drag & drop to reorder/reparent nodes within categories
- [ ] Search across all nodes and chat history
- [ ] Character relationship graph visualization
- [ ] Chapter timeline view

## Author

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [Website](https://franks-intellab.github.io/)

## License

[MIT](LICENSE)

---

# LuminTree-Intel（中文说明）

AI 驱动的小说创作工作室——一款 Chrome/Edge 扩展，在浏览器侧边栏中提供结构化的世界观构建、情节设计、角色档案和章节管理。为以树状思维创作的小说作者而建。

## 功能

- **固定 6 大类创作树** — 结构化的小说开发层级：
  - 📖 核心设定与故事定位
  - 🌍 世界观设定
  - 📐 情节框架
  - 👤 角色档案库（防 OOC）
  - 📑 章节结构排序
  - 🗂 写作素材库
- **分类感知 AI 代理** — 每个类别有专属 AI 提示词，提供针对性创作辅助
- **素材采集** — 在任意网页选中文本，右键 → "Push to Panel" 收集写作素材
- **节点 AI 对话** — 点击任意节点，与上下文感知的 AI 讨论情节、角色、世界观
- **防 OOC** — 角色库 AI 会标记违反已建立角色逻辑的行为
- **固定与分支** — 固定类别或节点为父节点，推送新内容为子节点；从 AI 回复中分支
- **语音输入** — 点击 🎤 通过语音识别口述创意
- **Mermaid 流程图导出** — 将小说结构可视化为思维导图
- **预览与下载** — 在侧边栏预览渲染后的导出内容，或下载为 `.md` / `.json`
- **JSON 导入/导出** — 在设备间传输小说项目，完整保留结构
- **时间戳** — 每个节点和聊天消息均带时间戳
- **可配置 LLM** — 自带 API Key；预设支持 DashScope（通义千问）和 OpenAI
- **持久化存储** — 所有数据存储在 `chrome.storage.local`，无需后端

## 安装

1. 克隆本仓库
2. 在 Chrome 或 Edge 中打开 `chrome://extensions/`
3. 开启 **开发者模式**
4. 点击 **加载已解压的扩展程序** → 选择项目文件夹
5. 点击扩展图标打开侧边栏面板

## 使用方法

1. 打开侧边栏 → 6 个固定类别节点已预创建
2. 点击任意类别与 AI 讨论小说的该方面
3. 固定类别（🔗）→ 在网页选中参考文本 → 右键 → "Push to Panel" → 自动成为该类别的子节点
4. 点击任意节点 → 与分类感知 AI 讨论
5. 选中 AI 回复中的文本 → 点击 🌿 分支为子节点
6. 使用 🎤 语音输入，👁 预览，📥 导出

## 技术栈

- Manifest V3 Chrome 扩展
- 原生 JS / HTML / CSS
- KaTeX（数学公式渲染，本地打包）
- Marked（Markdown 解析，本地打包）
- Mermaid（流程图渲染，本地打包）
- Web Speech API（语音输入）

## 作者

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [网站](https://franks-intellab.github.io/)

## 许可证

[MIT](LICENSE)
