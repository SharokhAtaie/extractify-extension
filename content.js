// Arrays to store URLs and endpoints
const urls = [];
const endpoints = [];
const newEndpoints = [];
const newURLs = [];

const excludeExt = [
  ".js",
  ".svg",
  ".ts",
  ".jpg",
  ".json",
  ".css",
  ".png",
  ".webp",
  ".mp4",
  ".woff",
  ".ttf",
];

const excludeDomain = [
  "www.w3.org",
  "reactjs.org",
  "googleapis.com",
  "googletagmanager.com",
  "schema.org",
  "wikipedia.org",
  "goo.gl",
  "googleadservices.com",
  "doubleclick.net",
  "cdnjs.cloudflare.com",
  "use.typekit.net",
  "react.dev",
  "hubspot.com",
  "hs-analytics.net",
  "cloudfront.net",
  "gstatic.com",
];

// Cross-browser support
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Debounce to avoid excessive calls to saveDataToStorage
let debounceTimer;
function debounceSaveData(tabUrl, delay = 1000) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveDataToStorage(tabUrl);
  }, delay);
}

// Utility function to extract the domain from a URL
function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname; // Extract the domain part
    return domain;
  } catch (e) {
    console.error(`Invalid URL: ${url}`, e);
    return null;
  }
}

function handleMatches(isNew, matchedText, array, newArray, data) {
  if (isNew && !array.some((item) => item.text === matchedText)) {
    newArray.push(data);
  } else if (!array.some((item) => item.text === matchedText)) {
    array.push(data);
  }
}

let matchIdCounter = 1; // Initialize counter for match IDs

// Function to process JavaScript content and categorize matches
function processJavaScriptContent(scriptContent, filename, isNew = false) {
  const regex =
    /(?:`|"|'|\n|\r)(((?:[a-zA-Z]{1,10}:\/\/|\/\/)[^"'\/]{1,}\.[a-zA-Z]{2,}[^"']{0,})|((?:\/|\.\.\/|\.\/)[^"'><,;| *()(%%$^\/\\\[\]][^"'><,;|()]{1,})|([a-zA-Z0-9_\-\/]{1,}\/[a-zA-Z0-9_\-\/]{1,}\.(?:[a-zA-Z]{1,4}|action)(?:[\?|\/][^"|']{0,}|))|([a-zA-Z0-9_\-]{1,}\.(?:php|asp|aspx|cfm|jsp|json|js|action|html|htm|bak|do|txt|xml|xls|xlsx|key|env|pem|git|ovpn|log|secret|secrets|access|dat|db|sql|pwd|passwd|gitignore|properties|dtd|conf|cfg|config|configs|apk|cgi|sh|py|java|rb|rs|go|yml|yaml|toml|php4|zip|tar|tar.bz2|tar.gz|rar|7z|gz|dochtml|doc|docx|csv|odt|ts|phtml|php5|pdf)(?:\?[^"|^']{0,}|)))(?:`|"|'|\n|\r)/g;

  let match;
  while ((match = regex.exec(scriptContent)) !== null) {
    const matchedText = match[1] || match[0];
    const lineNumber = scriptContent.slice(0, match.index).split("\n").length;

    const data = {
      id: matchIdCounter++,
      index: match.index,
      text: matchedText,
      line: lineNumber,
      filename,
    };

    if (
      matchedText.startsWith("http:") ||
      matchedText.startsWith("https:") ||
      matchedText.startsWith("ws:") ||
      matchedText.startsWith("wss:") ||
      /^\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(matchedText)
    ) {
      if (
        !excludeDomain.some((domain) => matchedText.includes(domain)) &&
        !excludeExt.some((ext) => matchedText.includes(ext))
      ) {
        handleMatches(isNew, matchedText, urls, newURLs, data);
      }
    } else if (
      !excludeExt.some((ext) => matchedText.endsWith(ext)) &&
      !matchedText.startsWith("//")
    ) {
      handleMatches(isNew, matchedText, endpoints, newEndpoints, data);
    }
  }
}

// Async function to process all JavaScript scripts on the page
async function processAllScripts() {
  const scripts = Array.from(document.querySelectorAll("script"));
  for (const script of scripts) {
    if (script.src) {
      if (!excludeDomain.some((domain) => script.src.includes(domain))) {
        try {
          const response = await fetch(script.src);
          const scriptContent = await response.text();
          processJavaScriptContent(scriptContent, script.src);
        } catch (err) {
          console.error("Error fetching JS file:", err);
        }
      }
    } else {
      processJavaScriptContent(script.innerHTML, document.location.href);
    }
  }
}

// Function to save data to storage based on the tab URL
function saveDataToStorage(tabUrl) {
  const domain = getDomainFromUrl(tabUrl);
  if (!domain) return;
  // Prepare the data to be saved (array of objects)
  const data = {
    urls: urls, // Using the arrays of objects directly
    endpoints: endpoints,
    newEndpoints: newEndpoints,
    newURLs: newURLs,
  };

  // Retrieve existing data for the domain, merge new data with existing, and save
  browserAPI.storage.local.get(domain, (result) => {
    const existingData = result[domain] || {
      urls: [],
      endpoints: [],
      newEndpoints: [],
      newURLs: [],
    };

    // Merge the existing data with the new data
    const mergedData = {
      urls: [...existingData.urls, ...data.urls],
      endpoints: [...existingData.endpoints, ...data.endpoints],
      newEndpoints: [...existingData.newEndpoints, ...data.newEndpoints],
      newURLs: [...existingData.newURLs, ...data.newURLs],
    };

    // Remove duplicates based on 'text' property
    mergedData.urls = mergedData.urls.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.text === item.text)
    );
    mergedData.endpoints = mergedData.endpoints.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.text === item.text)
    );
    mergedData.newEndpoints = mergedData.newEndpoints.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.text === item.text)
    );
    mergedData.newURLs = mergedData.newURLs.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.text === item.text)
    );

    // Store the merged data back to the domain
    browserAPI.storage.local.set({ [domain]: mergedData }, () => {
      console.log(`Data stored for domain ${domain}:`, mergedData);
    });
  });
}

// Initialize by processing scripts and setting up mutation observer
function init() {
  browserAPI.runtime.sendMessage({ type: "getTabUrl" }, async (tabUrl) => {
    await processAllScripts();
    debounceSaveData(tabUrl);
  });

  const targetNode = document.documentElement; // Observe the entire document
  const observerConfig = { childList: true, subtree: true }; // Observe additions in the DOM

  const callback = async (mutationsList) => {
    const newScripts = [];
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "SCRIPT"
          ) {
            newScripts.push(node);
          }
        });
      }
    }

    // Process newly added scripts
    if (newScripts.length > 0) {
      for (const script of newScripts) {
        if (script.src) {
          // Skip excluded domains
          if (!excludeDomain.some((domain) => script.src.includes(domain))) {
            try {
              const response = await fetch(script.src);
              const scriptContent = await response.text();
              processJavaScriptContent(scriptContent, script.src, true);
            } catch (err) {
              console.error("Error fetching JS file:", err);
            }
          }
        } else {
          processJavaScriptContent(
            script.innerHTML,
            document.location.href,
            true
          );
        }
      }

      // Save data after processing
      browserAPI.runtime.sendMessage({ type: "getTabUrl" }, (tabUrl) => {
        debounceSaveData(tabUrl);
      });
    }
  };

  const observer = new MutationObserver(callback); // Create an observer instance
  observer.observe(targetNode, observerConfig); // Start observing
}

// On window load, initialize script processing
window.onload = init;
