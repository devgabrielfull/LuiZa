const API_URL = 'http://localhost:3333';

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

// Formatar timestamp para MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Obter URL do vídeo atual
async function getCurrentVideoUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
    throw new Error('Abra um vídeo do YouTube primeiro');
  }
  
  return tab.url;
}

// Mostrar/ocultar elementos
function showElement(element) {
  element.classList.remove('hidden');
}

function hideElement(element) {
  element.classList.add('hidden');
}

// Mostrar erro
function showError(message) {
  elements.errorMessage.textContent = message;
  showElement(elements.error);
  hideElement(elements.loading);
  hideElement(elements.result);
}

// Renderizar transcrição
function renderTranscription(data) {
  elements.transcription.innerHTML = '';
  
  if (!data.segments || data.segments.length === 0) {
    elements.transcription.innerHTML = '<p>Nenhuma transcrição encontrada.</p>';
    return;
  }
  
  data.segments.forEach(segment => {
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
  });
}

// Transcrever vídeo
async function transcribeVideo() {
  try {
    hideElement(elements.error);
    hideElement(elements.result);
    showElement(elements.loading);
    elements.transcribeBtn.disabled = true;
    
    const videoUrl = await getCurrentVideoUrl();
    
    const response = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoUrl })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao transcrever');
    }
    
    const data = await response.json();
    currentTranscription = data;
    
    hideElement(elements.loading);
    hideElement(elements.status);
    showElement(elements.result);
    renderTranscription(data);
    
  } catch (error) {
    console.error('Erro:', error);
    showError(error.message);
  } finally {
    elements.transcribeBtn.disabled = false;
  }
}

// Copiar transcrição
function copyTranscription() {
  if (!currentTranscription) return;
  
  const text = currentTranscription.segments
    .map(s => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
    .join('\n\n');
  
  navigator.clipboard.writeText(text).then(() => {
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  });
}

// Baixar transcrição
function downloadTranscription() {
  if (!currentTranscription) return;
  
  const text = currentTranscription.segments
    .map(s => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
    .join('\n\n');
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcricao_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Event listeners
elements.transcribeBtn.addEventListener('click', transcribeVideo);
elements.copyBtn.addEventListener('click', copyTranscription);
elements.downloadBtn.addEventListener('click', downloadTranscription);

// Verificar se está no YouTube ao abrir
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
    showError('Abra um vídeo do YouTube para usar esta extensão');
    elements.transcribeBtn.disabled = true;
  }
});
