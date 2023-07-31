document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_group_name"}
        );
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_messages"}
        );
    });
});

chrome.runtime.onMessage.addListener(
    function(request) {
        if (request.dom) {
            if (request.type === 'group_name') {
                document.getElementById('group-name').textContent = request.dom;
            } else if (request.type === 'messages') {
                if (request.dom.messageCount > 0) {
                    document.getElementById('messageCount').textContent = request.dom.messageCount;
                }
                document.getElementById('messages').innerHTML = request.dom.messageSummary;
            }
        } else {
            console.error("Failed to get DOM from content script");
        }
    }
);

document.getElementById('details-button').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {message: "get_details"}
        );
    });
    document.getElementById('details-button').style.display = 'none';
    document.getElementById('messages').innerHTML = 'Creating a more detailed summary...';
});
