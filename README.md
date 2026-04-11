# LuminTree-Intel

AI-powered novel creation studio — a standalone web app with a 4-panel layout for structured worldbuilding, plot design, character profiling, chapter management, and AI-assisted writing. Built for fiction writers who think in trees.

## Features

- **4-panel layout** — Left (tree structure), Middle (editor + AI assistant), Right (chapters), Far-right (AI Writer)
- **Fixed 6-category creative tree** — Structured hierarchy for novel development:
  - 📖 Core Concept & Story Positioning
  - 🌍 Worldview Setting
  - 📐 Plot Framework
  - 👤 Character Profile Library
  - 📑 Chapter Structure
  - 🗂 Writing Material Library
- **Category-aware AI assistant** — Each category has a specialized AI prompt; click the 🤖 AI Assistant tab in the middle panel to refine any section with AI help
- **AI Writer** — Dedicated panel for AI-powered chapter writing that strictly follows your Writing Material Library style directives
- **Use as Draft** — Select the best AI Writer output and push it directly into the chapter editor
- **Clear Memory** — Reset AI Writer conversation per chapter for a fresh start
- **Two-way chapter sync** — Chapter Structure (left tree) and Chapters panel (right) are always linked
- **Drag & drop** — Rearrange parent-child relationships in the tree by dragging nodes
- **Resizable panels** — Drag the handles between all 4 panels to adjust sizes
- **Smart Import** — Import any file (JSON, TXT, MD) with AI-powered transformation to match the app's category structure
- **Chapter Import** — Import chapters from any format into Chapter Structure with AI extraction
- **JSON export/import** — Full project export including tree, chapters, and AI chat history
- **Persistent AI chat history** — Conversations saved per node and per chapter
- **Configurable LLM** — Bring your own API key; presets for DashScope (Qwen) and OpenAI

## Quick Start

1. Clone this repo
2. Open `index.html` in your browser (or serve via `python3 -m http.server 8080` for full features)
3. Click ⚙️ to configure your AI API settings
4. Start building your novel structure in the left panel

## Configure LLM

Click the ⚙️ icon:

| Field | Example |
|---|---|
| Preset | DashScope (Qwen) / OpenAI / Custom |
| API Endpoint | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | Your API key |
| Model | `qwen-plus`, `gpt-4o-mini`, etc. |

Any OpenAI-compatible API endpoint works.

## Usage

1. **Build your novel structure** — Click any category in the left panel, use "+" to add child nodes, write notes in the editor
2. **Refine with AI** — Switch to the 🤖 AI Assistant tab to get category-specific AI help for any node
3. **Manage chapters** — Create chapters in the right panel or import them via the 📂 button on Chapter Structure
4. **Write with AI** — Select a chapter, then use the AI Writer panel to generate content
5. **Select drafts** — Click "📋 Use as Draft" on good AI output to push it into the chapter editor
6. **Export/Import** — Use 💾 JSON export to save your project, 📂 Import to restore, or 🧠 Smart Import for any format

## Creative Tree Structure

```
📖 Core Concept & Story Positioning
  └── Genre, theme, logline, target audience, core conflict
🌍 Worldview Setting
  └── World rules, geography, magic systems, history, factions
📐 Plot Framework
  └── Story arcs, turning points, act structure, subplots
👤 Character Profile Library
  └── Character bios, motivations, relationships, boundaries
📑 Chapter Structure
  └── Chapter outlines, scene breakdowns, pacing, POV
🗂 Writing Material Library
  └── Style directives, reference snippets, inspiration, research notes
```

## Tech Stack

- Standalone Web App (HTML / CSS / JS)
- localStorage for persistence
- Marked (Markdown parsing, bundled locally)
- Mermaid (flowchart rendering, bundled locally)
- KaTeX (math rendering, bundled locally)

## Author

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [Website](https://franks-intellab.github.io/)

## License

[MIT](LICENSE)

---

# LuminTree-Intel（中文说明）

AI 驱动的小说创作工作室——一款独立 Web 应用，采用 4 面板布局，提供结构化的世界观构建、情节设计、角色档案、章节管理和 AI 辅助写作。为以树状思维创作的小说作者而建。

## 功能

- **4 面板布局** — 左（树结构）、中（编辑器 + AI 助手）、右（章节）、最右（AI 写手）
- **固定 6 大类创作树** — 结构化的小说开发层级：
  - 📖 核心设定与故事定位
  - 🌍 世界观设定
  - 📐 情节框架
  - 👤 角色档案库
  - 📑 章节结构
  - 🗂 写作素材库
- **分类感知 AI 助手** — 每个类别有专属 AI 提示词；在中间面板点击 🤖 AI 助手标签，获取针对性 AI 辅助
- **AI 写手** — 专用面板，严格遵循写作素材库中的风格指令进行 AI 章节写作
- **用作草稿** — 选择最佳 AI 输出，直接推送到章节编辑器
- **清除记忆** — 按章节重置 AI 写手对话，重新开始
- **双向章节同步** — 章节结构（左树）与章节面板（右）始终保持链接
- **拖拽排序** — 通过拖拽节点调整树中的父子关系
- **可调面板** — 拖动 4 个面板之间的手柄调整大小
- **智能导入** — 导入任意文件（JSON、TXT、MD），AI 自动转换为应用所需的分类结构
- **章节导入** — 从任意格式导入章节到章节结构，支持 AI 提取
- **JSON 导入/导出** — 完整项目导出，包含树、章节和 AI 聊天记录
- **持久化 AI 聊天记录** — 按节点和章节保存对话
- **可配置 LLM** — 自带 API Key；预设支持 DashScope（通义千问）和 OpenAI

## 快速开始

1. 克隆本仓库
2. 在浏览器中打开 `index.html`（或通过 `python3 -m http.server 8080` 启动本地服务以获取完整功能）
3. 点击 ⚙️ 配置 AI API 设置
4. 在左面板开始构建小说结构

## 使用方法

1. **构建小说结构** — 点击左面板中的任意类别，使用 "+" 添加子节点，在编辑器中写笔记
2. **AI 辅助优化** — 切换到 🤖 AI 助手标签，获取分类专属的 AI 帮助
3. **管理章节** — 在右面板创建章节，或通过章节结构上的 📂 按钮导入
4. **AI 写作** — 选择章节，然后使用 AI 写手面板生成内容
5. **选择草稿** — 点击好的 AI 输出上的 "📋 Use as Draft" 推送到章节编辑器
6. **导入/导出** — 使用 💾 JSON 导出保存项目，📂 导入恢复，或 🧠 智能导入处理任意格式

## 技术栈

- 独立 Web 应用（HTML / CSS / JS）
- localStorage 持久化存储
- Marked（Markdown 解析，本地打包）
- Mermaid（流程图渲染，本地打包）
- KaTeX（数学公式渲染，本地打包）

## 作者

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [网站](https://franks-intellab.github.io/)

## 许可证

[MIT](LICENSE)
