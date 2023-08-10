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

// when summarize-button is clicked, send a message to content.js to get the messages
document.getElementById('summarize-button').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        setVisibilityState(2);
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "reset_gpt_context"}
        );
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_messages"}
        );
    });
});

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