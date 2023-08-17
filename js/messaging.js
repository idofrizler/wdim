import { isUrlRelevant, getMatchesPatterns, setVisibilityState } from './util.js';
import { restoreMessagesFromStorage, saveFollowupElementToStorage, addFollowupElementToDOM } from './storageHandlers.js';

export function sendGroupNameMessageToBackend() {
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
                        if (request.dom.timePassedString) {
                            document.getElementById('timePassedString').textContent = request.dom.timePassedString;
                        } else {
                            document.getElementById('summarize-text-date').style.display = 'none';
                        }
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
                    document.getElementById('error-section').style.display = 'block';
                    // scroll scrollable-section to the bottom
                    var scrollableSection = document.getElementById('scrollable-section');
                    scrollableSection.scrollTop = scrollableSection.scrollHeight;
                    break;
                default:
                    console.error("Invalid request type");
            }
        } else {
            console.error("Failed to get DOM from content script");
        }
    }
);

