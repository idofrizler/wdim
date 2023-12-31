const bodyJSON = {
    "gptBody": {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "system"
                //"content": getOpeningMessage()
            }
        ]
    },
    "metadata": {
    }
};

function getGroupNameFromDocument() {
    // get from document div element with attribute title="Profile Details"
    const profileDetails = document.querySelector('div[title="Profile Details"]');

    // get the div that is the next sibling of profileDetails, with attribute role="button"
    const button = profileDetails ? profileDetails.nextElementSibling : null;

    // get span with attribute aria-label, and get its content. This is the group name
    const groupName = button ? button.querySelector('span[aria-label]') : null;
    if (groupName) {
        return groupName.textContent;
    }
    return null;
}

function createFullFirstPrompt(messageText, groupName) {
    return new Promise((resolve, reject) => {
        const INSTRUCTION_PREFIX = `Please summarize the following WhatsApp conversation from a conversation named "${groupName}".`;
        //const DOMINANT_LANG_INST = `You should start by stating the dominant language of the conversation (e.g., "This conversation is in Hebrew"). Then, you should summarize the conversation in that language.`;
        const DOMINANT_LANG_INST = `The conversation is in a certain language. I need you to summarize it in the same language. So step 1 would be identifying the language and step 2 would be summarizing it in the same language from step 1.`;
        let dominantLang = "";

        chrome.storage.local.get('replyInDominantLanguage', function(data) {
            const replyInDominantLanguage = data.replyInDominantLanguage;
            if (replyInDominantLanguage) {
                dominantLang = DOMINANT_LANG_INST;
            }
            resolve(`${INSTRUCTION_PREFIX}\n${dominantLang}\n${messageText}`);
        });
    });
}

chrome.runtime.onMessage.addListener(
    async function(request, sender) {
        const groupName = getGroupNameFromDocument();
        let messageSummary;

        switch(request.message) {
            case "get_group_name":
                if (groupName) {
                    chrome.runtime.sendMessage({ type: "group_name", dom: groupName });
                } else {
                    chrome.runtime.sendMessage({ type: "group_name", dom: "not found" });
                }
                break;
            case "get_messages":
                const conversationPanel = document.querySelector('div[id="main"]');
                const messagesDiv = conversationPanel.querySelectorAll('div[role="row"]');
                if (!groupName || !messagesDiv) {
                    chrome.runtime.sendMessage({ type: "messages", dom: "not found" });
                    break;
                }

                let messagesJson = parseHTMLRows(messagesDiv);
                let firstPrompt = await createFullFirstPrompt(messagesJson.messageText, groupName);

                if (messagesJson.messageCount > 0) {
                    // resetting bodyJSON to system context
                    bodyJSON.gptBody.messages = bodyJSON.gptBody.messages.slice(0, 1);
                    bodyJSON.gptBody.messages.push({
                        "role": "user",
                        "content": `${firstPrompt}`
                    });
                    try {
                        messageSummary = await callApiSource(bodyJSON);
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
                    messageSummary = await callApiSource(bodyJSON);
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
function getUserToken() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('userToken', function(data) {
            if (chrome.runtime.lastError) {
                console.error('Failed to get user from storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                resolve(data.userToken);
            }
        });
    });
}

function getAssistant() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('assistantValue', function(data) {
            // switch case for different assistants, based on assistantMap. If not found, choose Woody()
            if (chrome.runtime.lastError) {
                console.error('Failed to get assistant from storage:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            }
            else {
                const assistant = data.assistantValue ? data.assistantValue : "default";
                if (assistantMap[assistant]) {
                    resolve(assistantMap[assistant]);
                } else {
                    reject("Assistant not found in assistantMap");
                }
            }
        });
    });
}