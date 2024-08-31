// Function to create a new tab with the proxied URL
function openProxiedUrl(url) {
  try {
    let cleanedUrl = cleanUrl(url);
    let processedUrl = processArchiveUrl(cleanedUrl);
    let finalUrl = cleanTrackingParams(processedUrl);

    const encodedUrl = encodeURIComponent(finalUrl);
    const proxyUrl = `https://archive.is/?run=1&url=${encodedUrl}`;
    chrome.tabs.create({ url: proxyUrl });
  } catch (error) {
    console.error("Failed to open proxied URL: ", error);
  }
}

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  const currentUrl = tab.url;
  openProxiedUrl(currentUrl);
});

// Create context menu for hyperlinks and selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "archive-selection",
    title: "Archive Embedded URL in Selection",
    contexts: ["selection", "link"]
  });
});

// Listener for right-click menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.linkUrl) {
    openProxiedUrl(info.linkUrl);
  } else if (info.selectionText) {
    let url = extractUrl(info.selectionText);
    if (url) {
      openProxiedUrl(url);
    } else {
      console.log("No valid URL found in the selected text.");
    }
  }
});


// List of common tracking parameters to be removed
const trackingParams = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "dclid", "gbraid", "wbraid", "msclkid", "tclid",
  "aff_id", "affiliate_id", "ref", "referer", "campaign_id", "ad_id",
  "adgroup_id", "adset_id", "creativetype", "placement", "network",
  "mc_eid", "mc_cid", "si", "icid", "_ga", "_gid", "scid", "click_id",
  "trk", "track", "trk_sid", "sid", "mibextid", "fb_action_ids",
  "fb_action_types", "twclid", "igshid", "s_kwcid", "sxsrf", "sca_esv",
  "source", "tbo", "sa", "ved" //sxsrf might be needed on some sites, but google uses it for tracking
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

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function extractUrl(text) {
  // Regular expression to match URLs
  const urlPattern = /https?:\/\/[^\s/$.?#].[^\s]*/g;
  const match = text.match(urlPattern);

  if (match && match.length > 0) {
    let url = match[0];
    // Clean the URL by removing erroneous prefixes
    url = cleanUrl(url);
    return url;
  } else {
    return null;
  }
}
