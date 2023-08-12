import { setVisibilityState } from './util.js';
import { addFollowupElementToDOM, saveFollowupElementToStorage } from './storageHandlers.js';
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
        //window.close();
        console.log('Logged out. User info removed from storage');
        setVisibilityState(0);
    });
});

function handleButtonClick() {
    return function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            setVisibilityState(2);
            chrome.tabs.sendMessage(
                tabs[0].id,
                { message: "reset_gpt_context" }
            );
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
    // Get references to buttons and popups
    const infoButton = document.getElementById('info-button');
    const settingsButton = document.getElementById('settings-button');
    const infoPopup = document.getElementById('info-popup');
    const settingsPopup = document.getElementById('settings-popup');

    // Toggle the info popup when the info button is clicked
    infoButton.addEventListener('click', function() {
        togglePopup(infoPopup);
    });

    // Toggle the settings popup when the settings button is clicked
    settingsButton.addEventListener('click', function() {
        togglePopup(settingsPopup);
    });

    // Add a global click event listener to close the popup when clicking outside
    document.addEventListener('click', function(event) {
        if (!infoPopup.contains(event.target) && !infoButton.contains(event.target)) {
            closePopup(infoPopup);
        }

        if (!settingsPopup.contains(event.target) && !settingsButton.contains(event.target)) {
            closePopup(settingsPopup);
        }
    });
});

function togglePopup(popup) {
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'block';
    }
}

function closePopup(popup) {
    popup.style.display = 'none';
}
