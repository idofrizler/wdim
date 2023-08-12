const OPENING_MESSAGE = `You are a helpful assistant that summarizes recent messages on a thread in a few bullet points (with line breaks).
Your answers should always be in the language most dominant in the thread.
There are potentially up to three parts to your response:
(1) a very concise summary of the messages starting with the prefix 'Summary:'
(2) a list of key dates mentioned starting with the prefix 'Key dates:' (make sure to notice the dates when messages were posted; e.g., tomorrow might mean something different if it was posted a few days ago)
(3) a list of action items starting with the prefix 'Action items'.
If asked follow-up questions, you should be able to answer them based on the information you have already provided and the context of the conversation.
Follow-up answers do not need to adhere to the same format as the original response.`;

const bodyJSON = {
    "gptBody": {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "system",
                "content": OPENING_MESSAGE
            }
        ]
    },
    "metadata": {
    }
};

function getGroupNameFromDocument() {
    const groupName = document.querySelector('span[data-testid="conversation-info-header-chat-title"]');
    if (groupName) {
        return groupName.textContent;
    }
    return null;
}

chrome.runtime.onMessage.addListener(
    async function(request, sender) {
        const groupName = getGroupNameFromDocument();
        let messageSummary;

        switch(request.message) {
            case "reset_gpt_context":
                // cut the bodyJSON.message array and keep only the first element in it
                bodyJSON.gptBody.messages = bodyJSON.gptBody.messages.slice(0, 1);
                break;
            case "get_group_name":
                if (groupName) {
                    chrome.runtime.sendMessage({ type: "group_name", dom: groupName });
                } else {
                    chrome.runtime.sendMessage({ type: "group_name", dom: "not found" });
                }
                break;
            case "get_messages":
                const messagesDiv = document.querySelectorAll('div[role="row"]');
                if (!groupName || !messagesDiv) {
                    chrome.runtime.sendMessage({ type: "messages", dom: "not found" });
                    break;
                }

                let messagesJson = parseHTMLRows(messagesDiv);
                if (messagesJson.messageCount > 0) {
                    bodyJSON.gptBody.messages.push({
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
                        groupName: groupName,
                        messageCount: messagesJson.messageCount, 
                        timePassedString: timePassedString, 
                        messageSummary: messageSummary
                    }
                });
                break;
            case "get_details":
                const followupQuery = request.followupQuery;
                bodyJSON.gptBody.messages.push({
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
                chrome.runtime.sendMessage({ type: "follow_up", dom: { messageSummary: messageSummary } });
                break;
            default:
                console.log("Invalid message type");
        }
    }
);

// Function to fetch user information from storage
function getUserInfo() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('user', function(data) {
            if (chrome.runtime.lastError) {
                console.error('Failed to get user from storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                resolve(data.user);
            }
        });
    });
}


const BACKEND_URL = "https://wdim.azurewebsites.net/api/getSummary";

async function getSummaryFromBackend(bodyJSON) {
    // Fetch user information
    let user = await getUserInfo();

    // Add the userId to the metadata of bodyJSON
    if (!user || !user.id) {
        throw new Error('User information not found in storage; cannot make request to backend.');
    }
    
    bodyJSON.metadata.userId = user.id;

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
    bodyJSON.gptBody.messages.push(backendResponse.message);

    // Extract the remaining quota
    const remainingQuota = backendResponse.remainingQuota;

    // get current date in UTC
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split('T')[0];

    chrome.storage.local.set({
        remainingQuota: remainingQuota, quotaDate: currentDateString}, function() {
        console.log('Remaining quota saved to storage.');
    });

    chrome.runtime.sendMessage({ 
        type: "quota_info", 
        dom: { remainingQuota: remainingQuota }
    });

    const messageText = backendResponse.message.content.trim();
    return messageText.replace(/\n/g, "<br>");
}
