document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('user', function(data) {
        const user = data.user;

        if (user) {
            console.log('User info found in storage:', user);
            bootstrapAfterLogin(user);
        } else {
            console.log('User not logged in');
            setVisibilityState(0);
        }
    });
});

function bootstrapAfterLogin(user) {
    document.getElementById('user-name').innerHTML = user.given_name;
    chrome.storage.local.get(['remainingQuota'], function(data) {
        if (data.remainingQuota) {
            document.getElementById('quota-message').innerHTML = data.remainingQuota;
        }
    });
        
    sendGroupNameMessageToBackend();
    setVisibilityState(1);
}

function sendGroupNameMessageToBackend() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var currentTab = tabs[0];
        if (currentTab) {
            var matchesPatterns = getMatchesPatterns();
            if (isUrlRelevant(currentTab.url, matchesPatterns)) {
                if (currentTab.status === "complete") {
                    chrome.tabs.sendMessage(
                        currentTab.id,
                        {message: "get_group_name"}
                    );
                } else {
                    console.log('Tab not loaded yet. Waiting for load event');
                    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                        if (tabId === currentTab.id && info.status === "complete") {
                            chrome.tabs.sendMessage(
                                currentTab.id,
                                {message: "get_group_name"}
                            );
                            chrome.tabs.onUpdated.removeListener(listener);
                        }
                    });
                }
            } else {
                console.log('Not a relevant URL');
            }
        }
    });
}

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

function getMatchesPatterns() {
    var manifest = chrome.runtime.getManifest();
    var contentScripts = manifest.content_scripts || [];
    var allMatches = [];

    contentScripts.forEach(function(contentScript) {
        if (contentScript.matches) {
            allMatches = allMatches.concat(contentScript.matches);
        }
    });

    return allMatches;
}

function isUrlRelevant(url, patterns) {
    return patterns.some(pattern => {
        // Convert the manifest pattern to a regular expression.
        // This simple approach might not cover all cases but works for most common patterns.
        var regexPattern = pattern.replace('*://', 'https://|http://').replace('*', '.*');
        var regex = new RegExp(regexPattern);
        return regex.test(url);
    });
}

document.getElementById('logout-google').addEventListener('click', () => {
    chrome.storage.local.remove('user', function() {
        //window.close();
        console.log('Logged out. User info removed from storage');
        setVisibilityState(0);
    });
});

function toggleElementsVisibility(elements, display) {
    elements.forEach(el => {
        document.getElementById(el).style.display = display;
    });
}

function setVisibilityState(state) {
    // First, we hide all elements by default
    let elements = [
        'summarize-text',
        'summarize-text-date',
        'scrollable-section',
        'summarize-button',
        'details-input',
        'login-section',
        'main-section'
    ];

    toggleElementsVisibility(elements, 'none');
    document.getElementById('details-input').disabled = false;

    // if state = 0, show only login-section; else, show main-section
    if (state === 0) {
        toggleElementsVisibility(['login-section'], 'block');
    } else {
        toggleElementsVisibility(['main-section'], 'block');
    }

    console.log('Setting visibility state to ' + state);

    // Then, based on the state, we show the appropriate elements inside of main section
    switch(state) {
        case 0:
            break;
        case 1:
            toggleElementsVisibility(['summarize-button'], 'block');
            break;
        case 2:
            toggleElementsVisibility(['summarize-text', 'scrollable-section'], 'block');
            break;
        case 3:
            toggleElementsVisibility(['summarize-text-date', 'scrollable-section', 'details-input'], 'block');
            break;
        case 4:
            toggleElementsVisibility(['summarize-text', 'scrollable-section', 'details-input'], 'block');
            document.getElementById('details-input').disabled = true;
            break;
        default:
            console.log('Invalid state');
            break;
    }
}

const storageKeys = ['groupName', 'messagesContent', 'timePassedString', 'messagesCount', 'followUpElements'];

function restoreMessagesFromStorage(currentGroupName) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.storage.local.get(storageKeys, function(result) {
            if (!result.groupName) {
                return;
            }

            // If there is a saved group name and it's different from the current group name
            if (result.groupName !== currentGroupName) {
                // Remove the keys from storage
                console.log('Group name changed, removing keys from storage');
                chrome.storage.local.remove(storageKeys, function() {
                    console.log('Keys removed from storage due to group name change');
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        {message: "reset_gpt_context"}
                    );
                });
            } else {
                console.log('Group name not changed, loading messages from storage if those exist');
                if (!result.messagesContent) {
                    return;
                }
                
                // conversation summary exists in storage (not just group name), load it
                document.getElementById('original-summary').innerHTML = result.messagesContent;
                document.getElementById('messageCount').innerHTML = result.messagesCount;
                document.getElementById('timePassedString').innerHTML = result.timePassedString;

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

// // save group name to storage
// function saveGroupName(groupName) {
//     chrome.storage.local.set({savedGroupName: groupName}, function() {
//         console.log('Group name saved: ' + groupName);
//     });
// }

chrome.runtime.onMessage.addListener(
    function(request) {
        if (request.dom) {
            switch(request.type) {
                case 'group_name':
                    document.getElementById('group-name').textContent = request.dom;
                    restoreMessagesFromStorage(request.dom);
                    break;
                case 'messages':
                    document.getElementById('group-name').textContent = request.dom.groupName;
                    if (request.dom.messageCount > 0) {
                        document.getElementById('messageCount').textContent = request.dom.messageCount;
                        document.getElementById('timePassedString').textContent = request.dom.timePassedString;
                    }
                    document.getElementById('original-summary').innerHTML = request.dom.messageSummary;

                    chrome.storage.local.set({
                        groupName: request.dom.groupName,
                        messagesContent: request.dom.messageSummary,
                        messagesCount: request.dom.messageCount,
                        timePassedString: request.dom.timePassedString
                    }, function() {
                        console.log('Messages content saved');
                    });

                    setVisibilityState(3);
                    break;
                case 'follow_up':
                    addFollowupElementToDOM(request.dom.messageSummary);
                    saveFollowupElementToStorage(request.dom.messageSummary);
                    setVisibilityState(3);
                    break;
                case 'quota_info':
                    console.log('Updating quota info');
                    document.getElementById('quota-message').textContent = request.dom.remainingQuota;
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

function saveFollowupElementToStorage(followUpText) {
    chrome.storage.local.get('followUpElements', function(result) {
        var followUpElements = result.followUpElements || [];
        followUpElements.push(followUpText);
        chrome.storage.local.set({followUpElements: followUpElements}, function() {
            console.log('Follow-up element saved');
        });
    });
}

function addFollowupElementToDOM(followUpText) {
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
            addFollowupElementToDOM(followUpText);
            saveFollowupElementToStorage(followUpText);

            chrome.tabs.sendMessage(
                tabs[0].id,
                {message: "get_details", followupQuery: followUpText}
            );
        });
    }
});