// === LuminTree-Intel — Novel Creation Studio (Web App) ===
// Fixed 6-category tree for structured novel development
// Storage: localStorage | Voice: Web Speech API (direct, no extension injection)

const treeEl = document.getElementById("tree");
const treeView = document.getElementById("tree-view");
const settingsEl = document.getElementById("settings");
const chatArea = document.getElementById("chat-area");
const chatSnippet = document.getElementById("chat-snippet");
const chatBreadcrumb = document.getElementById("chat-breadcrumb");
const statusEl = document.getElementById("settings-status");

// --- Fixed Category Definitions ---
const CATEGORIES = [
  { id: "core-concept", title: "📖 Core Concept & Story Positioning", icon: "📖", placeholder: "Genre, theme, logline, target audience, core conflict..." },
  { id: "worldview", title: "🌍 Worldview Setting", icon: "🌍", placeholder: "World rules, geography, magic systems, technology, history, factions..." },
  { id: "plot-framework", title: "📐 Plot Framework", icon: "📐", placeholder: "Story arcs, turning points, act structure, subplot threads..." },
  { id: "character-library", title: "👤 Character Profile Library", icon: "👤", placeholder: "Character bios, motivations, relationships, voice notes, OOC boundaries..." },
  { id: "chapter-structure", title: "📑 Chapter Structure", icon: "📑", placeholder: "Governs chapter organization. Each child node links to a chapter in the right panel. Use to plan: how chapters end/begin, non-linear timeline, scene transitions, POV shifts, pacing across chapters..." },
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
let nodes = [];
let activeNodeId = null;
let targetParentId = null;

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

function getNodeCategory(node) {
  if (node.categoryId) return node.categoryId;
  let current = node;
  while (current.parentId) {
    current = findNode(current.parentId);
    if (!current) break;
  }
  return current ? current.categoryId : null;
}

function getAncestors(id) {
  const path = [];
  let node = findNode(id);
  while (node) {
    path.unshift(node);
    node = node.parentId ? findNode(node.parentId) : null;
  }
  return path;
}

function ensureCategories() {
  for (const cat of CATEGORIES) {
    const exists = nodes.find(n => n.categoryId === cat.id && !n.parentId);
    if (!exists) {
      nodes.push({
        id: cat.id, parentId: null, categoryId: cat.id,
        title: cat.title, fullText: cat.placeholder,
        timestamp: new Date().toISOString(),
        children: [], chatHistory: [], isCategory: true
      });
    }
  }
}

function addNode(text, parentId = null) {
  const finalParent = parentId || targetParentId || "writing-materials";
  const node = {
    id: genId(), parentId: finalParent, categoryId: null,
    title: truncate(text), fullText: text,
    timestamp: new Date().toISOString(),
    children: [], chatHistory: []
  };
  const parent = findNode(finalParent);
  if (parent) parent.children.push(node);

  // If adding under chapter-structure, also create a linked chapter in right panel
  if (getNodeCategory(node) === "chapter-structure" && !node.isCategory) {
    node.chapterId = node.id; // link: tree node id = chapter id
    const ch = { id: node.id, title: node.title, content: "" };
    chapters.push(ch);
    saveChapters();
  }

  saveTree();
  renderTree();
  renderChapters();
  generateTitle(node);
  return node;
}

async function generateTitle(node) {
  const cfg = getConfig();
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
      // Sync title to linked chapter if exists
      if (node.chapterId) {
        const ch = chapters.find(c => c.id === node.chapterId);
        if (ch) { ch.title = node.title; saveChapters(); }
      }
      saveTree();
      renderTree();
      renderChapters();
    }
  } catch {}
}

function removeNode(id, list = nodes) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      if (list[i].isCategory) return false;
      // Remove linked chapter if exists
      if (list[i].chapterId) {
        const ci = chapters.findIndex(c => c.id === list[i].chapterId);
        if (ci !== -1) { chapters.splice(ci, 1); saveChapters(); }
        if (activeChapterId === list[i].chapterId) activeChapterId = null;
      }
      list.splice(i, 1); saveTree(); renderTree(); renderChapters(); return true;
    }
    if (removeNode(id, list[i].children)) return true;
  }
  return false;
}

// Move a node to become a child of a new parent (for drag-and-drop rearranging)
function moveNodeToParent(nodeId, newParentId) {
  const node = findNode(nodeId);
  const newParent = findNode(newParentId);
  if (!node || !newParent || node.isCategory) return;
  // Prevent dropping onto self or own descendant
  let check = newParent;
  while (check) {
    if (check.id === nodeId) return;
    check = check.parentId ? findNode(check.parentId) : null;
  }
  // Detach from old parent
  const oldParent = findNode(node.parentId);
  if (!oldParent) return;
  const idx = oldParent.children.indexOf(node);
  if (idx === -1) return;
  oldParent.children.splice(idx, 1);
  // Attach to new parent
  node.parentId = newParentId;
  newParent.children.push(node);
  saveTree();
  renderTree();
}

// --- Persistence (localStorage) ---

function saveTree() {
  try { localStorage.setItem("lumintree_tree", JSON.stringify(nodes)); } catch {}
}

function loadTree() {
  try { nodes = JSON.parse(localStorage.getItem("lumintree_tree")) || []; } catch { nodes = []; }
  ensureCategories();
  renderTree();
}

// --- Tree rendering ---

function collectNodes(node, out = []) {
  out.push(node);
  for (const c of node.children) collectNodes(c, out);
  return out;
}

let lastReadIds = new Set();
let prevReadIds = new Set();

function renderTree() {
  treeEl.innerHTML = "";
  lastReadIds = new Set();
  prevReadIds = new Set();
  for (const root of nodes) {
    const all = collectNodes(root);
    all.sort((a, b) => (b.lastAccessedAt || b.timestamp || "").localeCompare(a.lastAccessedAt || a.timestamp || ""));
    if (all[0]) lastReadIds.add(all[0].id);
    if (all[1]) prevReadIds.add(all[1].id);
  }
  const indicator = document.getElementById("pin-indicator");
  if (indicator) indicator.remove();
  if (targetParentId) {
    const node = findNode(targetParentId);
    if (node) {
      const bar = document.createElement("div");
      bar.id = "pin-indicator";
      bar.className = "pin-indicator";
      bar.innerHTML = `📌 Next node → child of "<b>${truncate(node.title, 30)}</b>" <button id="unpin-btn">✕ Unpin</button>`;
      treeEl.before(bar);
      document.getElementById("unpin-btn").addEventListener("click", () => {
        targetParentId = null;
        renderTree();
      });
    }
  }
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

  // Drag-and-drop for rearranging parent-child relationships
  if (!node.isCategory) {
    row.draggable = true;
    row.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      e.dataTransfer.setData("text/plain", node.id);
      e.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => { row.classList.remove("dragging"); });
  }
  // All nodes (including categories) can be drop targets
  row.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    row.classList.add("drag-over");
  });
  row.addEventListener("dragleave", () => { row.classList.remove("drag-over"); });
  row.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    row.classList.remove("drag-over");
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== node.id) {
      moveNodeToParent(draggedId, node.id);
    }
  });

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
  label.textContent = (node.chapterId ? "🔗 " : "") + node.title;
  label.title = node.chapterId ? `Linked to chapter panel — click to edit structure notes` : node.fullText;
  label.addEventListener("click", () => openChat(node.id));

  const ts = document.createElement("span");
  ts.className = "tree-time";
  ts.textContent = node.isCategory ? "" : formatTime(node.timestamp);

  const exp = document.createElement("button");
  exp.className = "tree-export";
  exp.textContent = "👁";
  exp.title = "Preview this branch";
  exp.addEventListener("click", (e) => { e.stopPropagation(); showPreview([node]); });

  const dl = document.createElement("button");
  dl.className = "tree-export";
  dl.textContent = "📥";
  dl.title = "Download this branch (Markdown)";
  dl.addEventListener("click", (e) => { e.stopPropagation(); exportBranch(node); });

  const jsonDl = document.createElement("button");
  jsonDl.className = "tree-export";
  jsonDl.textContent = "💾";
  jsonDl.title = "Export this branch (JSON)";
  jsonDl.addEventListener("click", (e) => { e.stopPropagation(); exportBranchJson(node); });

  const pin = document.createElement("button");
  pin.className = "tree-pin";
  pin.textContent = node.id === targetParentId ? "📌" : "🔗";
  pin.title = node.id === targetParentId ? "Unpin" : "Pin as parent for next node";
  pin.addEventListener("click", (e) => {
    e.stopPropagation();
    targetParentId = targetParentId === node.id ? null : node.id;
    renderTree();
  });

  // Add child button
  const addChild = document.createElement("button");
  addChild.className = "tree-add";
  addChild.textContent = "+";
  addChild.title = "Add child node";
  addChild.addEventListener("click", (e) => {
    e.stopPropagation();
    const title = prompt("Enter node title:");
    if (title && title.trim()) addNode(title.trim(), node.id);
  });

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
  row.appendChild(exp);
  row.appendChild(dl);
  row.appendChild(jsonDl);
  row.appendChild(addChild);
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

// --- Editor (note-taking for each node) ---

function openChat(nodeId) {
  const node = findNode(nodeId);
  if (!node) return;
  activeNodeId = nodeId;
  activeChapterId = null; // deselect chapter
  node.lastAccessedAt = new Date().toISOString();
  saveTree();
  renderChapters();

  const ancestors = getAncestors(nodeId);
  chatBreadcrumb.textContent = ancestors.map(n => truncate(n.title, 20)).join(" → ");
  chatSnippet.textContent = node.isCategory ? node.fullText : node.title;

  // Load node content into editor
  const editor = document.getElementById("node-editor");
  editor.value = node.fullText || "";

  // Show editor in middle panel, reset to editor tab
  document.getElementById("middle-empty").classList.add("hidden");
  chatArea.classList.remove("hidden");
  document.getElementById("preview-area").classList.add("hidden");
  switchMiddleTab("editor");

  // Load node AI history
  loadNodeAiHistory(node);

  editor.focus();
}

// Save handled by unified editor-save listener below (supports both tree nodes and chapters)

// --- Settings (localStorage) ---

function getConfig() {
  try { return JSON.parse(localStorage.getItem("lumintree_api")) || {}; } catch { return {}; }
}

function saveConfig(cfg) {
  localStorage.setItem("lumintree_api", JSON.stringify(cfg));
}

document.getElementById("settings-btn").addEventListener("click", () => settingsEl.classList.toggle("hidden"));

const PRESETS = {
  dashscope: { url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", model: "qwen-plus" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" }
};

document.getElementById("api-preset").addEventListener("change", (e) => {
  const p = PRESETS[e.target.value];
  if (p) { document.getElementById("api-url").value = p.url; document.getElementById("api-model").value = p.model; }
});

// Load saved settings into form
const savedCfg = getConfig();
document.getElementById("api-url").value = savedCfg.url || "";
document.getElementById("api-key").value = savedCfg.key || "";
document.getElementById("api-model").value = savedCfg.model || "";

document.getElementById("save-settings").addEventListener("click", () => {
  saveConfig({
    url: document.getElementById("api-url").value.trim(),
    key: document.getElementById("api-key").value.trim(),
    model: document.getElementById("api-model").value.trim()
  });
  statusEl.textContent = "✓ Saved";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});

// --- Export (declarations must be before loadTree) ---

const exportBtn = document.getElementById("export-btn");
const previewBtn = document.getElementById("preview-btn");
const jsonExportBtn = document.getElementById("json-export-btn");

// --- Init ---
loadTree();
exportBtn.addEventListener("click", exportMarkdown);

previewBtn.addEventListener("click", () => showPreview(nodes));

document.getElementById("preview-back").addEventListener("click", () => {
  document.getElementById("preview-area").classList.add("hidden");
  if (activeNodeId) {
    chatArea.classList.remove("hidden");
  } else {
    document.getElementById("middle-empty").classList.remove("hidden");
  }
});

jsonExportBtn.addEventListener("click", exportAllJson);

const jsonImportFile = document.getElementById("json-import-file");
document.getElementById("json-import-btn").addEventListener("click", () => jsonImportFile.click());
jsonImportFile.addEventListener("change", (e) => {
  if (e.target.files[0]) { importJson(e.target.files[0]); e.target.value = ""; }
});

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
  document.getElementById("middle-empty").classList.add("hidden");
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
  a.href = url; a.download = `lumintree-${node.id}-${date}.json`; a.click();
  URL.revokeObjectURL(url);
}

function exportAllJson() {
  const date = new Date().toISOString().slice(0, 10);
  const data = { nodes, chapters };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `lumintree-export-${date}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      let imported = JSON.parse(reader.result);
      // Support new format { nodes, chapters } and legacy array format
      let importedNodes, importedChapters;
      if (Array.isArray(imported)) {
        importedNodes = imported; importedChapters = null;
      } else if (imported && Array.isArray(imported.nodes)) {
        importedNodes = imported.nodes; importedChapters = imported.chapters || null;
      } else { throw new Error("Invalid format"); }
      for (const imp of importedNodes) {
        if (imp.isCategory && imp.categoryId) {
          const existing = nodes.find(n => n.categoryId === imp.categoryId && n.isCategory);
          if (existing) { existing.children.push(...(imp.children || [])); continue; }
        }
        nodes.push(imp);
      }
      if (importedChapters) {
        for (const ch of importedChapters) {
          if (!chapters.find(c => c.id === ch.id)) chapters.push(ch);
        }
        saveChapters();
      }
      ensureCategories();
      saveTree();
      renderTree();
      renderChapters();
    } catch (e) {
      alert("Import failed: " + e.message);
    }
  };
  reader.readAsText(file);
}

function buildExportMd(rootNodes) {
  const date = new Date().toISOString().slice(0, 10);
  let md = `# LuminTree-Intel — Novel Project Export (${date})\n\n`;

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
    md += `> *${formatTime(node.timestamp)}*\n\n`;
  } else {
    md += "\n";
  }
  if (node.chatHistory && node.chatHistory.length > 0) {
    node.chatHistory.forEach(m => {
      if (m.role === "user") md += `**Q:** ${m.content} *(${formatTime(m.timestamp)})*\n\n`;
      else md += `**A:** ${m.content}\n\n`;
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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// === Chapter Organization Panel ===
// Chapters are linked to tree nodes under "chapter-structure" category.
// - Left tree node (chapter-structure child): planning notes — how chapters connect, transitions, non-linear timeline
// - Right panel chapter: actual chapter content/writing
// Creating/deleting/renaming from either side syncs to the other.

function removeLinkedTreeNode(chapterId) {
  const csRoot = findNode("chapter-structure");
  if (!csRoot) return;
  const idx = csRoot.children.findIndex(n => n.chapterId === chapterId);
  if (idx !== -1) { csRoot.children.splice(idx, 1); saveTree(); }
}

let chapters = [];
let activeChapterId = null;

function loadChapters() {
  try { chapters = JSON.parse(localStorage.getItem("lumintree_chapters")) || []; } catch { chapters = []; }
  renderChapters();
}

function saveChapters() {
  try { localStorage.setItem("lumintree_chapters", JSON.stringify(chapters)); } catch {}
}

function renderChapters() {
  const list = document.getElementById("chapter-list");
  const empty = document.getElementById("chapter-empty");
  list.innerHTML = "";
  if (chapters.length === 0) { empty.classList.remove("hidden"); return; }
  empty.classList.add("hidden");

  chapters.forEach((ch, i) => {
    const item = document.createElement("div");
    item.className = "chapter-item" + (ch.id === activeChapterId ? " active" : "");

    const num = document.createElement("span");
    num.className = "chapter-number";
    num.textContent = `${i + 1}.`;

    const title = document.createElement("span");
    title.className = "chapter-title";
    title.textContent = ch.title;
    title.addEventListener("click", () => openChapterInEditor(ch.id));

    const edit = document.createElement("button");
    edit.className = "chapter-edit";
    edit.textContent = "✏️";
    edit.title = "Rename";
    edit.addEventListener("click", (e) => {
      e.stopPropagation();
      const newTitle = prompt("Rename chapter:", ch.title);
      if (newTitle && newTitle.trim()) {
        ch.title = newTitle.trim();
        // Sync title to linked tree node
        const linked = findNode(ch.id);
        if (linked && linked.chapterId === ch.id) { linked.title = ch.title; saveTree(); }
        saveChapters(); renderTree(); renderChapters();
      }
    });

    const del = document.createElement("button");
    del.className = "chapter-del";
    del.textContent = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${ch.title}"?`)) {
        chapters.splice(i, 1);
        if (activeChapterId === ch.id) activeChapterId = null;
        // Remove linked tree node
        removeLinkedTreeNode(ch.id);
        saveChapters(); renderTree(); renderChapters();
      }
    });

    item.appendChild(num);
    item.appendChild(title);
    item.appendChild(edit);
    item.appendChild(del);
    list.appendChild(item);
  });
}

function openChapterInEditor(chId) {
  const ch = chapters.find(c => c.id === chId);
  if (!ch) return;
  activeChapterId = chId;
  activeNodeId = null; // deselect tree node

  chatBreadcrumb.textContent = `📚 ${ch.title}`;
  chatSnippet.textContent = ch.title;

  const editor = document.getElementById("node-editor");
  editor.value = ch.content || "";

  document.getElementById("middle-empty").classList.add("hidden");
  chatArea.classList.remove("hidden");
  document.getElementById("preview-area").classList.add("hidden");
  switchMiddleTab("editor");

  // Load chapter's node AI history
  loadNodeAiHistory(ch);

  editor.focus();
  renderChapters();
}

document.getElementById("add-chapter-btn").addEventListener("click", () => {
  const title = prompt("Chapter title:", `Chapter ${chapters.length + 1}`);
  if (title && title.trim()) {
    const t = title.trim();
    const id = genId();
    // Create chapter
    chapters.push({ id, title: t, content: "" });
    saveChapters();
    // Create linked tree node under chapter-structure
    const csRoot = findNode("chapter-structure");
    if (csRoot) {
      csRoot.children.push({
        id, parentId: "chapter-structure", categoryId: null,
        title: t, fullText: "",
        timestamp: new Date().toISOString(),
        children: [], chatHistory: [], chapterId: id
      });
      saveTree();
    }
    renderTree(); renderChapters();
  }
});

// Patch editor save to handle both tree nodes and chapters
document.getElementById("editor-save").addEventListener("click", () => {
  const editor = document.getElementById("node-editor");
  if (activeChapterId) {
    const ch = chapters.find(c => c.id === activeChapterId);
    if (ch) { ch.content = editor.value; saveChapters(); }
  } else if (activeNodeId) {
    const node = findNode(activeNodeId);
    if (node) { node.fullText = editor.value; saveTree(); }
  } else return;
  const btn = document.getElementById("editor-save");
  const orig = btn.textContent;
  btn.textContent = "✓ Saved";
  setTimeout(() => btn.textContent = orig, 1500);
});

// === Middle Panel Tabs (Editor / AI Assistant) ===
const tabEditor = document.getElementById("tab-editor");
const tabAi = document.getElementById("tab-ai");
const subEditor = document.getElementById("sub-editor");
const subAi = document.getElementById("sub-ai");

function switchMiddleTab(tab) {
  tabEditor.classList.toggle("active", tab === "editor");
  tabAi.classList.toggle("active", tab === "ai");
  subEditor.classList.toggle("hidden", tab !== "editor");
  subAi.classList.toggle("hidden", tab !== "ai");
}
tabEditor.addEventListener("click", () => switchMiddleTab("editor"));
tabAi.addEventListener("click", () => switchMiddleTab("ai"));

// === Node-level AI Assistant ===
const nodeAiMessages = document.getElementById("node-ai-messages");
const nodeAiInput = document.getElementById("node-ai-input");
const nodeAiSendBtn = document.getElementById("node-ai-send-btn");
let nodeAiHistory = [];

function saveNodeAiHistory() {
  const node = activeNodeId ? findNode(activeNodeId) : null;
  const ch = activeChapterId ? chapters.find(c => c.id === activeChapterId) : null;
  const target = node || ch;
  if (target) { target.nodeAiHistory = nodeAiHistory; node ? saveTree() : saveChapters(); }
}

function loadNodeAiHistory(target) {
  nodeAiHistory = target.nodeAiHistory || [];
  nodeAiMessages.innerHTML = "";
  for (const msg of nodeAiHistory) appendNodeAiMessage(msg.role, msg.content);
}

function appendNodeAiMessage(role, content) {
  const div = document.createElement("div");
  div.className = `ai-msg ai-msg-${role}`;
  if (role === "assistant") {
    div.innerHTML = typeof marked !== "undefined" ? marked.parse(content) : content.replace(/\n/g, "<br>");
  } else {
    div.textContent = content;
  }
  nodeAiMessages.appendChild(div);
  nodeAiMessages.scrollTop = nodeAiMessages.scrollHeight;
  return div;
}

function buildNodeAiSystemPrompt() {
  const novelContext = buildNovelContext();
  let targetTitle = "", targetContent = "", categoryPrompt = "";
  if (activeNodeId) {
    const node = findNode(activeNodeId);
    if (node) {
      targetTitle = node.title;
      targetContent = node.fullText || "";
      const catId = getNodeCategory(node);
      categoryPrompt = catId && CATEGORY_PROMPTS[catId] ? CATEGORY_PROMPTS[catId] : "";
    }
  } else if (activeChapterId) {
    const ch = chapters.find(c => c.id === activeChapterId);
    if (ch) {
      targetTitle = ch.title;
      targetContent = ch.content || "";
      categoryPrompt = CATEGORY_PROMPTS["chapter-structure"] || "";
    }
  }
  return `${categoryPrompt}

Below is the complete novel structure:

${novelContext}

The user is currently working on: "${targetTitle}"
${targetContent ? `\nCurrent content:\n${targetContent}` : "\nNo content yet."}

Help the user refine, develop, and improve this section. Be specific and actionable.`;
}

async function sendNodeAiMessage() {
  const text = nodeAiInput.value.trim();
  if (!text) return;
  if (!activeNodeId && !activeChapterId) { alert("Select a node or chapter first."); return; }
  const cfg = getConfig();
  if (!cfg.url || !cfg.key) { alert("Configure your API settings first (⚙️ button)."); return; }

  nodeAiInput.value = "";
  appendNodeAiMessage("user", text);
  nodeAiHistory.push({ role: "user", content: text });
  saveNodeAiHistory();

  const thinkingEl = appendNodeAiMessage("thinking", "Thinking...");
  thinkingEl.classList.add("ai-msg-thinking");
  nodeAiSendBtn.disabled = true;

  try {
    const systemPrompt = buildNodeAiSystemPrompt();
    const messages = [{ role: "system", content: systemPrompt }, ...nodeAiHistory];
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model || "gpt-4o-mini", messages })
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(No response)";
    thinkingEl.remove();
    appendNodeAiMessage("assistant", reply);
    nodeAiHistory.push({ role: "assistant", content: reply });
    saveNodeAiHistory();
  } catch (err) {
    thinkingEl.remove();
    appendNodeAiMessage("assistant", `⚠️ Error: ${err.message}`);
  } finally {
    nodeAiSendBtn.disabled = false;
    nodeAiInput.focus();
  }
}

nodeAiSendBtn.addEventListener("click", sendNodeAiMessage);
nodeAiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendNodeAiMessage(); }
});

loadChapters();

// === AI Writer Chat Panel ===
const aiMessages = document.getElementById("ai-messages");
const aiInput = document.getElementById("ai-input");
const aiSendBtn = document.getElementById("ai-send-btn");
const aiChapterLabel = document.getElementById("ai-chapter-label");
let aiChatHistory = []; // per-chapter chat history (saved on chapter object)

function getSelectedChapter() {
  if (activeChapterId) return chapters.find(c => c.id === activeChapterId) || null;
  return null;
}

// Save current AI chat history to the active chapter
function saveAiChatHistory() {
  const ch = getSelectedChapter();
  if (ch) { ch.aiHistory = aiChatHistory; saveChapters(); }
}

// Load AI chat history from a chapter and render messages
function loadAiChatHistory(ch) {
  aiChatHistory = ch.aiHistory || [];
  aiMessages.innerHTML = "";
  for (const msg of aiChatHistory) appendAiMessage(msg.role, msg.content);
}

function getSelectedChapter() {
  if (activeChapterId) return chapters.find(c => c.id === activeChapterId) || null;
  return null;
}

function buildNovelContext() {
  const sections = [];
  for (const cat of nodes) {
    const lines = [];
    (function collect(node, depth) {
      const prefix = "  ".repeat(depth);
      const text = node.fullText ? `: ${node.fullText}` : "";
      lines.push(`${prefix}- ${node.title}${text}`);
      node.children.forEach(c => collect(c, depth + 1));
    })(cat, 0);
    sections.push(lines.join("\n"));
  }
  return sections.join("\n\n");
}

function buildSystemPrompt(chapter) {
  const novelContext = buildNovelContext();
  // Extract writing materials section specifically for emphasis
  const wmNode = nodes.find(n => n.categoryId === "writing-materials");
  let wmContext = "";
  if (wmNode && wmNode.children.length > 0) {
    const lines = [];
    wmNode.children.forEach(c => {
      const text = c.fullText ? `: ${c.fullText}` : "";
      lines.push(`- ${c.title}${text}`);
    });
    wmContext = lines.join("\n");
  }

  return `You are an expert novel writing assistant for the project "${document.title}".

Below is the complete novel structure the author has built — including core concept, worldview, plot framework, characters, chapter structure, and writing materials:

${novelContext}

The author is currently working on: "${chapter.title}"
${chapter.content ? `\nExisting draft for this chapter:\n${chapter.content}` : "\nThis chapter has no draft yet."}
${wmContext ? `\n⚠️ CRITICAL — Writing Material Library directives (MUST follow strictly in ALL output):\n${wmContext}\n` : ""}
Your job:
- Write, expand, or revise chapter content based on the author's instructions
- Stay consistent with the established worldview, characters, plot, and tone
- Respect the chapter structure and how this chapter connects to others
- **STRICTLY follow ALL style, tone, and writing directives defined in the Writing Material Library** — if it says dramatic, write dramatically; if it says pragmatic, write pragmatically; these directives override any default style
- When asked to write, produce actual prose — not outlines or summaries
- Every piece of output you generate must conform to the writing style requirements specified by the author in the Writing Material Library`;
}

function updateAiChapterLabel() {
  const ch = getSelectedChapter();
  aiChapterLabel.textContent = ch ? `📖 ${ch.title}` : "No chapter selected";
}

function appendAiMessage(role, content) {
  const div = document.createElement("div");
  div.className = `ai-msg ai-msg-${role}`;
  if (role === "assistant") {
    div.innerHTML = typeof marked !== "undefined" ? marked.parse(content) : content.replace(/\n/g, "<br>");
  } else {
    div.textContent = content;
  }
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}

async function sendAiMessage() {
  const ch = getSelectedChapter();
  if (!ch) { alert("Select a chapter first (click a chapter in the Chapters panel)."); return; }
  const text = aiInput.value.trim();
  if (!text) return;
  const cfg = getConfig();
  if (!cfg.url || !cfg.key) { alert("Configure your API settings first (⚙️ button)."); return; }

  aiInput.value = "";
  appendAiMessage("user", text);
  aiChatHistory.push({ role: "user", content: text });
  saveAiChatHistory();

  const thinkingEl = appendAiMessage("thinking", "Writing...");
  thinkingEl.classList.add("ai-msg-thinking");
  aiSendBtn.disabled = true;

  try {
    const systemPrompt = buildSystemPrompt(ch);
    const messages = [{ role: "system", content: systemPrompt }, ...aiChatHistory];
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cfg.key}` },
      body: JSON.stringify({ model: cfg.model || "gpt-4o-mini", messages })
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(No response)";

    thinkingEl.remove();
    appendAiMessage("assistant", reply);
    aiChatHistory.push({ role: "assistant", content: reply });
    saveAiChatHistory();
  } catch (err) {
    thinkingEl.remove();
    appendAiMessage("assistant", `⚠️ Error: ${err.message}`);
  } finally {
    aiSendBtn.disabled = false;
    aiInput.focus();
  }
}

aiSendBtn.addEventListener("click", sendAiMessage);
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
});

// Clear memory button — wipes AI chat history for current chapter
document.getElementById("ai-clear-btn").addEventListener("click", () => {
  const ch = getSelectedChapter();
  if (!ch) return;
  if (!confirm(`Clear all AI Writer memory for "${ch.title}"? The AI will forget everything discussed.`)) return;
  aiChatHistory = [];
  aiMessages.innerHTML = "";
  saveAiChatHistory();
});

// Load AI chat history when switching chapters
const _origOpenChapter = openChapterInEditor;
openChapterInEditor = function(chId) {
  _origOpenChapter(chId);
  const ch = chapters.find(c => c.id === chId);
  if (ch) loadAiChatHistory(ch);
  updateAiChapterLabel();
};

// Update label when tree node selected (deselects chapter)
const _origOpenChat = openChat;
openChat = function(nodeId) {
  _origOpenChat(nodeId);
  updateAiChapterLabel();
};

// === Resize Handles for All Panels ===
(function() {
  const configs = [
    { handle: "resize-handle", panel: ".left-panel" },
    { handle: "resize-handle-2", panel: ".right-panel", right: true },
    { handle: "resize-handle-3", panel: ".ai-panel", right: true }
  ];
  let active = null;

  configs.forEach(cfg => {
    const handle = document.getElementById(cfg.handle);
    const panel = cfg.right
      ? document.querySelector(cfg.panel)
      : document.querySelector(cfg.panel);

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      active = { handle, panel, right: !!cfg.right };
      handle.classList.add("dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (!active) return;
    const { panel, right } = active;
    const min = parseInt(getComputedStyle(panel).minWidth);
    const max = parseInt(getComputedStyle(panel).maxWidth);
    let newWidth;
    if (right) {
      newWidth = panel.getBoundingClientRect().right - e.clientX;
    } else {
      newWidth = e.clientX - panel.getBoundingClientRect().left;
    }
    panel.style.width = Math.max(min, Math.min(max, newWidth)) + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!active) return;
    active.handle.classList.remove("dragging");
    active = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
})();
