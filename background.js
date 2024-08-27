// background.js

// Function to create a new tab with the proxied URL
function openProxiedUrl(url) {
  let cleanedUrl = cleanUrl(url);
  let processedUrl = processArchiveUrl(cleanedUrl);
  let finalUrl = cleanTrackingParams(processedUrl);

  const encodedUrl = encodeURIComponent(finalUrl);
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
      id: "archive-link",
      title: "Archive Link",
      contexts: ["link"]
  });
});

// Listener for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "archive-link") {
      openProxiedUrl(info.linkUrl);
  }
});

// List of common tracking parameters to be removed
const trackingParams = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "dclid", "gbraid", "wbraid", "msclkid", "tclid",
  "aff_id", "affiliate_id", "ref", "referer", "campaign_id", "ad_id",
  "adgroup_id", "adset_id", "creativetype", "placement", "network",
  "mc_eid", "mc_cid", "s", "icid", "_ga", "_gid", "scid", "click_id",
  "trk", "track", "trk_sid", "sid", "mibextid", "fb_action_ids",
  "fb_action_types", "twclid", "igshid", "s_kwcid"
]);

// Function to clean tracking parameters from the URL
function cleanTrackingParams(url) {
  let uri = new URL(url);

  // Remove tracking parameters
  trackingParams.forEach(param => uri.searchParams.delete(param));

  // Additional handling for YouTube URLs
  if (uri.host.includes("youtube.com") || uri.host.includes("youtu.be")) {
      let nestedQueryParams = uri.searchParams.get("q");
      if (nestedQueryParams) {
          let nestedUri = new URL(nestedQueryParams);
          let newNestedUri = new URL(nestedUri.origin + nestedUri.pathname);

          nestedUri.searchParams.forEach((value, key) => {
              newNestedUri.searchParams.append(key, value);
          });

          uri.searchParams.set("q", newNestedUri.toString());
      }

      uri.pathname = uri.pathname.replace("/shorts/", "/v/");
  }

  return uri.toString();
}

// Function to clean erroneous prefixes from the URL
function cleanUrl(url) {
  let lastValidUrlIndex = url.lastIndexOf("https://");
  return lastValidUrlIndex !== -1 ? url.substring(lastValidUrlIndex).replace(/%09+/g, "") : url.replace(/%09+/g, "");
}

// Function to process archive-specific URLs
function processArchiveUrl(url) {
  const pattern = /archive\.[a-z]+\/o\/[a-zA-Z0-9]+\/(.+)/;
  const match = url.match(pattern);
  return match ? match[1] : url;
}
