// Translations
const translations = {
  en: {
    invalidPage: 'PixelRuler cannot be used on this page.',
    scriptError: 'Error injecting script:'
  },
  es: {
    invalidPage: 'PixelRuler no puede usarse en esta página.',
    scriptError: 'Error al inyectar script:'
  }
};

let currentLang = 'es';

// Update UI language
function updateLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });
}

// Load settings and update UI
function loadSettings() {
  chrome.storage.sync.get(['language', 'overlayColor'], (result) => {
    const lang = result.language || 'es';
    const color = result.overlayColor || '#4285f4';
    
    document.getElementById('language').value = lang;
    document.getElementById('overlayColor').value = color;
    updateLanguage(lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const activateBtn = document.getElementById('activate');
  const deactivateBtn = document.getElementById('deactivate');
  const languageSelect = document.getElementById('language');
  const colorInput = document.getElementById('overlayColor');
  const resetColorBtn = document.getElementById('resetColor');

  // Load saved settings
  loadSettings();

  // Show the user's actual toggle shortcut (it can be changed in chrome://extensions/shortcuts)
  chrome.commands.getAll((commands) => {
    const toggle = commands.find(c => c.name === 'toggle-measurement');
    if (toggle && toggle.shortcut) {
      // Chrome localizes key names ("Mayús" in Spanish); show the key as labeled in the docs
      document.getElementById('shortcut').textContent = toggle.shortcut.replace('Mayús', 'Shift');
    } else {
      document.getElementById('shortcutHint').hidden = true;
    }
  });

  // Language change handler
  languageSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    chrome.storage.sync.set({ language: lang }, () => {
      updateLanguage(lang);
      // Notify content script about language change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', language: lang }).catch(() => {});
      });
    });
  });

  // Color change handler
  colorInput.addEventListener('change', (e) => {
    const color = e.target.value;
    chrome.storage.sync.set({ overlayColor: color }, () => {
      // Notify content script about color change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', overlayColor: color }).catch(() => {});
      });
    });
  });

  // Reset color handler
  resetColorBtn.addEventListener('click', () => {
    const defaultColor = '#4285f4';
    colorInput.value = defaultColor;
    chrome.storage.sync.set({ overlayColor: defaultColor }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', overlayColor: defaultColor }).catch(() => {});
      });
    });
  });

  activateBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      // Verificar si la URL es válida
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://chrome.google.com')) {
        console.error('Cannot inject script into this type of page:', tab.url);
        alert(translations[currentLang].invalidPage);
        return;
      }

      // Primero intentar enviar mensaje de activación (si el script ya está inyectado)
      chrome.tabs.sendMessage(tab.id, { action: 'activate' }, (response) => {
        if (chrome.runtime.lastError) {
          // Si falla, es porque el script no está inyectado, entonces lo inyectamos
          // CSS primero, para que los overlays nunca aparezcan sin estilo
          console.log('Script not injected yet, injecting...');
          const target = { tabId: tab.id };
          chrome.scripting.insertCSS({ target, files: ['content.css'] })
            .then(() => chrome.scripting.executeScript({ target, files: ['measure.js', 'content.js'] }))
            .then(() => {
              activateBtn.disabled = true;
              deactivateBtn.disabled = false;
              // Cerrar el popup al activar medición
              window.close();
            })
            .catch((err) => {
              console.error(`Script injection failed: ${err.message}`);
              alert(`${translations[currentLang].scriptError} ${err.message}`);
            });
        } else {
          // Script ya estaba inyectado y se activó correctamente
          activateBtn.disabled = true;
          deactivateBtn.disabled = false;
          // Cerrar el popup al activar medición
          window.close();
        }
      });
    });
  });

  deactivateBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'deactivate' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`Message sending failed: ${chrome.runtime.lastError.message}`);
          return;
        }

        activateBtn.disabled = false;
        deactivateBtn.disabled = true;
      });
    });
  });
});
