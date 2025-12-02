function criarPainel() {
  // Evita duplicação
  if (document.getElementById("luiza-box")) return;

  const box = document.createElement("div");
  box.id = "luiza-box";
  
  box.innerHTML = `
    <div class="luiza-header">LuiZa — YouTube to Text</div>

    <div class="luiza-tabs">
      <button class="luiza-tab ativo">Transcrição</button>
    </div>

    <button id="luiza-obter" class="luiza-btn">OBTER TRANSCRIÇÃO</button>

    <div id="luiza-output" class="luiza-output">
      Clique em OBTER TRANSCRIÇÃO
    </div>
  `;

  // Insere no painel lateral da direita
  const rightColumn = document.querySelector("#secondary");
  if (rightColumn) {
    rightColumn.prepend(box);
  }
}

function iniciar() {
  criarPainel();

  const botao = document.getElementById("luiza-obter");

  botao.addEventListener("click", async () => {
    botao.disabled = true;
    botao.textContent = "Transcrevendo...";

    const videoUrl = window.location.href;

    const res = await fetch("http://localhost:3000/transcrever", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl })
    });

    const data = await res.json();

    document.getElementById("luiza-output").textContent =
      data.texto || data.error;

    botao.disabled = false;
    botao.textContent = "OBTER TRANSCRIÇÃO";
  });
}

// YouTube é SPA — precisa observar mudanças de URL
const observer = new MutationObserver(() => {
  if (location.href.includes("watch")) iniciar();
});

observer.observe(document, { childList: true, subtree: true });

iniciar();
