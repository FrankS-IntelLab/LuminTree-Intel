// === LuminTree-Intel — Content Script ===
// Detects text selection on web pages and shows a floating "Push to Panel" button
// for collecting writing reference materials into the novel creation tree

(() => {
  let popup = null;
  let selectedText = "";

  function removePopup() {
    if (popup) {
      popup.remove();
      popup = null;
    }
  }

  function createPopup(x, y) {
    removePopup();
    popup = document.createElement("div");
    popup.id = "lumintree-popup";

    const btn = document.createElement("button");
    btn.textContent = "Push to Panel";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: "push-text", text: selectedText, sourceUrl: window.location.href });
      removePopup();
    });

    popup.appendChild(btn);
    document.body.appendChild(popup);

    // Position near selection, keep within viewport
    const popupRect = popup.getBoundingClientRect();
    let left = x - popupRect.width / 2;
    let top = y - popupRect.height - 10;
    left = Math.max(4, Math.min(left, window.innerWidth - popupRect.width - 4));
    if (top < 4) top = y + 20;

    popup.style.left = left + "px";
    popup.style.top = top + "px";
  }

  document.addEventListener("mouseup", (e) => {
    setTimeout(() => {
      const sel = window.getSelection().toString().trim();
      if (sel.length > 0) {
        selectedText = sel;
        createPopup(e.clientX, e.clientY);
      } else {
        removePopup();
      }
    }, 10);
  });

  document.addEventListener("mousedown", (e) => {
    if (popup && !popup.contains(e.target)) {
      removePopup();
    }
  });
})();
