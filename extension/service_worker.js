console.log("🔥 Service Worker Luiza REGISTRADO");

const BACKEND_URL = "https://SEU-APP.onrender.com/transcrever";

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extensão instalada");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Mensagem:", message);

  if (message.type === "TRANSCRIBE_VIDEO") {
    fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: message.videoUrl }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("✅ Transcrição:", data);
        sendResponse({ text: data.text });
      })
      .catch((err) => {
        console.error("❌ Erro:", err);
        sendResponse({ text: "Erro: " + err.message });
      });

    return true;
  }
});
