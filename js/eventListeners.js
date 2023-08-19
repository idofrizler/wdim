import { setVisibilityState } from './util.js';
import { addFollowupElementToDOM, saveFollowupElementToStorage, resetStorageKeys } from './storageHandlers.js';
import { bootstrapAfterLogin } from './init.js';

document.getElementById('login-google').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'login' }, function(response) {
        if (response.error) {
            console.error(JSON.stringify(response.error, null, 2));
        } else {
            console.log('User info: ', response.userInfo);
            bootstrapAfterLogin(response.userInfo);
        }
    });
});

document.getElementById('logout-google').addEventListener('click', () => {
    chrome.storage.local.remove(['userInfo', 'userToken', 'expirationTime'], function() {
        console.log('Logged out. User info removed from storage');
        setVisibilityState(0);
    });
});

function handleButtonClick() {
    return function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            setVisibilityState(2);
            resetStorageKeys(['messagesContent', 'timePassedString', 'messagesCount', 'followUpElements']);
            
            // empty the content of the original summary element
            document.getElementById('original-summary').innerHTML = "";

            // remove all elements in the follow-up section
            const followUpSection = document.getElementById('follow-up-section');
            while (followUpSection.firstChild) {
                followUpSection.removeChild(followUpSection.firstChild);
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                { message: "get_messages" }
            );
        });
    };
}

// when summarize-button is clicked, send a message to content.js to get the messages
document.getElementById('summarize-button').addEventListener('click', handleButtonClick());
document.getElementById('regenerate-button').addEventListener('click', handleButtonClick());

// when details-input is changed and Enter is pressed, send a message to content.js to get the details
document.getElementById('details-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            setVisibilityState(4);

            const followUpText = "<b>Follow-up: </b>" + document.getElementById('details-input').value;
            addFollowupElementToDOM(followUpText);
            saveFollowupElementToStorage(followUpText);

            chrome.tabs.sendMessage(
                tabs[0].id,
                {message: "get_details", followupQuery: followUpText}
            );
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const infoButton = document.getElementById('info-button');
    const settingsButton = document.getElementById('settings-button');
    const infoPopup = document.getElementById('info-popup');
    const settingsPopup = document.getElementById('settings-popup');
    const popupOverlay = document.getElementById('popup-overlay');

    infoButton.addEventListener('click', function() {
        openPopup(infoPopup, popupOverlay);
    });

    settingsButton.addEventListener('click', function() {
        openPopup(settingsPopup, popupOverlay);
    });

    document.addEventListener('click', function(event) {
        if (!infoPopup.contains(event.target) && !infoButton.contains(event.target) &&
            !settingsPopup.contains(event.target) && !settingsButton.contains(event.target)) {
            closePopup(infoPopup, popupOverlay);
            closePopup(settingsPopup, popupOverlay);
        }
    });
});

function openPopup(popup, overlay) {
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function closePopup(popup, overlay) {
    popup.style.display = 'none';
    overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const languageToggle = document.getElementById('language-toggle');
    
    chrome.storage.local.get('replyInDominantLanguage', function(data) {
        const replyInDominantLanguage = data.replyInDominantLanguage;
        
        if (replyInDominantLanguage !== undefined) {
            languageToggle.checked = replyInDominantLanguage;
        }
    });
    
    languageToggle.addEventListener('change', function() {
        const replyInDominantLanguage = languageToggle.checked;
        
        chrome.storage.local.set({ replyInDominantLanguage: replyInDominantLanguage });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const promprtDropdownButton = document.getElementById("prompt-dropdown-btn");
    const promptOptions = document.getElementById("prompt-options");

    chrome.storage.local.get(["assistantName", "assistantValue"], function(data) {
        if (data.assistantName && data.assistantValue) {
            // Use the values as required
            const assistantName = data.assistantName;
            const assistantValue = data.assistantValue;
            console.log(`Selected assistant: ${assistantName} (${assistantValue})`);

            promprtDropdownButton.textContent = data.assistantName;
        }
    });    

    promprtDropdownButton.addEventListener("click", () => {
        promptOptions.style.display = promptOptions.style.display === "block" ? "none" : "block";
    });

    const optionElements = document.querySelectorAll(".dropdown-option");
    optionElements.forEach((option) => {
        option.addEventListener("click", (event) => {
            const selectedTitle = option.querySelector(".option-title").textContent;
            const selectedAssistant = option.getAttribute("data-assistant"); // Get the assistant value from data-attribute
    
            promprtDropdownButton.textContent = selectedTitle;
            promptOptions.style.display = "none";
    
            chrome.storage.local.set({ assistantName: selectedTitle, assistantValue: selectedAssistant }); // Store both the assistant name and value in local storage
        });
    });    
});

const apiKeyLink = document.getElementById('api-key-link');
const apiKeyPopup = document.getElementById('api-key-popup');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySaveButton = document.getElementById('api-key-save');
const apiKeyDeleteButton = document.getElementById('api-key-delete');

// Load existing key and update link text if needed
chrome.storage.local.get('userApiKey', function(data) {
    if (data.userApiKey) {
        apiKeyLink.textContent = 'Change Key';
        apiKeyInput.value = data.userApiKey;
    }
});

// Toggle popup visibility when link is clicked
apiKeyLink.addEventListener('click', function(e) {
    e.preventDefault();
    apiKeyPopup.classList.toggle('hidden');
});

// Save the key when "Save" is clicked
apiKeySaveButton.addEventListener('click', function() {
    const enteredApiKey = apiKeyInput.value.trim();

    if (enteredApiKey) {
        chrome.storage.local.set({ userApiKey: enteredApiKey }, function() {
            apiKeyLink.textContent = 'Change Key';
            apiKeyPopup.classList.add('hidden');
        });
    } else {
        alert('Please enter a valid API Key.');
    }
});

// Delete the key when "Delete" is clicked
apiKeyDeleteButton.addEventListener('click', function() {
    chrome.storage.local.remove('userApiKey', function() {
        apiKeyLink.textContent = 'Add Key';
        apiKeyInput.value = '';
        apiKeyPopup.classList.add('hidden');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const closeButton = document.querySelector('.popup-close-btn');
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            // Assuming 'hidden' class hides the popup
            document.getElementById('api-key-popup').classList.add('hidden');
        });
    }
});
