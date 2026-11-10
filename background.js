// Keyboard shortcut (Ctrl+Shift+X by default): toggle measurement on the active tab
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-measurement') return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab || !tab.url || /^(chrome|chrome-extension|edge|about):/.test(tab.url) ||
        tab.url.startsWith('https://chrome.google.com')) return;

    chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, () => {
      // Not injected yet: inject it, which activates it
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['measure.js', 'content.js'] })
          .catch(() => {});
      }
    });
  });
});
