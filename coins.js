const GA_MEASUREMENT_ID = "G-WBH5K3Y4Z6"; // GA4 ID
const API_SECRET = "WM7tpPZiRB6l8KI2";     // Replace with your API secret

let coinsEarned = 0;

// ✅ Load saved coin count
chrome.storage.sync.get(['modariCoins'], (data) => {
  coinsEarned = data.modariCoins || 0;
  console.log("🪙 Loaded Modari Coins:", coinsEarned);
});

// ✅ GA Tracking Function
function trackEvent(eventName, params = {}) {
  chrome.storage.sync.get('ga_client_id', (data) => {
    let clientId = data.ga_client_id;

    if (!clientId) {
      clientId = crypto.randomUUID(); // generate new ID
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
      }),
    }).then(() => {
      console.log(`📊 Sent GA event: ${eventName}`);
    }).catch(err => {
      console.error("❌ GA error:", err);
    });
  });
}

// ✅ Track extension install
chrome.runtime.onInstalled.addListener(() => {
  trackEvent("extension_install", {
    platform: "chrome_extension",
    version: "1.1.0"
  });
});

// ✅ Coin update every 1 minute
chrome.alarms.create("updateCoins", {
  delayInMinutes: 1,
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateCoins") {
    // Load Pro status to adjust coin rate
    chrome.storage.sync.get(['isPro'], (data) => {
      const isPro = data.isPro || false;
      const coinsToAdd = isPro ? 5 : 2;
      coinsEarned += coinsToAdd;

      chrome.storage.sync.set({ modariCoins: coinsEarned }, () => {
        console.log(`🪙 Coins updated by ${coinsToAdd}:`, coinsEarned);
      });

      trackEvent("coins_earned", {
        amount: coinsToAdd,
        total: coinsEarned,
        pro: isPro
      });
    });
  }
});
