document.addEventListener('DOMContentLoaded', initPopup);

function initPopup() {
  const toggleSwitch = document.getElementById('toggle-switch');
  const coinCount = document.getElementById('coinCount');
  const blacklistInput = document.getElementById('blacklist-input');
  const addBlacklistBtn = document.getElementById('add-blacklist-btn');
  const blacklistList = document.getElementById('blacklist-list');
  const upgradeBtn = document.getElementById('upgrade-btn');
  const proStatus = document.getElementById('pro-status');
  const coinSpeedLabel = document.getElementById('coinSpeedLabel');

  toggleSwitch.addEventListener('change', handleToggle);
  addBlacklistBtn.addEventListener('click', addToBlacklist);
  upgradeBtn.addEventListener('click', () => {
    window.open("https://modari-ai.com/products/modari-pro", "_blank");
  });

  loadToggleState();
  loadCoinCount();
  loadBlacklist();
  loadProStatus();

  function handleToggle(e) {
    chrome.storage.local.set({ enabled: e.target.checked });
  }

  function loadToggleState() {
    chrome.storage.local.get('enabled', (data) => {
      toggleSwitch.checked = data.enabled !== undefined ? data.enabled : true;
    });
  }

  function loadCoinCount() {
    chrome.storage.sync.get(['modariCoins'], (data) => {
      const count = data.modariCoins || 0;
      coinCount.textContent = count;
    });
  }

  function loadProStatus() {
    chrome.storage.sync.get(['isPro'], (data) => {
      const isPro = data.isPro || false;
      proStatus.textContent = isPro ? "💎 Pro User" : "🆓 Free Version";
      if (coinSpeedLabel) {
        coinSpeedLabel.textContent = isPro ? "(+5/min)" : "(+2/min)";
      }
    });
  }

  function addToBlacklist() {
    const site = blacklistInput.value.trim().toLowerCase();
    if (!site) return;

    chrome.storage.sync.get(['modariBlacklist', 'isPro'], (data) => {
      const list = data.modariBlacklist || [];
      const isPro = data.isPro || false;

      if (!isPro && list.length >= 2) {
        alert("🚫 Free users can only block 2 sites. Upgrade to Pro to block more.");
        return;
      }

      if (!list.includes(site)) {
        list.push(site);
        chrome.storage.sync.set({ modariBlacklist: list }, () => {
          blacklistInput.value = '';
          loadBlacklist();
        });
      }
    });
  }

  function loadBlacklist() {
    chrome.storage.sync.get(['modariBlacklist'], (data) => {
      const list = data.modariBlacklist || [];
      blacklistList.innerHTML = '';

      list.forEach((site, index) => {
        const li = document.createElement('li');
        li.textContent = site;

        const removeBtn = document.createElement('span');
        removeBtn.textContent = '×';
        removeBtn.style.marginLeft = '8px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.color = 'red';
        removeBtn.style.fontWeight = 'bold';
        removeBtn.onclick = () => {
          list.splice(index, 1);
          chrome.storage.sync.set({ modariBlacklist: list }, loadBlacklist);
        };

        li.appendChild(removeBtn);
        blacklistList.appendChild(li);
      });
    });
  }
}
