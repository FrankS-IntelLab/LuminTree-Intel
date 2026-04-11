# LuminTree-Intel

**Intelligence Applied — Structured creative simulation through AI-assisted novel creation.**

## Why a Novel Writing Tool in an Intelligence Lab?

We see intelligence as a two-way process:

- **Intelligence In** — absorbing, organizing, and storing knowledge (study, research, reading)
- **Intelligence Out** — applying knowledge to construct coherent, functioning systems (creation, simulation, design)

Some read novel creation as art. Some read it as self-exploration. We read it as the **application side of intelligence**.

Novel creation is one of the most demanding forms of intelligence application. It requires you to:

- Define a world with consistent rules (system architecture)
- Create agents with internal logic and constraints (entity modeling)
- Design interactions that produce emergent outcomes (relationship dynamics)
- Maintain consistency across thousands of decisions (state management)
- Iterate based on feedback (testing and refinement)

That's not just art — that's engineering a simulation. The fact that the output is prose doesn't change the underlying cognitive process.

**LuminTree-Intel** is our tool for exploring this applied side of intelligence. A standalone web app with a 4-panel layout for structured worldbuilding, plot design, character profiling, chapter management, and AI-assisted writing.

## System Architecture (The 6-Category Tree)

The tree isn't organized by writing craft categories. It's organized by **system components** — an intelligence architecture for creative simulation:

```
📖 Core Concept        → The thesis: genre, theme, logline, core conflict
🌍 Worldview Setting   → The system: world rules, geography, magic, history, factions
📐 Plot Framework      → The causal logic: story arcs, turning points, subplots
👤 Character Profiles  → The agents: bios, motivations, relationships, behavioral boundaries
📑 Chapter Structure   → The execution plan: outlines, scenes, pacing, POV assignments
🗂 Writing Materials   → The interface layer: style directives, references, research notes
```

## Features

- **4-panel resizable layout** — Tree (structure) · Editor + AI Assistant (refinement) · Chapters (execution) · AI Writer (generation)
- **Category-aware AI assistant** — Each category has a specialized AI prompt. Ask about characters → character expert. Ask about plot → plot expert.
- **AI Writer** — Dedicated panel that reads all your settings and strictly follows your Writing Material Library style directives. No drift, no breaking character.
- **Use as Draft** — One click to push AI output into the chapter editor
- **Voice input** — Chinese/English speech-to-text for all AI chat inputs. Double-click 🎤 to switch language.
- **Smart Import** — Feed it any file (JSON, TXT, MD) — even messy formats — and AI auto-classifies content into the correct categories
- **Compile & Export** — One-click compile all chapters into Markdown or PDF with automatic chapter pagination
- **Two-way chapter sync** — Chapter Structure tree and Chapters panel always stay linked
- **Drag & drop** — Rearrange tree node relationships by dragging
- **Persistent AI history** — Conversations saved per node and per chapter
- **Clear Memory** — Reset AI Writer conversation per chapter for a fresh start
- **Full JSON export/import** — Complete project backup including tree, chapters, and all AI chat history
- **Local-first** — All data in localStorage, nothing uploaded, your story stays yours
- **Bring your own API key** — Presets for DashScope (Qwen) and OpenAI, or any compatible endpoint

## Quick Start

1. Clone this repo
2. Open `index.html` in your browser (or `python3 -m http.server 8080` for voice input support)
3. Click ⚙️ to configure your AI API
4. Start building your simulation

## Configure LLM

Click ⚙️:

| Field | Example |
|---|---|
| Preset | DashScope (Qwen) / OpenAI / Custom |
| API Endpoint | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` |
| API Key | Your API key |
| Model | `qwen-plus`, `gpt-4o-mini`, etc. |

Any OpenAI-compatible endpoint works.

## Tech Stack

- Standalone Web App (HTML / CSS / JS) — zero backend, zero dependencies
- localStorage for persistence
- Marked · Mermaid · KaTeX (all bundled locally)

## Author

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [Website](https://franks-intellab.github.io/)

## License

[MIT](LICENSE)

---

# LuminTree-Intel（中文说明）

**智能的应用侧 —— 通过 AI 辅助小说创作进行结构化创意仿真。**

## 为什么一个智能实验室要做小说创作工具？

我们把智能看作一个双向过程：

- **智能输入** —— 吸收、组织、存储知识（学习、研究、阅读）
- **智能输出** —— 运用知识构建连贯、自洽的系统（创作、仿真、设计）

有人把小说创作看作艺术，有人看作自我探索，而我们把它看作**智能的应用侧**。

小说创作是最具挑战性的智能应用形式之一，它要求你：

- 定义一个规则自洽的世界（系统架构）
- 创建具有内在逻辑和约束的角色（实体建模）
- 设计产生涌现结果的交互（关系动力学）
- 在成千上万个决策中保持一致性（状态管理）
- 根据反馈迭代优化（测试与改进）

这不仅仅是艺术——这是在工程化地构建一个仿真系统。输出恰好是文字，并不改变背后的认知过程。

**LuminTree-Intel** 是我们探索智能应用侧的工具。一款独立 Web 应用，采用 4 面板布局，提供结构化的世界观构建、情节设计、角色建模、章节管理和 AI 辅助写作。

## 系统架构（6 大分类树）

这棵树不是按写作技巧分类的，而是按**系统组件**组织的——一个面向创意仿真的智能架构：

```
📖 核心设定    → 论题：类型、主题、核心冲突、目标读者
🌍 世界观设定  → 系统：世界规则、地理、魔法体系、历史、势力
📐 情节框架    → 因果逻辑：故事弧线、转折点、支线剧情
👤 角色档案    → 智能体：人物传记、动机、关系网、行为边界
📑 章节结构    → 执行计划：章节大纲、场景分解、节奏、视角
🗂 写作素材    → 接口层：风格指令、参考片段、研究笔记
```

## 功能

- **4 面板可调布局** —— 树结构 · 编辑器+AI助手 · 章节 · AI写手
- **分类感知 AI 助手** —— 每个分类有专属提示词，问角色问题就是角色专家，问情节就是情节专家
- **AI 写手** —— 读取所有设定，严格遵循写作素材库中的风格指令，不跑偏，不出戏
- **一键用作草稿** —— AI 输出满意？一键推送到编辑器
- **语音输入** —— 中英文语音转文字，双击 🎤 切换语言
- **智能导入** —— JSON、TXT、MD 甚至乱格式，AI 自动分类到正确位置
- **编译导出** —— 一键编译全书为 Markdown 或 PDF，每章自动分页
- **双向章节同步** —— 章节结构树与章节面板始终保持链接
- **拖拽排序** —— 拖拽调整树节点的父子关系
- **持久化 AI 记录** —— 按节点和章节保存对话
- **清除记忆** —— 按章节重置 AI 写手对话
- **完整 JSON 导入/导出** —— 包含树、章节和所有 AI 聊天记录
- **数据全在本地** —— localStorage 存储，不上传任何服务器
- **自带 API Key** —— 支持通义千问、OpenAI 或任何兼容接口

## 快速开始

1. 克隆本仓库
2. 浏览器打开 `index.html`（或 `python3 -m http.server 8080` 以支持语音输入）
3. 点击 ⚙️ 配置 AI API
4. 开始构建你的仿真系统

## 技术栈

- 独立 Web 应用（HTML / CSS / JS）—— 零后端，零依赖
- localStorage 持久化存储
- Marked · Mermaid · KaTeX（均本地打包）

## 作者

**Frank Sun** — [GitHub](https://github.com/FrankS-IntelLab) · [网站](https://franks-intellab.github.io/)

## 许可证

[MIT](LICENSE)
