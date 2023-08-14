import { setVisibilityState } from './util.js';
import { addFollowupElementToDOM, saveFollowupElementToStorage, resetStorageKeys } from './storageHandlers.js';
import { bootstrapAfterLogin } from './init.js';

document.getElementById('login-google').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'login' }, function(response) {
        if (response.error) {
            console.error(JSON.stringify(response.error, null, 2));
        } else {
            //console.log('Token:', response.token);
            console.log('User info: ', response.user);
            bootstrapAfterLogin(response.user);
            // Use the token as needed, or make API requests to fetch user data.
        }
    });
});

document.getElementById('logout-google').addEventListener('click', () => {
    chrome.storage.local.remove('user', function() {
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

const promprtDropdownButton = document.getElementById("prompt-dropdown-btn");
const promptOptions = document.getElementById("prompt-options");

promprtDropdownButton.addEventListener("click", () => {
    promptOptions.style.display = promptOptions.style.display === "block" ? "none" : "block";
});

const optionElements = document.querySelectorAll(".dropdown-option");
optionElements.forEach((option) => {
    option.addEventListener("click", (event) => {
        const selectedTitle = option.querySelector(".option-title").textContent;
        promprtDropdownButton.textContent = selectedTitle;
        promptOptions.style.display = "none";
    });
});

