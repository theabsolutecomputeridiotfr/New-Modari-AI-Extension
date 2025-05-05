document.addEventListener('DOMContentLoaded', initPopup);

function initPopup() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const toggleSwitch = document.getElementById('toggle-switch');
  const coinCount = document.getElementById('coinCount');
  const blacklistInput = document.getElementById('blacklist-input');
  const addBlacklistBtn = document.getElementById('add-blacklist-btn');
  const blacklistList = document.getElementById('blacklist-list');
  const upgradeBtn = document.getElementById('upgrade-btn');
  const proStatus = document.getElementById('pro-status');
  const coinSpeedLabel = document.getElementById('coinSpeedLabel');

  // Event listeners
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  toggleSwitch.addEventListener('change', handleToggle);
  addBlacklistBtn.addEventListener('click', addToBlacklist);
  upgradeBtn.addEventListener('click', () => {
    window.open("https://modari-ai.com/products/modari-pro", "_blank");
  });

  // Auth check
  checkAuthState();

  function checkAuthState() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.warn("Not logged in:", chrome.runtime.lastError?.message);
        showLogin();
      } else {
        showControls();
        loadUserInfo();
        loadToggleState();
        loadCoinCount();
        loadProStatus();
        loadBlacklist(); // ✅ moved here
      }
    });
  }

  function handleLogin() {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Login failed:", chrome.runtime.lastError?.message);
        return;
      }
      showControls();
      loadUserInfo();
      loadToggleState();
      loadCoinCount();
      loadProStatus();
      loadBlacklist(); // ✅ moved here
    });
  }

  function handleLogout() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          chrome.storage.local.clear(() => {
            showLogin();
            console.log("👋 Logged out.");
          });
        });
      } else {
        showLogin();
      }
    });
  }

  function handleToggle(e) {
    chrome.storage.local.set({ enabled: e.target.checked });
  }

  function showControls() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('controls').classList.remove('hidden');
  }

  function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('controls').classList.add('hidden');
  }

  function loadUserInfo() {
    chrome.identity.getProfileUserInfo((info) => {
      document.getElementById('user-email').textContent = info.email || "Logged in";
    });
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
      list.forEach((site) => {
        const li = document.createElement('li');
        li.textContent = site;
        blacklistList.appendChild(li);
      });
    });
  }
}
