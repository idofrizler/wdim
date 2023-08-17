import { setVisibilityState } from './util.js';

export function resetStorageKeys(storageKeys) {
    chrome.storage.local.remove(storageKeys, function() {
        console.log(`Keys removed from storage: ${storageKeys}`);
    });
}

export function restoreMessagesFromStorage(currentGroupName) {
    const storageKeys = ['groupName', 'messagesContent', 'timePassedString', 'messagesCount', 'followUpElements'];

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.storage.local.get(storageKeys, function(result) {
            if (!result.groupName) {
                return;
            }

            // If there is a saved group name and it's different from the current group name
            if (result.groupName !== currentGroupName) {
                // Remove the keys from storage
                console.log('Group name changed, removing keys from storage');
                resetStorageKeys(storageKeys);
            } else {
                console.log('Group name not changed, loading messages from storage if those exist');
                if (!result.messagesContent) {
                    return;
                }
                
                // conversation summary exists in storage (not just group name), load it
                document.getElementById('original-summary').innerHTML = result.messagesContent;
                document.getElementById('messageCount').innerHTML = result.messagesCount;
                if (!result.timePassedString) {
                    document.getElementById('summarize-text-date').style.display = 'none';
                } else {
                    document.getElementById('timePassedString').innerHTML = result.timePassedString;
                }

                if (result.followUpElements) {
                    restoreFollowupMessagesFromStorage(result.followUpElements);
                }

                setVisibilityState(3);
            }
        });
    });
}

function restoreFollowupMessagesFromStorage(followUpElements) {
    followUpElements.forEach(followUpElement => {
        addFollowupElementToDOM(followUpElement);
    });
}

export function saveFollowupElementToStorage(followUpText) {
    chrome.storage.local.get('followUpElements', function(result) {
        var followUpElements = result.followUpElements || [];
        followUpElements.push(followUpText);
        chrome.storage.local.set({followUpElements: followUpElements}, function() {
            console.log('Follow-up element saved');
        });
    });
}

export function addFollowupElementToDOM(followUpText) {
    // var separator = document.createElement('hr');
    var followUpP = document.createElement('p');
    var followUpSpan = document.createElement('span');
    followUpSpan.className = 'follow-up';
    if (followUpText.startsWith('<b>Follow-up: </b>')) {
        followUpP.className = 'user-message';
    }
    followUpSpan.innerHTML = followUpText;
    followUpP.appendChild(followUpSpan);                   

    // document.getElementById('follow-up-section').appendChild(separator);
    document.getElementById('follow-up-section').appendChild(followUpP);  

    // scroll scrollable-section to the bottom
    var scrollableSection = document.getElementById('scrollable-section');
    scrollableSection.scrollTop = scrollableSection.scrollHeight;
}