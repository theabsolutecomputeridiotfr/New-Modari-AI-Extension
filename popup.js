document.addEventListener('DOMContentLoaded', initPopup);

// 🧠 GA4 Setup — Replace with your real IDs
const GA_MEASUREMENT_ID = "G-WBH5K3Y4Z6";
const API_SECRET = "WM7tpPZiRB6l8KI2";

function trackEvent(eventName, params = {}) {
  chrome.storage.sync.get('ga_client_id', (data) => {
    let clientId = data.ga_client_id;

    if (!clientId) {
      clientId = crypto.randomUUID();
      chrome.storage.sync.set({ ga_client_id: clientId });
    }

    fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${API_SECRET}`, {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: params
          }
        ]
      })
    }).then(() => {
      console.log(`📊 Tracked event: ${eventName}`);
    }).catch(err => {
      console.error("❌ GA tracking failed", err);
    });
  });
}

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

  // Event Listeners
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  toggleSwitch.addEventListener('change', handleToggle);
  addBlacklistBtn.addEventListener('click', addToBlacklist);
  upgradeBtn.addEventListener('click', () => {
    trackEvent("upgrade_clicked", { source: "popup_ui" });
    window.open("https://modari-ai.com/products/modari-pro", "_blank");
  });

  checkAuthState();
  loadBlacklist();

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
      }
    });
  }

  function handleLogin() {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("Login failed:", chrome.runtime.lastError?.message);
        return;
      }

      // ✅ After login, track "account_created" only once
      chrome.identity.getProfileUserInfo((info) => {
        const email = info.email;
        document.getElementById('user-email').textContent = email || "Logged in";

        chrome.storage.sync.get('accountTracked', (res) => {
          if (!res.accountTracked) {
            trackEvent("account_created", { email });
            chrome.storage.sync.set({ accountTracked: true });
          }
        });
      });

      showControls();
      loadToggleState();
      loadCoinCount();
      loadProStatus();
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
          trackEvent("site_blocked", { site });
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

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.style.marginLeft = '8px';
        removeBtn.style.fontSize = '12px';
        removeBtn.style.color = '#f44336';
        removeBtn.style.border = 'none';
        removeBtn.style.background = 'transparent';
        removeBtn.style.cursor = 'pointer';

        removeBtn.addEventListener('click', () => {
          list.splice(index, 1);
          chrome.storage.sync.set({ modariBlacklist: list }, loadBlacklist);
          trackEvent("site_unblocked", { site });
        });

        li.appendChild(removeBtn);
        blacklistList.appendChild(li);
      });
    });
  }
}
