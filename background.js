// background.js

// Function to create a new tab with the proxied URL
function openProxiedUrl(url) {
  const encodedUrl = encodeURIComponent(url);
  const proxyUrl = `https://archive.is/?run=1&url=${encodedUrl}`;
  chrome.tabs.create({ url: proxyUrl });
}
  
  // Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  const currentUrl = tab.url;
  openProxiedUrl(currentUrl);
});

// Create context menu for hyperlinks
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "proxy-link",
    title: "Open link with Proxy",
    contexts: ["link"]
  });
});

// Listener for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "proxy-link") {
    openProxiedUrl(info.linkUrl);
  }
});
