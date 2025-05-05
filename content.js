// Wait for page to load and check extension state
chrome.storage.local.get('enabled', (data) => {
  if (data.enabled === false) {
    console.log("🛑 ModariAI is disabled");
    return;
  }

  // Get the current site's hostname
  const hostname = window.location.hostname.replace('www.', '').toLowerCase();

  // Get the blacklist and check for a match
  chrome.storage.sync.get(['modariBlacklist'], (result) => {
    const blacklist = result.modariBlacklist || [];

    if (blacklist.includes(hostname)) {
      console.log("⚠️ ModariAI is active on blacklisted site:", hostname);

      // === DO SOMETHING: BLUR or BLOCK ===
      document.body.style.filter = 'blur(12px)';
      document.body.style.transition = 'filter 0.3s ease';
    }
  });
});
