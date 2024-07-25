// background.js

chrome.action.onClicked.addListener((tab) => {
    const currentUrl = tab.url;
    const encodedUrl = encodeURIComponent(currentUrl);
    const proxyUrl = `https://archive.is/?run=1&url=${encodedUrl}`;
    chrome.tabs.create({ url: proxyUrl });
  });
  