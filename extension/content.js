(function () {
  console.log("✅ Luiza carregada");

  if (document.getElementById("luiza-float-btn")) return;

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject-panel.js");
  document.body.appendChild(script);

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("styles.css");
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "luiza-float-btn";
  btn.innerText = "Luiza";
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    padding: 12px 16px; border-radius: 8px; border: none;
    background: #d4af37; color: #000; cursor: pointer;
    font-weight: bold; font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  btn.onclick = () => {
    document.getElementById("luiza-panel")?.classList.toggle("open");
  };

  document.body.appendChild(btn);

  window.addEventListener("message", (event) => {
    if (event.data.type !== "LUIZA_TRANSCRIBE") return;

    chrome.runtime.sendMessage(
      { type: "TRANSCRIBE_VIDEO", videoUrl: event.data.videoUrl },
      (response) => {
        window.postMessage({
          type: "LUIZA_RESPONSE",
          text: response?.text || "Erro"
        }, "*");
      }
    );
  });
})();
