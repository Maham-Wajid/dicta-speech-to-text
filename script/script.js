/**
 * ============================================
 * DICTA - Modern Speech-to-Text Application
 * ============================================
 * A fully-featured transcription tool with
 * dark mode, multiple languages, and export options
 */

// ===== STATE MANAGEMENT =====
const AppState = {
  isListening: false,
  isPaused: false,
  finalTranscript: '',
  interimTranscript: '',
  isContinuousMode: false,
  currentLanguage: 'en-US',
  transcriptionHistory: [],
};

// ===== DOM ELEMENTS CACHE =====
const DOM = {
  // Header
  themeToggle: document.getElementById('theme-toggle'),
  langSelect: document.getElementById('lang-select'),

  // Control Panel
  micButton: document.getElementById('mic-button'),
  statusText: document.getElementById('status-text'),
  stateDot: document.getElementById('state-dot'),
  stateLabel: document.getElementById('state-label'),
  pauseBtn: document.getElementById('pause-btn'),
  resetBtn: document.getElementById('reset-btn'),
  continuousMode: document.getElementById('continuous-mode'),

  // Output Panel
  outputContent: document.getElementById('output-content'),
  wordCount: document.getElementById('word-count'),
  charCount: document.getElementById('char-count'),

  // Buttons
  copyBtn: document.getElementById('copy-btn'),
  downloadBtn: document.getElementById('download-btn'),
  pdfBtn: document.getElementById('pdf-btn'),
  clearBtn: document.getElementById('clear-btn'),

  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  historyList: document.getElementById('history-list'),
  noHistory: document.getElementById('no-history'),

  // Toast & Notifications
  toastContainer: document.getElementById('toast-container'),
  unsupportedBanner: document.getElementById('unsupported-banner'),
};

// ===== SPEECH RECOGNITION SETUP =====
window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!window.SpeechRecognition) {
  DOM.unsupportedBanner.style.display = 'flex';
  DOM.micButton.disabled = true;
}

const recognition = window.SpeechRecognition
  ? new SpeechRecognition()
  : null;

if (recognition) {
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Type: 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
  };

  toast.innerHTML = `
    <i class="fas ${iconMap[type]} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close notification">
      <i class="fas fa-times"></i>
    </button>
  `;

  DOM.toastContainer.appendChild(toast);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Update statistics (word and character count)
 */
function updateStats() {
  const text = AppState.finalTranscript + AppState.interimTranscript;
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const chars = text.length;

  DOM.wordCount.textContent = words;
  DOM.charCount.textContent = chars;
}

/**
 * Update button states based on transcript content
 */
function updateButtonStates() {
  const hasText = AppState.finalTranscript.trim().length > 0;
  DOM.copyBtn.disabled = !hasText;
  DOM.downloadBtn.disabled = !hasText;
  DOM.pdfBtn.disabled = !hasText;
}

/**
 * Add auto punctuation (basic rules)
 */
function addAutoPunctuation(text) {
  // Add period at end if missing
  if (text && !text.endsWith('.') && !text.endsWith('?') && !text.endsWith('!')) {
    text += '.';
  }
  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

/**
 * Copy text to clipboard
 */
function copyToClipboard() {
  const text = AppState.finalTranscript.trim();
  if (!text) {
    showToast('Nothing to copy!', 'warning');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  });
}

/**
 * Download transcript as TXT file
 */
function downloadTranscript() {
  const text = AppState.finalTranscript.trim();
  if (!text) {
    showToast('Nothing to download!', 'warning');
    return;
  }

  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `transcript_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);

  showToast('Transcript downloaded!', 'success');
}

/**
 * Export transcript as PDF
 */
function exportPDF() {
  const text = AppState.finalTranscript.trim();
  if (!text) {
    showToast('Nothing to export!', 'warning');
    return;
  }

  const element = document.createElement('div');
  element.innerHTML = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .container {
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
          }
          h2 {
            color: #3b82f6;
            margin: 0 0 10px 0;
            font-size: 24px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
          }
          .metadata {
            font-size: 12px;
            color: #333;
            margin: 20px 0;
            line-height: 1.8;
          }
          .metadata p {
            margin: 8px 0;
          }
          .metadata strong {
            color: #1a1a2e;
            font-weight: 600;
            min-width: 120px;
            display: inline-block;
          }
          .divider {
            border: none;
            border-top: 2px solid #ccc;
            margin: 20px 0;
          }
          .content {
            margin-top: 20px;
            line-height: 1.8;
            font-size: 13px;
            color: #1a1a2e;
            white-space: pre-wrap;
            word-wrap: break-word;
            border-left: 4px solid #3b82f6;
            padding-left: 15px;
            background-color: #f9f9f9;
            padding: 15px;
            padding-left: 15px;
          }
          .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Dicta - Transcription</h2>
          <hr class="divider">
          <div class="metadata">
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Language:</strong> ${DOM.langSelect.options[DOM.langSelect.selectedIndex].text}</p>
            <p><strong>Word Count:</strong> ${DOM.wordCount.textContent}</p>
            <p><strong>Character Count:</strong> ${DOM.charCount.textContent}</p>
          </div>
          <hr class="divider">
          <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="footer">Generated by Dicta Speech-to-Text Application</div>
        </div>
      </body>
    </html>
  `;

  // Add element to body temporarily for html2pdf to render it
  element.style.position = 'absolute';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.style.width = '210mm';
  element.style.backgroundColor = '#fff';
  document.body.appendChild(element);

  // Wait a bit for the element to be rendered
  setTimeout(() => {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `transcript_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, logging: false, useCORS: true, allowTaint: true },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        document.body.removeChild(element);
        showToast('PDF exported!', 'success');
      })
      .catch((error) => {
        console.error('PDF export error:', error);
        document.body.removeChild(element);
        showToast('Error exporting PDF', 'error');
      });
  }, 100);
}

/**
 * Update UI state indicators
 */
function updateUIState() {
  const microIcon = DOM.micButton.querySelector('i');

  if (AppState.isListening) {
    DOM.statusText.textContent = 'Listening...';
    DOM.stateDot.className = 'state-dot listening';
    DOM.stateLabel.textContent = 'Listening';
    DOM.pauseBtn.disabled = false;
    DOM.micButton.classList.add('listening');
    microIcon.className = 'fas fa-microphone';
  } else if (AppState.isPaused) {
    DOM.statusText.textContent = 'Paused';
    DOM.stateDot.className = 'state-dot paused';
    DOM.stateLabel.textContent = 'Paused';
    DOM.micButton.classList.remove('listening');
    microIcon.className = 'fas fa-pause';
  } else {
    DOM.statusText.textContent = 'Click to start listening';
    DOM.stateDot.className = 'state-dot';
    DOM.stateLabel.textContent = 'Ready';
    DOM.pauseBtn.disabled = true;
    DOM.micButton.classList.remove('listening');
    microIcon.className = 'fas fa-microphone';
  }
}

/**
 * Save transcription to history
 */
function saveToHistory() {
  if (!AppState.finalTranscript.trim()) return;

  const historyItem = {
    id: Date.now(),
    text: AppState.finalTranscript.trim(),
    timestamp: new Date().toLocaleString(),
    language: DOM.langSelect.value,
  };

  AppState.transcriptionHistory.unshift(historyItem);
  localStorage.setItem(
    'transcriptions',
    JSON.stringify(AppState.transcriptionHistory)
  );

  renderHistory();
}

/**
 * Render history items
 */
function renderHistory() {
  const items = AppState.transcriptionHistory;

  if (items.length === 0) {
    DOM.historyList.innerHTML = '';
    DOM.noHistory.style.display = 'block';
    return;
  }

  DOM.noHistory.style.display = 'none';
  DOM.historyList.innerHTML = items
    .map(
      (item) => `
    <div class="history-item" data-id="${item.id}" role="button" tabindex="0" aria-label="Load transcription from ${item.timestamp}">
      <div class="history-item-text">${item.text}</div>
      <div class="history-item-time">${item.timestamp}</div>
    </div>
  `
    )
    .join('');

  // Add click handlers for history items
  document.querySelectorAll('.history-item').forEach((item) => {
    item.addEventListener('click', () => loadHistoryItem(parseInt(item.dataset.id)));
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadHistoryItem(parseInt(item.dataset.id));
    });
  });
}

/**
 * Load history item to current transcript
 */
function loadHistoryItem(id) {
  const item = AppState.transcriptionHistory.find((h) => h.id === id);
  if (item) {
    AppState.finalTranscript = item.text;
    AppState.interimTranscript = '';
    DOM.langSelect.value = item.language;
    AppState.currentLanguage = item.language;
    DOM.outputContent.textContent = item.text;
    DOM.outputContent.classList.remove('placeholder');
    updateStats();
    updateButtonStates();
    switchTab('current');
    showToast('Transcription loaded!', 'info');
  }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  DOM.tabContents.forEach((content) =>
    content.classList.remove('active')
  );
  DOM.tabBtns.forEach((btn) => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  document.getElementById(`${tabName}-tab`).classList.add('active');
  document
    .querySelector(`[data-tab="${tabName}"]`)
    .classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).setAttribute(
    'aria-selected',
    'true'
  );
}

/**
 * Load history from localStorage
 */
function loadHistory() {
  const saved = localStorage.getItem('transcriptions');
  if (saved) {
    AppState.transcriptionHistory = JSON.parse(saved);
    renderHistory();
  }
}

// ===== EVENT LISTENERS =====

/**
 * Microphone button click - Start/Stop listening
 */
DOM.micButton.addEventListener('click', startListening);
DOM.micButton.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startListening();
  }
});

function startListening() {
  if (!recognition) return;

  if (!AppState.isListening) {
    try {
      AppState.isListening = true;
      AppState.interimTranscript = '';
      recognition.lang = AppState.currentLanguage;
      recognition.continuous = AppState.isContinuousMode;
      recognition.start();
      updateUIState();
    } catch (error) {
      console.error('Recognition start error:', error);
      showToast('Error starting recognition', 'error');
      AppState.isListening = false;
      updateUIState();
    }
  } else {
    recognition.stop();
  }
}

/**
 * Pause button - Pause listening
 */
DOM.pauseBtn.addEventListener('click', () => {
  if (!recognition) return;

  AppState.isPaused = !AppState.isPaused;

  if (AppState.isPaused) {
    recognition.stop();
    AppState.isListening = false;
  } else {
    AppState.isListening = true;
    recognition.lang = AppState.currentLanguage;
    recognition.start();
  }
  updateUIState();
});

/**
 * Reset button - Clear transcript
 */
DOM.resetBtn.addEventListener('click', () => {
  AppState.finalTranscript = '';
  AppState.interimTranscript = '';
  AppState.isPaused = false;
  DOM.outputContent.textContent =
    'Transcribed text will appear here. Click the microphone and start speaking.';
  DOM.outputContent.classList.add('placeholder');
  updateStats();
  updateButtonStates();
  updateUIState();
  showToast('Transcript cleared!', 'info');
  if (AppState.isListening) {
    recognition.stop();
    AppState.isListening = false;
  }
});

/**
 * Continuous Mode toggle
 */
DOM.continuousMode.addEventListener('click', (e) => {
  AppState.isContinuousMode = !AppState.isContinuousMode;
  DOM.continuousMode.setAttribute(
    'aria-checked',
    AppState.isContinuousMode
  );
  showToast(
    `Continuous mode ${AppState.isContinuousMode ? 'enabled' : 'disabled'}`,
    'info'
  );
});

/**
 * Language selector change
 */
DOM.langSelect.addEventListener('change', (e) => {
  AppState.currentLanguage = e.target.value;
  showToast(`Language changed to ${e.target.options[e.target.selectedIndex].text}`, 'info');
});

/**
 * Copy button
 */
DOM.copyBtn.addEventListener('click', copyToClipboard);

/**
 * Download button
 */
DOM.downloadBtn.addEventListener('click', downloadTranscript);

/**
 * PDF export button
 */
DOM.pdfBtn.addEventListener('click', exportPDF);

/**
 * Clear button
 */
DOM.clearBtn.addEventListener('click', () => DOM.resetBtn.click());

/**
 * Tab switching
 */
DOM.tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/**
 * Theme toggle
 */
DOM.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem(
    'theme',
    document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  );

  const icon = DOM.themeToggle.querySelector('i');
  if (document.body.classList.contains('dark-mode')) {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
});

// ===== KEYBOARD SHORTCUTS =====

document.addEventListener('keydown', (e) => {
  // Space: Start/Stop
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    DOM.micButton.click();
  }
  // Ctrl/Cmd + C: Copy
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target !== document.body) {
    e.preventDefault();
    copyToClipboard();
  }
  // Ctrl/Cmd + D: Download
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    downloadTranscript();
  }
  // Ctrl/Cmd + R: Reset
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    DOM.resetBtn.click();
  }
});

// ===== SPEECH RECOGNITION EVENTS =====

if (recognition) {
  recognition.addEventListener('start', () => {
    showToast('Listening started...', 'info');
  });

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        AppState.finalTranscript += addAutoPunctuation(transcript) + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    AppState.interimTranscript = interimTranscript;

    const combinedText =
      AppState.finalTranscript + AppState.interimTranscript;
    DOM.outputContent.textContent = combinedText;
    DOM.outputContent.classList.remove('placeholder');
    updateStats();
    updateButtonStates();
  });

  recognition.addEventListener('end', () => {
    if (AppState.isListening) {
      AppState.isListening = false;
      saveToHistory();
      showToast('Listening stopped', 'info');
      updateUIState();

      // Auto-restart if continuous mode is enabled
      if (AppState.isContinuousMode && !AppState.isPaused) {
        setTimeout(() => startListening(), 500);
      }
    }
  });

  recognition.addEventListener('error', (event) => {
    console.error('Speech recognition error:', event.error);
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found.',
      'network': 'Network error occurred.',
      'not-allowed': 'Microphone permission denied.',
    };

    const message = errorMessages[event.error] || `Error: ${event.error}`;
    showToast(message, 'error');
    AppState.isListening = false;
    updateUIState();
  });
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
  // Load theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    DOM.themeToggle.querySelector('i').className = 'fas fa-sun';
  }

  // Load transcription history
  loadHistory();

  // Update button states
  updateButtonStates();

  showToast('Welcome to Dicta!', 'info');
  console.log('Dicta Speech-to-Text initialized successfully.');
});
