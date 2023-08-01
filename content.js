const OPENING_MESSAGE = "You are a helpful assistant that summarizes recent messages on thread in a few bullet points (with line breaks). There are potentially up to three parts to your response - a very concise summary of the messages starting with the prefix 'Summary:', a list of key dates mentioned starting with the prefix 'Key dates:', and a list of action items starting with the prefix 'Action items'.";
const bodyJSON = {
    "model": "gpt-3.5-turbo",
    "messages": [
        {
            "role": "system",
            "content": OPENING_MESSAGE
        }
    ]
};

chrome.runtime.onMessage.addListener(
    async function(request, sender) {
        switch(request.message) {
            case "reset_gpt_context":
                // cut the bodyJSON.message array and keep only the first element in it
                bodyJSON.messages = bodyJSON.messages.slice(0, 1);
                break;
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
                    const maxMessages = 50;
                    let startIndex = Math.max(0, messagesDiv.length - maxMessages);
                    let messageText = "";
                    let messageCount = 0;
                    for (let i = startIndex; i < messagesDiv.length; i++) {
                        const message = messagesDiv[i];
                        const copyableText = message.querySelector('div.copyable-text');
                        if (copyableText) {
                            const span = copyableText.querySelector('span');
                            if (span) {
                                const prePlainText = copyableText.getAttribute('data-pre-plain-text');
                                messageText += prePlainText + span.textContent + "<br>";
                                messageCount++;
                            }
                        }
                    }
                    let messageSummary = "";
                    if (messageCount > 0) {
                        bodyJSON.messages.push({
                            "role": "user",
                            "content": `${messageText}`
                        });
                        messageSummary = await getSummaryFromBackend(bodyJSON);
                    }
                    // split messageText by <br> and take first item
                    const firstMessage = messageText.split("<br>")[0];
                    // split firstMessage by ] and take first item, including the ]
                    const firstMessagePrefix = firstMessage.split("]")[0] + "]";
                    // Extract the date using Regex from the first message, which looks like this: [22:46, 21/07/2023]
                    const dateRegex = /\[(\d{2}):(\d{2}), (\d{2})\/(\d{2})\/(\d{4})\]/;
                    const match = firstMessagePrefix.match(dateRegex);
                    const date = `${match[5]}-${match[4]}-${match[3]}T${match[1]}:${match[2]}:00`;
                    // Calculate the time passed since that date, in local time
                    const timePassed = new Date() - new Date(date);
                    // Format the time passed in a string reading "x days and y hours ago"
                    const daysPassed = Math.floor(timePassed / (1000 * 60 * 60 * 24));
                    const hoursPassed = Math.floor((timePassed / (1000 * 60 * 60)) % 24);
                    const timePassedString = `${daysPassed} days and ${hoursPassed} hours ago`;

                    chrome.runtime.sendMessage({ type: "messages", dom: {messageCount: messageCount, timePassedString: timePassedString, messageSummary: messageSummary} });
                } else {
                    chrome.runtime.sendMessage({ type: "messages", dom: "not found" });
                }
                break;
            case "get_details":
                const followupQuery = request.followupQuery;
                bodyJSON.messages.push({
                    "role": "user",
                    "content": `${followupQuery}`
                });
                const messageSummary = await getSummaryFromBackend(bodyJSON);
                chrome.runtime.sendMessage({ type: "messages", dom: { messageSummary: messageSummary } });
                break;
            default:
                console.log("Invalid message type");
        }
    }
);

const BACKEND_URL = "https://wdim.azurewebsites.net/api/getSummary";

async function getSummaryFromBackend(bodyJSON) {
    const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyJSON),
    });
    const backendResponse = await response.json();
    bodyJSON.messages.push(backendResponse);

    const messageText = backendResponse.content.trim();
    return messageText.replace(/\n/g, "<br>");
}
