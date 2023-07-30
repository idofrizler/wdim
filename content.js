const bodyJSON = {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant that summarizes recent messages on thread in a few bullet points (with line breaks). Start with general concise summary; I might ask for more details later."
        }
    ]
};

chrome.runtime.onMessage.addListener(
    function(request, sender) {
        switch(request.message) {
            case "get_group_name":
                const groupName = document.querySelector('span[data-testid="conversation-info-header-chat-title"]');
                if (groupName) {
                    chrome.runtime.sendMessage({ type: "group_name", dom: groupName.textContent });
                } else {
                    chrome.runtime.sendMessage({ type: "group_name", dom: "not found" });
                }
                break;
            case "get_messages":
                const messagesDiv = document.querySelectorAll('div[role="row"]');
                if (messagesDiv) {
                    let messageText = "";
                    let messageCount = 0;
                    messagesDiv.forEach((message) => {
                        const copyableText = message.querySelector('div.copyable-text');
                        if (copyableText) {
                            const span = copyableText.querySelector('span');
                            if (span) {
                                const prePlainText = copyableText.getAttribute('data-pre-plain-text');
                                messageText += prePlainText + span.textContent + "<br>";
                                messageCount++;
                            }
                        }
                    });
                    if (messageCount > 0) {
                        bodyJSON.messages.push({
                            "role": "user",
                            "content": `${messageText}`
                        });
                        getSummary(bodyJSON, messageCount);
                    } else {
                        chrome.runtime.sendMessage({ type: "messages", dom: {messageCount: messageCount, messageText: ""} });
                    }
                } else {
                    chrome.runtime.sendMessage({ type: "messages", dom: "not found" });
                }
                break;
            case "get_details":
                bodyJSON.messages.push({
                    "role": "user",
                    "content": "Please be more descriptive. Keep writing in bullet points."
                });
                getDetails();
                break;
            default:
                console.log("Invalid message type");
        }
    }
);

async function getDetails() {
    const response = await callOpenAI(bodyJSON);
    chrome.runtime.sendMessage({ type: "messages", dom: { messageText: response } });
}

async function getSummary(bodyJSON, messageCount) {
    const response = await callOpenAI(bodyJSON);
    chrome.runtime.sendMessage({ type: "messages", dom: { messageCount: messageCount, messageText: response } });
}

async function callOpenAI(bodyJSON) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer <bearer-token>',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyJSON),
    });
    const data = await response.json();
    const message = data.choices[0].message;
    const openAIresponse = message.content.trim();
    bodyJSON.messages.push(message);

    return openAIresponse.replace(/\n/g, "<br>");
}
