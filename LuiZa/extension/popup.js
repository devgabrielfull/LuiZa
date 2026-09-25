const API_URL = 'http://127.0.0.1:3333';

const elements = {
  transcribeBtn: document.getElementById('transcribeBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  status: document.getElementById('status'),
  loading: document.getElementById('loading'),
  result: document.getElementById('result'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('errorMessage'),
  transcription: document.getElementById('transcription')
};

let currentTranscription = null;

// O popup tem vida curta: a requisição só continua enquanto ele permanece aberto.
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// chrome.tabs.query com callback funciona em Chrome e Firefox.
function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs?.[0] ?? null);
    });
  });
}

function isYouTubeVideoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) &&
      url.pathname === '/watch' && Boolean(url.searchParams.get('v'));
  } catch {
    return false;
  }
}

async function getCurrentVideoUrl() {
  const tab = await getActiveTab();
  if (!isYouTubeVideoUrl(tab?.url)) {
    throw new Error('Abra um vídeo do YouTube primeiro');
  }
  return tab.url;
}

function showElement(element) {
  element.classList.remove('hidden');
}

function hideElement(element) {
  element.classList.add('hidden');
}

function showActionError(message) {
  elements.errorMessage.textContent = message;
  showElement(elements.error);
}

function showError(message) {
  showActionError(message);
  hideElement(elements.loading);
  hideElement(elements.result);
}

function renderTranscription(segments) {
  elements.transcription.replaceChildren();

  if (segments.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'Nenhuma transcrição encontrada.';
    elements.transcription.appendChild(emptyMessage);
    return;
  }

  for (const segment of segments) {
    const segmentDiv = document.createElement('div');
    segmentDiv.className = 'segment';

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = `${formatTime(segment.start)} - ${formatTime(segment.end)}`;

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = segment.text;
    
    segmentDiv.appendChild(timestamp);
    segmentDiv.appendChild(text);
    elements.transcription.appendChild(segmentDiv);
  }
}

async function transcribeVideo() {
  try {
    currentTranscription = null;
    hideElement(elements.error);
    hideElement(elements.result);
    showElement(elements.loading);
    elements.transcribeBtn.disabled = true;

    const videoUrl = await getCurrentVideoUrl();

    let response;
    try {
      response = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });
    } catch {
      throw new Error(`Servidor local indisponível em ${API_URL}`);
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || `Erro HTTP ${response.status} ao transcrever`);
    }

    if (!Array.isArray(data?.segments) || data.segments.some(segment =>
      !Number.isFinite(segment?.start) ||
      !Number.isFinite(segment?.end) ||
      typeof segment?.text !== 'string'
    )) {
      throw new Error('Resposta do servidor sem segmentos de transcrição válidos');
    }

    renderTranscription(data.segments);
    currentTranscription = data;
    const hasSegments = data.segments.length > 0;
    elements.copyBtn.disabled = !hasSegments;
    elements.downloadBtn.disabled = !hasSegments;

    hideElement(elements.loading);
    hideElement(elements.status);
    showElement(elements.result);
  } catch (error) {
    console.error('Erro:', error);
    showError(error.message);
  } finally {
    hideElement(elements.loading);
    elements.transcribeBtn.disabled = false;
  }
}

function transcriptionText() {
  return currentTranscription.segments
    .map(segment => `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.text}`)
    .join('\n\n');
}

async function copyTranscription() {
  if (!currentTranscription?.segments.length) return;

  try {
    await navigator.clipboard.writeText(transcriptionText());
    hideElement(elements.error);
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch {
    showActionError('Não foi possível copiar o texto; tente baixar o arquivo TXT.');
  }
}

function downloadTranscription() {
  if (!currentTranscription?.segments.length) return;

  const blob = new Blob([transcriptionText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcricao_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

elements.transcribeBtn.addEventListener('click', transcribeVideo);
elements.copyBtn.addEventListener('click', copyTranscription);
elements.downloadBtn.addEventListener('click', downloadTranscription);

// Verificar se está no YouTube ao abrir.
getCurrentVideoUrl().catch((error) => {
  showError(error.message);
  elements.transcribeBtn.disabled = true;
});
