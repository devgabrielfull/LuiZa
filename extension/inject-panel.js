if (!document.getElementById("luiza-panel")) {
  const panel = document.createElement("div");
  panel.id = "luiza-panel";

  const title = document.createElement("h3");
  title.innerText = "LuiZa";

  const btn = document.createElement("button");
  btn.id = "luiza-transcribe-btn";
  btn.innerText = "Obter Transcrição";

  const textarea = document.createElement("textarea");
  textarea.id = "luiza-output";
  textarea.placeholder = "A transcrição aparecerá aqui...";
  textarea.readOnly = true;

  panel.append(title, btn, textarea);
  document.body.appendChild(panel);

  btn.onclick = () => {
    textarea.value = "Transcrevendo... ⏳\n\nIsso pode levar 10-60 segundos.\nAguarde...";
    btn.disabled = true;
    btn.innerText = "Processando...";

    window.postMessage({
      type: "LUIZA_TRANSCRIBE",
      videoUrl: window.location.href
    }, "*");
  };

  window.addEventListener("message", (event) => {
    if (event.data.type === "LUIZA_RESPONSE") {
      textarea.value = event.data.text;
      btn.disabled = false;
      btn.innerText = "Obter Transcrição";
    }
  });
}
