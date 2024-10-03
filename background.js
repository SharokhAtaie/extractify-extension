// Cross-browser support
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Listener for messages from content scripts
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabUrl") {
    // Send back the tab's URL to the content script
    sendResponse(sender.tab.url);
  }
});

// Update the cleanup timestamp
function updateCleanupTimestamp() {
  const currentTime = Date.now();
  browserAPI.storage.local.set({ lastCleanupTime: currentTime }, () => {
    console.log(
      "Cleanup timestamp updated:",
      new Date(currentTime).toLocaleString()
    );
  });
}

// Check if cleanup is needed based on the last cleanup time
function shouldPerformCleanup(callback) {
  const FIFTEEN_DAYS_IN_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds

  browserAPI.storage.local.get("lastCleanupTime", (result) => {
    const lastCleanupTime = result.lastCleanupTime || 0;
    const currentTime = Date.now();

    // Check if one month has passed since the last cleanup
    if (currentTime - lastCleanupTime > FIFTEEN_DAYS_IN_MS) {
      callback(true); // Perform cleanup
    } else {
      callback(false); // No cleanup needed
    }
  });
}

// Perform the data cleanup and update the timestamp
function performDataCleanup() {
  browserAPI.storage.local.clear(() => {
    console.log("All extension data cleared.");

    // Update the cleanup timestamp after performing the cleanup
    updateCleanupTimestamp();
  });
}

// Check if cleanup is needed and perform it if necessary
shouldPerformCleanup((needsCleanup) => {
  if (needsCleanup) {
    performDataCleanup();
  }
});
