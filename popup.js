document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_group_name"}
        );
    });
});

function restoreMessagesFromStorage(currentGroupName) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.storage.local.get(['savedGroupName', 'messagesContent'], function(result) {
            // If there is a saved group name and it's different from the current group name
            if (result.savedGroupName !== currentGroupName) {
                // Clear the storage
                console.log('Group name changed, clearing storage');
                chrome.storage.local.clear(function() {
                    console.log('Storage cleared due to group name change');
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        {message: "reset_gpt_context"}
                    );
                });
            } else {
                console.log('Group name not changed, loading messages from storage');
                // Else, if there is saved messages content, load it into the #messages div
                if (result.messagesContent) {
                    document.getElementById('messages').innerHTML = result.messagesContent;
                    document.getElementById('summary-paragraphs').style.display = 'block';
                }
            }
            saveGroupName(currentGroupName);
        });
    });
}

// save group name to storage
function saveGroupName(groupName) {
    chrome.storage.local.set({savedGroupName: groupName}, function() {
        console.log('Group name saved: ' + groupName);
    });
}

chrome.runtime.onMessage.addListener(
    function(request) {
        if (request.dom) {
            switch(request.type) {
                case 'group_name':
                    document.getElementById('group-name').textContent = request.dom;
                    restoreMessagesFromStorage(request.dom);
                    break;
                case 'messages':
                    if (request.dom.messageCount > 0) {
                        document.getElementById('messageCount').textContent = request.dom.messageCount;
                        // make summarize-text-date visible
                        document.getElementById('summarize-text-date').style.display = 'block';
                        document.getElementById('timePassedString').textContent = request.dom.timePassedString;
                    }
                    document.getElementById('messages').innerHTML = request.dom.messageSummary;

                    chrome.storage.local.set({messagesContent: request.dom.messageSummary}, function() {
                        console.log('Messages content saved');
                    });

                    // make details-input visible
                    document.getElementById('details-input').style.display = 'block';
                    break;
                default:
                    console.error("Invalid request type");
            }
        } else {
            console.error("Failed to get DOM from content script");
        }
    }
);

// when summarize-button is clicked, send a message to content.js to get the messages
document.getElementById('summarize-button').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "reset_gpt_context"}
        );
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_messages"}
        );
    });
    document.getElementById('summarize-button').style.display = 'none';
    // show the summary paragraphs
    document.getElementById('summary-paragraphs').style.display = 'block';
});

// when details-input is changed and Enter is pressed, send a message to content.js to get the details
document.getElementById('details-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {message: "get_details", followupQuery: document.getElementById('details-input').value}
            );
        });
        document.getElementById('details-input').style.display = 'none';
    }
});
