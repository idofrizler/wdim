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
                    let messagesJson = parseHTMLRows(messagesDiv);
                    let messageSummary = "";
                    if (messagesJson.messageCount > 0) {
                        bodyJSON.messages.push({
                            "role": "user",
                            "content": `${messagesJson.messageText}`
                        });
                        try {
                            messageSummary = await getSummaryFromBackend(bodyJSON);
                        } catch (error) {
                            console.error(error);
                            chrome.runtime.sendMessage({ type: "server_error", dom: error.message });
                            return;
                        }
                    }

                    let timePassedString = calcTimePassed(messagesJson.messageText);

                    chrome.runtime.sendMessage({ type: "messages", dom: {
                            messageCount: messagesJson.messageCount, 
                            timePassedString: timePassedString, 
                            messageSummary: messageSummary
                        }
                    });
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
                try {
                    messageSummary = await getSummaryFromBackend(bodyJSON);
                } catch (error) {
                    console.error(error);
                    chrome.runtime.sendMessage({ type: "server_error", dom: error.message });
                    return;
                }
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

    // Handle non-OK responses
    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Backend returned an error: ${response.status} ${response.statusText}. Details: ${errorDetails}`);
    }

    const backendResponse = await response.json();
    bodyJSON.messages.push(backendResponse);

    const messageText = backendResponse.content.trim();
    return messageText.replace(/\n/g, "<br>");
}
