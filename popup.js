document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_group_name"}
        );
        setVisibilityState(1);
    });
});

function setVisibilityState(state) {
    // First, we hide all elements by default
    let elements = [
        'summarize-text',
        'summarize-text-date',
        'scrollable-section',
        'summarize-button',
        'details-input'
    ];
    elements.forEach(el => {
        document.getElementById(el).style.display = 'none';
    });
    document.getElementById('details-input').disabled = false;

    // Then, based on the state, we show the appropriate elements
    switch(state) {
        case 1:
            document.getElementById('summarize-button').style.display = 'block';
            break;
        case 2:
            document.getElementById('summarize-text').style.display = 'block';
            document.getElementById('scrollable-section').style.display = 'block';
            break;
        case 3:
            document.getElementById('summarize-text-date').style.display = 'block';
            document.getElementById('scrollable-section').style.display = 'block';
            document.getElementById('details-input').style.display = 'block';
            break;
        case 4:
            document.getElementById('summarize-text').style.display = 'block';
            document.getElementById('scrollable-section').style.display = 'block';
            document.getElementById('details-input').style.display = 'block';
            document.getElementById('details-input').disabled = true;
            break;
    }
}

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
                setVisibilityState(3);

                console.log('Group name not changed, loading messages from storage');
                // Else, if there is saved messages content, load it into the #messages div
                if (result.messagesContent) {
                    document.getElementById('original-summary').innerHTML = result.messagesContent;
                    //document.getElementById('summary-paragraphs').style.display = 'block';
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
                        //document.getElementById('summarize-text-date').style.display = 'block';
                        document.getElementById('timePassedString').textContent = request.dom.timePassedString;
                    }
                    document.getElementById('original-summary').innerHTML = request.dom.messageSummary;

                    chrome.storage.local.set({messagesContent: request.dom.messageSummary}, function() {
                        console.log('Messages content saved');
                    });

                    setVisibilityState(3);
                    break;
                case 'follow_up':
                    addFollowupElement(request.dom.messageSummary);
                    setVisibilityState(3);
                    break;
                case 'server_error':
                    document.getElementById('error-message').innerHTML = request.dom;
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

function addFollowupElement(followUpText) {
    var separator = document.createElement('hr');
    var followUpP = document.createElement('p');
    var followUpSpan = document.createElement('span');
    followUpSpan.className = 'follow-up';
    followUpSpan.innerHTML = followUpText;
    followUpP.appendChild(followUpSpan);                   

    document.getElementById('follow-up-section').appendChild(separator);
    document.getElementById('follow-up-section').appendChild(followUpP);  

    // scroll scrollable-section to the bottom
    var scrollableSection = document.getElementById('scrollable-section');
    scrollableSection.scrollTop = scrollableSection.scrollHeight;
}

// when details-input is changed and Enter is pressed, send a message to content.js to get the details
document.getElementById('details-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            setVisibilityState(4);

            const followUpText = "<b>Follow-up: </b>" + document.getElementById('details-input').value;
            addFollowupElement(followUpText);

            chrome.tabs.sendMessage(
                tabs[0].id,
                {message: "get_details", followupQuery: followUpText}
            );
        });
    }
});
