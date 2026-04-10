// === LuminTree-Intel — Novel Creation Studio ===
// Fixed 6-category tree for structured novel development
// Categories: Core Concept, Worldview, Plot Framework, Character Library, Chapter Structure, Writing Materials

const treeEl = document.getElementById("tree");
const treeView = document.getElementById("tree-view");
const settingsEl = document.getElementById("settings");
const chatArea = document.getElementById("chat-area");
const chatMessages = document.getElementById("chat-messages");
const chatSnippet = document.getElementById("chat-snippet");
const chatInput = document.getElementById("chat-input");
const chatBreadcrumb = document.getElementById("chat-breadcrumb");
const branchBtn = document.getElementById("branch-btn");
const statusEl = document.getElementById("settings-status");

// --- Fixed Category Definitions ---
const CATEGORIES = [
  { id: "core-concept", title: "📖 Core Concept & Story Positioning", icon: "📖", placeholder: "Genre, theme, logline, target audience, core conflict..." },
  { id: "worldview", title: "🌍 Worldview Setting", icon: "🌍", placeholder: "World rules, geography, magic systems, technology, history, factions..." },
  { id: "plot-framework", title: "📐 Plot Framework", icon: "📐", placeholder: "Story arcs, turning points, act structure, subplot threads..." },
  { id: "character-library", title: "👤 Character Profile Library", icon: "👤", placeholder: "Character bios, motivations, relationships, voice notes, OOC boundaries..." },
  { id: "chapter-structure", title: "📑 Chapter Structure", icon: "📑", placeholder: "Chapter outlines, scene breakdowns, pacing notes, POV assignments..." },
  { id: "writing-materials", title: "🗂 Writing Material Library", icon: "🗂", placeholder: "Reference snippets, inspiration, research notes, style references..." }
];

// --- AI System Prompts per Category (novel creation agent) ---
const CATEGORY_PROMPTS = {
  "core-concept": "You are a novel development AI assistant. The user is working on the core concept and story positioning of their novel. Help them refine their genre, theme, logline, target audience, and central conflict. Be specific and actionable. Challenge weak premises. Suggest ways to sharpen the hook.",
  "worldview": "You are a worldbuilding AI assistant for novel creation. Help the user develop consistent, immersive world settings — geography, rules, magic/technology systems, history, cultures, factions. Flag internal contradictions. Suggest details that deepen verisimilitude.",
  "plot-framework": "You are a plot architecture AI assistant. Help the user design story arcs, turning points, act structures, and subplot threads. Identify pacing issues, missing stakes, or logical gaps. Reference proven narrative structures (3-act, Save the Cat, Kishotenketsu, etc.) when relevant.",
  "character-library": "You are a character development AI assistant focused on OOC (out-of-character) prevention. Help the user build deep character profiles — motivations, backstory, speech patterns, relationships, internal contradictions. Flag when proposed actions would break established character logic. Suggest character-consistent alternatives.",
  "chapter-structure": "You are a chapter planning AI assistant. Help the user organize chapters, scene breakdowns, POV assignments, and pacing. Ensure each chapter has clear purpose and forward momentum. Flag chapters that lack conflict or character development.",
  "writing-materials": "You are a writing research AI assistant. Help the user organize reference materials, inspiration snippets, style notes, and research findings. Suggest how collected materials connect to their story elements. Help categorize and tag materials for easy retrieval."
};

// --- Data ---
// Each node: { id, parentId, categoryId, title, fullText, timestamp, children: [], chatHistory: [] }
let nodes = [];
let activeNodeId = null;
let targetParentId = null; // pinned parent for next push
let conversationHistory = [];
let isVoiceInput = false;

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function truncate(text, len = 50) {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function formatTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function findNode(id, list = nodes) {
  for (const n of list) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return null;
}

// Find which fixed category a node belongs to
function getNodeCategory(node) {
  if (node.categoryId) return node.categoryId;
  // Walk up to root to find category
  let current = node;
  while (current.parentId) {
    current = findNode(current.parentId);
    if (!current) break;
  }
  return current ? current.categoryId : null;
}

// Get ancestor chain for breadcrumb
function getAncestors(id) {
  const path = [];
  let node = findNode(id);
  while (node) {
    path.unshift(node);
    node = node.parentId ? findNode(node.parentId) : null;
  }
  return path;
}

// Initialize fixed category root nodes if they don't exist
function ensureCategories() {
  for (const cat of CATEGORIES) {
    const exists = nodes.find(n => n.categoryId === cat.id && !n.parentId);
    if (!exists) {
      nodes.push({
        id: cat.id,
        parentId: null,
        categoryId: cat.id,
        title: cat.title,
        fullText: cat.placeholder,
        timestamp: new Date().toISOString(),
        children: [],
        chatHistory: [],
        isCategory: true // marks this as a fixed category root — cannot be deleted
      });
    }
  }
}

function addNode(text, parentId = null, sourceUrl = "") {
  // If no parent specified and a category is pinned, use that
  const effectiveParent = parentId || targetParentId;
  // If still no parent, default to writing-materials category
  const finalParent = effectiveParent || "writing-materials";

  const node = {
    id: genId(),
    parentId: finalParent,
    categoryId: null, // inherits from parent chain
    title: truncate(text),
    fullText: text,
    sourceUrl,
    timestamp: new Date().toISOString(),
    children: [],
    chatHistory: []
  };

  const parent = findNode(finalParent);
  if (parent) parent.children.push(node);

  saveTree();
  renderTree();
  // Ask AI for a concise title
  generateTitle(node);
  return node;
}

async function generateTitle(node) {
  const cfg = await getConfig();
  if (!cfg.url || !cfg.key) return;
  const catId = getNodeCategory(node);
  const catContext = catId ? CATEGORIES.find(c => c.id === catId)?.title : "novel writing";
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: `Generate a concise one-line title (max 8 words) for this novel writing note in the "${catContext}" category. Return ONLY the title, nothing else.` },
          { role: "user", content: node.fullText }
        ]
      })
    });
    if (!res.ok) return;
    const data = await res.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    if (title) {
      node.title = title.replace(/^["']|["']$/g, "");
      saveTree();
      renderTree();
    }
  } catch {}
}

function removeNode(id, list = nodes) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      // Prevent deleting fixed category roots
      if (list[i].isCategory) return false;
      list.splice(i, 1); saveTree(); renderTree(); return true;
    }
    if (removeNode(id, list[i].children)) return true;
  }
  return false;
}

// --- Persistence (chrome.storage.local, namespaced keys) ---

function saveTree() {
  chrome.storage.local.set({ lumintree_tree: nodes });
}

function loadTree() {
  chrome.storage.local.get(["lumintree_tree"], (data) => {
    nodes = data.lumintree_tree || [];
    ensureCategories();
    renderTree();
  });
}

// --- Tree rendering ---

// Collect all nodes in a subtree
function collectNodes(node, out = []) {
  out.push(node);
  for (const c of node.children) collectNodes(c, out);
  return out;
}

// Sets of nodeIds for last-accessed highlights (rebuilt each render)
let lastReadIds = new Set();
let prevReadIds = new Set();

function renderTree() {
  treeEl.innerHTML = "";
  // Build last-read and prev-read sets per category root
  lastReadIds = new Set();
  prevReadIds = new Set();
  for (const root of nodes) {
    const all = collectNodes(root);
    all.sort((a, b) => (b.lastAccessedAt || b.timestamp || "").localeCompare(a.lastAccessedAt || a.timestamp || ""));
    if (all[0]) lastReadIds.add(all[0].id);
    if (all[1]) prevReadIds.add(all[1].id);
  }
  // Show pinned parent indicator
  const indicator = document.getElementById("pin-indicator");
  if (indicator) indicator.remove();
  if (targetParentId) {
    const node = findNode(targetParentId);
    if (node) {
      const bar = document.createElement("div");
      bar.id = "pin-indicator";
      bar.className = "pin-indicator";
      bar.innerHTML = `📌 Next push → child of "<b>${truncate(node.title, 30)}</b>" <button id="unpin-btn">✕ Unpin</button>`;
      treeEl.before(bar);
      document.getElementById("unpin-btn").addEventListener("click", () => {
        targetParentId = null;
        renderTree();
      });
    }
  }
  // Render fixed category roots in defined order
  for (const cat of CATEGORIES) {
    const root = nodes.find(n => n.categoryId === cat.id && !n.parentId);
    if (root) treeEl.appendChild(renderNodeEl(root, 0));
  }
  exportBtn.classList.remove("hidden");
  previewBtn.classList.remove("hidden");
  jsonExportBtn.classList.remove("hidden");
}

function renderNodeEl(node, depth) {
  const wrap = document.createElement("div");
  wrap.className = "tree-node";
  wrap.style.paddingLeft = (depth * 16) + "px";

  const row = document.createElement("div");
  row.className = "tree-row"
    + (node.id === targetParentId ? " pinned" : "")
    + (lastReadIds.has(node.id) ? " last-read" : prevReadIds.has(node.id) ? " prev-read" : "")
    + (node.isCategory ? " category-root" : "");

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";
  if (node.children.length > 0) {
    toggle.textContent = "▼";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const childContainer = wrap.querySelector(".tree-children");
      if (childContainer) {
        const collapsed = childContainer.classList.toggle("hidden");
        toggle.textContent = collapsed ? "▶" : "▼";
      }
    });
  } else {
    toggle.textContent = node.isCategory ? "▶" : "•";
  }

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = node.title;
  label.title = node.fullText;
  label.addEventListener("click", () => openChat(node.id));

  const ts = document.createElement("span");
  ts.className = "tree-time";
  ts.textContent = node.isCategory ? "" : formatTime(node.timestamp);

  // Preview this branch
  const exp = document.createElement("button");
  exp.className = "tree-export";
  exp.textContent = "👁";
  exp.title = "Preview this branch";
  exp.addEventListener("click", (e) => { e.stopPropagation(); showPreview([node]); });

  // Download this branch as Markdown
  const dl = document.createElement("button");
  dl.className = "tree-export";
  dl.textContent = "📥";
  dl.title = "Download this branch (Markdown)";
  dl.addEventListener("click", (e) => { e.stopPropagation(); exportBranch(node); });

  // Export this branch as JSON
  const jsonDl = document.createElement("button");
  jsonDl.className = "tree-export";
  jsonDl.textContent = "💾";
  jsonDl.title = "Export this branch (JSON)";
  jsonDl.addEventListener("click", (e) => { e.stopPropagation(); exportBranchJson(node); });

  // Pin as parent button
  const pin = document.createElement("button");
  pin.className = "tree-pin";
  pin.textContent = node.id === targetParentId ? "📌" : "🔗";
  pin.title = node.id === targetParentId ? "Unpin" : "Pin as parent for next push";
  pin.addEventListener("click", (e) => {
    e.stopPropagation();
    targetParentId = targetParentId === node.id ? null : node.id;
    renderTree();
  });

  // Delete button (hidden for category roots)
  const del = document.createElement("button");
  del.className = "tree-del";
  del.textContent = "✕";
  del.title = "Delete node";
  if (!node.isCategory) {
    del.addEventListener("click", (e) => { e.stopPropagation(); removeNode(node.id); });
  } else {
    del.style.display = "none";
  }

  row.appendChild(toggle);
  row.appendChild(label);
  row.appendChild(ts);
  if (node.sourceUrl) {
    const src = document.createElement("a");
    src.className = "tree-source";
    src.href = node.sourceUrl;
    src.textContent = "📄";
    src.title = node.sourceUrl;
    src.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.create({ url: node.sourceUrl });
    });
    row.appendChild(src);
  }
  row.appendChild(exp);
  row.appendChild(dl);
  row.appendChild(jsonDl);
  row.appendChild(pin);
  row.appendChild(del);
  wrap.appendChild(row);

  if (node.children.length > 0) {
    const childContainer = document.createElement("div");
    childContainer.className = "tree-children";
    node.children.forEach(c => childContainer.appendChild(renderNodeEl(c, depth + 1)));
    wrap.appendChild(childContainer);
  }

  return wrap;
}

// --- Chat (novel creation AI agent) ---

function openChat(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  activeNodeId = nodeId;
  node.lastAccessedAt = new Date().toISOString();
  saveTree();
  conversationHistory = node.chatHistory.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }));

  // Breadcrumb showing category path
  const ancestors = getAncestors(nodeId);
  chatBreadcrumb.textContent = ancestors.map(n => truncate(n.title, 20)).join(" → ");

  chatSnippet.textContent = node.fullText;
  if (node.sourceUrl) {
    const srcLink = document.createElement("a");
    srcLink.className = "snippet-source";
    srcLink.href = node.sourceUrl;
    srcLink.textContent = node.sourceUrl.length > 60 ? node.sourceUrl.slice(0, 60) + "…" : node.sourceUrl;
    srcLink.title = node.sourceUrl;
    srcLink.addEventListener("click", (e) => { e.preventDefault(); chrome.tabs.create({ url: node.sourceUrl }); });
    chatSnippet.appendChild(document.createElement("br"));
    chatSnippet.appendChild(srcLink);
  }
  chatMessages.innerHTML = "";
  node.chatHistory.forEach(m => appendMsg(m.role, m.content, false, m.timestamp));

  treeView.classList.add("hidden");
  chatArea.classList.remove("hidden");
  branchBtn.classList.add("hidden");
  chatInput.focus();
}

document.getElementById("chat-back").addEventListener("click", () => {
  chatArea.classList.add("hidden");
  treeView.classList.remove("hidden");
});

document.getElementById("chat-send").addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// --- Voice Input (injected into active tab) ---

const voiceBtn = document.getElementById("voice-btn");

voiceBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "start-voice-in-tab" });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "push-text") {
    addNode(msg.text, targetParentId, msg.sourceUrl || "");
    if (targetParentId) { targetParentId = null; renderTree(); }
  }
  if (msg.type === "voice-final") {
    chatInput.value = msg.text;
    isVoiceInput = true;
    sendMessage();
  }
});

// Show branch button when user selects text in chat messages
chatMessages.addEventListener("mouseup", () => {
  const sel = window.getSelection().toString().trim();
  branchBtn.classList.toggle("hidden", sel.length === 0);
});

branchBtn.addEventListener("click", () => {
  const sel = window.getSelection().toString().trim();
  if (!sel || !activeNodeId) return;
  const child = addNode(sel, activeNodeId);
  branchBtn.classList.add("hidden");
  window.getSelection().removeAllRanges();
  openChat(child.id);
});

async function sendMessage() {
  const question = chatInput.value.trim();
  if (!question) return;

  appendMsg("user", question);
  chatInput.value = "";

  const cfg = await getConfig();
  if (!cfg.url || !cfg.key) {
    appendMsg("assistant", "⚠️ Please configure your LLM API in settings first.");
    return;
  }

  const node = findNode(activeNodeId);
  conversationHistory.push({ role: "user", content: question, timestamp: new Date().toISOString() });

  // Build novel-creation-aware system prompt based on category
  const catId = getNodeCategory(node);
  const categoryPrompt = CATEGORY_PROMPTS[catId] || "You are a novel creation AI assistant. Help the user develop their story.";

  // Build context from ancestor chain (shows the creative hierarchy)
  const ancestors = getAncestors(activeNodeId);
  const contextChain = ancestors.map(n => `"${truncate(n.fullText, 200)}"`).join(" → ");

  const systemPrompt = `${categoryPrompt}

Creative hierarchy path: ${contextChain}

Current focus:
"${node.fullText}"

Guidelines:
- Stay in character as a novel creation assistant
- Give specific, actionable creative suggestions
- Flag plot holes, character inconsistencies, or worldbuilding contradictions
- Reference the user's established story elements when relevant
- Never generate full chapters unless explicitly asked — focus on planning and structure`
    + (isVoiceInput ? `\nThe user's message was voice-transcribed; silently accommodate any speech artifacts without mentioning them.` : "");
  isVoiceInput = false;

  try {
    // Show thinking indicator
    const thinkingEl = document.createElement("div");
    thinkingEl.className = "msg msg-thinking";
    thinkingEl.innerHTML = '<span class="thinking-dots">Thinking</span>';
    chatMessages.appendChild(thinkingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cfg.key}`
      },
      body: JSON.stringify({
        model: cfg.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ]
      })
    });

    thinkingEl.remove();

    if (!res.ok) {
      const err = await res.text();
      appendMsg("assistant", `⚠️ API error ${res.status}: ${err}`);
      return;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(empty response)";
    conversationHistory.push({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
    appendMsg("assistant", reply);

    // Persist chat history to node
    node.chatHistory = conversationHistory.map(m => ({ ...m }));
    saveTree();
  } catch (e) {
    const leftover = chatMessages.querySelector(".msg-thinking");
    if (leftover) leftover.remove();
    appendMsg("assistant", `⚠️ Request failed: ${e.message}`);
  }
}

// --- Markdown / KaTeX rendering ---

function renderContent(text) {
  const blocks = [];
  let i = 0;
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/\\\((.*?)\\\)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  text = text.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_, tex) => {
    const id = `%%BLOCK${i}%%`;
    try { blocks[i] = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }); } catch { blocks[i] = tex; }
    i++; return id;
  });
  let html = marked.parse(text);
  for (let j = 0; j < blocks.length; j++) html = html.replace(`%%BLOCK${j}%%`, blocks[j]);
  return html;
}

function appendMsg(role, content, scroll = true, timestamp = null) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  const ts = document.createElement("span");
  ts.className = "msg-time";
  ts.textContent = formatTime(timestamp || new Date().toISOString());
  if (role === "assistant") {
    div.innerHTML = renderContent(content);
  } else {
    div.textContent = content;
  }
  div.appendChild(ts);
  chatMessages.appendChild(div);
  if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["lumintree_api"], (data) => resolve(data.lumintree_api || {}));
  });
}

// --- Settings ---

document.getElementById("settings-btn").addEventListener("click", () => settingsEl.classList.toggle("hidden"));

const PRESETS = {
  dashscope: { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-plus" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
};

document.getElementById("api-preset").addEventListener("change", (e) => {
  const p = PRESETS[e.target.value];
  if (p) { document.getElementById("api-url").value = p.url; document.getElementById("api-model").value = p.model; }
});

chrome.storage.local.get(["lumintree_api"], (data) => {
  const cfg = data.lumintree_api || {};
  document.getElementById("api-url").value = cfg.url || "";
  document.getElementById("api-key").value = cfg.key || "";
  document.getElementById("api-model").value = cfg.model || "";
});

document.getElementById("save-settings").addEventListener("click", () => {
  const cfg = {
    url: document.getElementById("api-url").value.trim(),
    key: document.getElementById("api-key").value.trim(),
    model: document.getElementById("api-model").value.trim()
  };
  chrome.storage.local.set({ lumintree_api: cfg }, () => {
    statusEl.textContent = "✓ Saved";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  });
});

// --- Init ---
loadTree();

// --- Export ---

const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", exportMarkdown);

const previewBtn = document.getElementById("preview-btn");
previewBtn.addEventListener("click", () => showPreview(nodes));

document.getElementById("preview-back").addEventListener("click", () => {
  document.getElementById("preview-area").classList.add("hidden");
  treeView.classList.remove("hidden");
});

const jsonExportBtn = document.getElementById("json-export-btn");
jsonExportBtn.addEventListener("click", exportAllJson);

const jsonImportFile = document.getElementById("json-import-file");
document.getElementById("json-import-btn").addEventListener("click", () => jsonImportFile.click());
jsonImportFile.addEventListener("change", (e) => {
  if (e.target.files[0]) { importJson(e.target.files[0]); e.target.value = ""; }
});

// Init mermaid
mermaid.initialize({ startOnLoad: false, theme: "default" });

async function showPreview(rootNodes) {
  const md = buildExportMd(rootNodes);
  const previewArea = document.getElementById("preview-area");
  const previewContent = document.getElementById("preview-content");

  let mermaidCode = "";
  const mdWithoutMermaid = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
    mermaidCode = code;
    return "%%MERMAID%%";
  });

  let html = renderContent(mdWithoutMermaid);

  if (mermaidCode) {
    try {
      const { svg } = await mermaid.render("mermaid-preview", mermaidCode);
      html = html.replace("%%MERMAID%%", `<div class="mermaid-chart">${svg}</div>`);
    } catch {
      html = html.replace("%%MERMAID%%", `<pre>${mermaidCode}</pre>`);
    }
  }

  previewContent.innerHTML = html;
  treeView.classList.add("hidden");
  chatArea.classList.add("hidden");
  previewArea.classList.remove("hidden");
}

function exportMarkdown() {
  if (nodes.length === 0) return;
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`lumintree-export-${date}.md`, buildExportMd(nodes));
}

function exportBranch(node) {
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`lumintree-${node.id}-${date}.md`, buildExportMd([node]));
}

function exportBranchJson(node) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify([node], null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumintree-${node.id}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAllJson() {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumintree-export-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      // Merge imported nodes into existing categories or append
      for (const imp of imported) {
        if (imp.isCategory && imp.categoryId) {
          // Merge children into existing category
          const existing = nodes.find(n => n.categoryId === imp.categoryId && n.isCategory);
          if (existing) {
            existing.children.push(...(imp.children || []));
            continue;
          }
        }
        nodes.push(imp);
      }
      ensureCategories();
      saveTree();
      renderTree();
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function buildExportMd(rootNodes) {
  const date = new Date().toISOString().slice(0, 10);
  let md = `# LuminTree — Novel Project Export (${date})\n\n`;

  md += "```mermaid\nflowchart TD\n";
  const allNodes = [];
  flattenNodes(rootNodes, allNodes);
  allNodes.forEach(n => {
    const label = escapeMermaid(n.title);
    const time = n.isCategory ? "" : formatTime(n.timestamp);
    md += `  ${n.id}["${label}${time ? '<br/><i>' + time + '</i>' : ''}"]\n`;
  });
  allNodes.forEach(n => {
    n.children.forEach(c => { md += `  ${n.id} --> ${c.id}\n`; });
  });
  md += "```\n\n---\n\n";

  md += "## Novel Structure\n\n";
  rootNodes.forEach(n => { md += renderNodeMd(n, 2); });
  return md;
}

function flattenNodes(list, out) {
  list.forEach(n => { out.push(n); flattenNodes(n.children, out); });
}

function renderNodeMd(node, headingLevel) {
  const h = "#".repeat(Math.min(headingLevel, 6));
  let md = `${h} ${node.title}\n`;
  if (!node.isCategory) {
    md += `> ${node.fullText.replace(/\n/g, "\n> ")}\n`;
    md += `> *${formatTime(node.timestamp)}*`;
    if (node.sourceUrl) md += ` | [Source](${node.sourceUrl})`;
    md += `\n\n`;
  } else {
    md += "\n";
  }

  if (node.chatHistory && node.chatHistory.length > 0) {
    node.chatHistory.forEach(m => {
      if (m.role === "user") {
        md += `**Q:** ${m.content} *(${formatTime(m.timestamp)})*\n\n`;
      } else {
        md += `**A:** ${m.content}\n\n`;
      }
    });
  }

  node.children.forEach(c => { md += renderNodeMd(c, headingLevel + 1); });
  return md;
}

function escapeMermaid(text) {
  return text.replace(/"/g, "'").replace(/[[\](){}]/g, " ").replace(/\n/g, " ");
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
