let coinsEarned = 0;

// Log when the service worker loads
console.log("✅ Modari AI coin tracker loaded.");

// Load saved coin count
chrome.storage.sync.get(['modariCoins'], (data) => {
  coinsEarned = data.modariCoins || 0;
  console.log("🔄 Loaded Modari Coins:", coinsEarned);
});

// Create a repeating alarm every 1 minute
chrome.alarms.create("updateCoins", {
  delayInMinutes: 1,
  periodInMinutes: 1
});

// When the alarm fires, add 2 coins and save
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateCoins") {
    coinsEarned += 2;
    chrome.storage.sync.set({ modariCoins: coinsEarned }, () => {
      console.log("🪙 Coins updated to:", coinsEarned);
    });
  }
});
