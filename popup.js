import { startAnimation } from "./animation.js";

// SVG Icons
const copyIconSVG = `
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
`;

const tickIconSVG = `
  <path d="M20 6L9 17l-5-5"></path>
`;

const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy">${copyIconSVG}</svg>`;

const infoIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2v-2zm0 4h2v6h-2v-6z" fill="#888"/></svg>`;

// Get the checkbox element
const checkbox = document.getElementById('scope-checkbox');

// Browser API (cross-browser support)
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Event Handler to listen for checkbox changes
checkbox.addEventListener('change', async function() {
    try {
        // Retrieve the active tab in the current window
        const [thisTab] = await browserAPI.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Extract the domain from the tab's URL
        const domain = getDomainFromUrl(thisTab.url);

        // Fetch stored data for the domain from browser storage
        const storedDataInStorage = await browserAPI.storage.local.get(domain);

        // Check if the domain exists in the stored data
        if (!storedDataInStorage[domain]) {
            throw new Error(`No stored data found for domain: ${domain}`);
        }

        // Extract new URLs and new endpoints from the stored data
        const newurls = storedDataInStorage[domain].newURLs;
        const newendpoints = storedDataInStorage[domain].newEndpoints;

        // Update the display based on the new state
        updateDisplay(newurls, newendpoints);

        // Save the state of the checkbox to local storage
        localStorage.setItem('scopeCheckboxState', checkbox.checked);

    } catch (error) {
        // Log any errors that occur during the process
        console.error('Error in checkbox change handler:', error);
    }
});

// Update the displayed URLs and Endpoints based on checkbox state
function updateDisplay(newurls, newendpoints) {
  const urlsList = document.getElementById("url-list");
  const endpointsList = document.getElementById("endpoint-list");

  // Clear the lists
  urlsList.innerHTML = '';
  endpointsList.innerHTML = '';

  const isChecked = checkbox.checked; // Get the checkbox state

  // Filter and display URLs
  const filteredURLs = isChecked
    ? allURLsList.filter(url => getDomainFromUrl(url.filename) === currentDomain)
    : allURLsList;

  // Filter and display endpoints based on the filename domain
  const filteredEndpoints = isChecked
    ? allEndpointsList.filter(endpoint => getDomainFromUrl(endpoint.filename) === currentDomain)
    : allEndpointsList;

  updateList(urlsList, filteredURLs, newurls, "white", "red");
  updateList(endpointsList, filteredEndpoints, newendpoints);
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

// DOMContentLoaded Handler
document.addEventListener("DOMContentLoaded", initPopup);

// Variables to store URLs and endpoints
let currentDomain;
let allURLsList = [];
let allEndpointsList = [];

async function initPopup() {
  startAnimation();

  try {
    const [currentTab] = await browserAPI.tabs.query({
      active: true,
      currentWindow: true,
    });
    currentDomain = getDomainFromUrl(currentTab.url);
    if (!currentDomain) throw new Error("Domain extraction failed.");

    const storedData = await browserAPI.storage.local.get(currentDomain);
    if (storedData[currentDomain]) {
      allURLsList = storedData[currentDomain].urls;  // Store all URLs
      allEndpointsList = storedData[currentDomain].endpoints; // Store all endpoints
      // Restore checkbox state here
      restoreCheckboxState(); // Restore the checkbox state
      updateDisplay(); // Ensure the display updates based on the restored checkbox state

      // Call processStoredData function
      processStoredData(storedData[currentDomain], currentDomain);
    }


  } catch (error) {
    console.error("Error initializing popup:", error);
  }
}

// Process stored data (URLs, endpoints, scroll position, and checkbox state)
function processStoredData({ urls, endpoints, newURLs, newEndpoints }, tabUrl) {
  const urlsList = document.getElementById("url-list");
  const endpointsList = document.getElementById("endpoint-list");

  // Manage scroll position
  restoreScrollPosition(tabUrl, urlsList, endpointsList);
  handleScrollSave(tabUrl, urlsList, endpointsList);

  const allURLs = [];
  urls.forEach((url) => allURLs.push(url.text));
  newURLs.forEach((url) => allURLs.push(url.text));

  // Handle copy buttons
  handleCopyButton("copy-urls-btn", allURLs);

  const allEndpoints = [];
  endpoints.forEach((endpoint) => allEndpoints.push(endpoint.text));
  newEndpoints.forEach((endpoint) => allEndpoints.push(endpoint.text));
  handleCopyButton("copy-endpoints-btn", allEndpoints);

  // Populate URL and Endpoint lists
  updateList(urlsList, urls, newURLs, "white", "red");
  updateList(endpointsList, endpoints, newEndpoints);
  updateDisplay(newURLs, newEndpoints); // Refresh the display based on the updated lists and checkbox state

  // Save the checkbox state to local storage
  const checkbox = document.getElementById('scope-checkbox');
  localStorage.setItem('scopeCheckboxState', checkbox.checked);
}


// Restore checkbox state from local storage when initializing
function restoreCheckboxState() {
  const savedState = localStorage.getItem('scopeCheckboxState');
  const checkbox = document.getElementById('scope-checkbox');
  
  // Check if the saved state exists
  if (savedState !== null) {
    checkbox.checked = savedState === 'true'; // Convert string to boolean
  }
  // Call updateDisplay to apply filtering based on restored state
  updateDisplay(); // Update display after checkbox state restoration
}

// Restore and save scroll position for each list (URLs/Endpoints)
function restoreScrollPosition(tabUrl, urlsList, endpointsList) {
  const scrollKeyURL = `${tabUrl}_scrollPositionURL`;
  const scrollKeyEndpoint = `${tabUrl}_scrollPositionEndpoint`;

  setTimeout(() => {
    const savedScrollPositionURL = localStorage.getItem(scrollKeyURL);
    const savedScrollPositionEndpoint = localStorage.getItem(scrollKeyEndpoint);

    if (savedScrollPositionURL) urlsList.scrollTop = savedScrollPositionURL;
    if (savedScrollPositionEndpoint)
      endpointsList.scrollTop = savedScrollPositionEndpoint;
  }, 0);
}

function handleScrollSave(tabUrl, urlsList, endpointsList) {
  const scrollKeyURL = `${tabUrl}_scrollPositionURL`;
  const scrollKeyEndpoint = `${tabUrl}_scrollPositionEndpoint`;

  urlsList.addEventListener("scroll", () => {
    localStorage.setItem(scrollKeyURL, urlsList.scrollTop);
  });

  endpointsList.addEventListener("scroll", () => {
    localStorage.setItem(scrollKeyEndpoint, endpointsList.scrollTop);
  });
}

function handleCopyButton(buttonId, data) {
  const button = document.getElementById(buttonId);

  let isCopying = false;

  button.addEventListener("click", async () => {
    if (isCopying) return; // Prevent spamming copy button

    isCopying = true;
    try {
      await copyToClipboard(data.join("\n"));
      replaceIcon(button, tickIconSVG, copyIconSVG, 4000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    } finally {
      isCopying = false;
    }
  });
}

// Replace SVG icon with a delay
function replaceIcon(button, newIcon, oldIcon, delay) {
  const svg = button.querySelector("svg");
  svg.innerHTML = newIcon;

  setTimeout(() => {
    svg.innerHTML = oldIcon;
  }, delay);
}

// Update URL/Endpoint list
function updateList(listElement, items, newItems = []) {
  const fragment = document.createDocumentFragment();
  const emptyItem = listElement.querySelector(".empty");

  // Remove "empty" message if present
  if (emptyItem) {
    listElement.removeChild(emptyItem);
  }

  // Append regular items
  items.forEach((item) => {
    const li = createListItem(item.text); // Use item.text to get the URL or endpoint text
    // Create a container for the star and the copy button
    const actionContainer = document.createElement("div");
    actionContainer.classList.add("item-actions");

    const copyButton = createCopyButton(item.text); // Create the copy button for regular items
    const infoButton = createInfoButton(item);

    actionContainer.appendChild(infoButton);
    actionContainer.appendChild(copyButton);

    li.appendChild(actionContainer);

    fragment.appendChild(li);
  });

  newItems.forEach((newItem) => {
    const li = createListItem(newItem.text);

    // Create a container for the star and the copy button
    const actionContainer = document.createElement("div");
    actionContainer.classList.add("item-actions");

    const dotContainer = document.createElement("div");
    dotContainer.classList.add("dot-container");

    const divDotPing = document.createElement("div");
    divDotPing.classList.add("dot-ping");

    const divDotCore = document.createElement("div");
    divDotCore.classList.add("dot-core");

    const copyButton = createCopyButton(newItem.text);
    const infoButton = createInfoButton(newItem);

    // Append the star and copy button to the action container
    dotContainer.appendChild(divDotPing);
    dotContainer.appendChild(divDotCore);

    actionContainer.appendChild(dotContainer);
    actionContainer.appendChild(infoButton);
    actionContainer.appendChild(copyButton);

    // Append the action container to the list item
    li.appendChild(actionContainer);

    fragment.prepend(li); // Insert at the top
  });

  // Append all at once for better performance
  listElement.appendChild(fragment);
}

function createInfoButton(item) {
  const button = document.createElement("button");
  button.classList.add("info-button");

  button.innerHTML = infoIcon;

  button.addEventListener("click", () => showInfoModal(item));
  return button;
}

// Function to create a copy button
function createCopyButton(content) {
  const copyButton = document.createElement("button");
  copyButton.innerHTML = copySvg; // Assuming copySvg contains the SVG icon for the button
  copyButton.classList.add("copy-btn");

  // Event listener to copy content to clipboard
  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(content).then(() => {
      replaceIcon(copyButton, tickIconSVG, copyIconSVG, 4000);
    });
  });

  return copyButton;
}

function showInfoModal(item) {
  const modal = document.createElement("div");
  modal.classList.add("modal");

  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const closeButton = document.createElement("span");
  closeButton.classList.add("close");
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => document.body.removeChild(modal);

  const content = document.createElement("div");
  content.innerHTML = `<p><strong>Match:</strong> ${item.text}</p>
  <p><strong>Link:</strong> <a href="${item.filename}" target="__blank" style="color: white;">${item.filename}</a></p>
  <p><strong>Line:</strong> ${item.line}</p>
  <p><strong>Index:</strong> ${item.index}</p>`;

  modalContent.appendChild(closeButton);
  modalContent.appendChild(content);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal when clicking outside of the modalContent
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Create a list item for URLs or Endpoints
function createListItem(content) {
  const li = document.createElement("li");

  // Check if the content is a URL by looking for "http", "https", "ws", or "wss"
  const isUrl =
    content.startsWith("http:") ||
    content.startsWith("https:") ||
    content.startsWith("ws:") ||
    content.startsWith("wss:");

  if (isUrl) {
    // If content is a URL, wrap it in an <a> tag
    li.innerHTML = `<a href="${content}" target="__blank" style="color: white;">${content}</a>`;
  } else {
    // If content is an endpoint, just display it as plain text
    li.innerHTML = `${content}`;
  }

  return li;
}

// Copy text to clipboard using a fallback method
function copyToClipboard(text) {
  // Use modern Clipboard API if available
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}
