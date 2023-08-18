const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const BACKEND_URL = "https://wdim.azurewebsites.net/api/getSummary";

async function callApiSource(bodyJSON) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('userApiKey', function(data) {
            if (data.userApiKey) {
                resolve(getSummaryDirectlyFromGPT(bodyJSON, data.userApiKey));
            } else {
                resolve(getSummaryFromBackend(bodyJSON));
            }
        });
    });
}

async function getSummaryDirectlyFromGPT(bodyJSON, apiKey) {
    let assistantInstance = await getAssistant();
    bodyJSON.gptBody.messages[0].content = assistantInstance.getSystemPrompt();

    const response = await fetch(GPT_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyJSON.gptBody),
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`OpenAI API returned an error: ${response.status} ${response.statusText}. Details: ${errorDetails}`);
    }

    const apiResponse = await response.json();
    bodyJSON.gptBody.messages.push(apiResponse.choices[0].message);
    
    const messageText = apiResponse.choices[0].message.content.trim();
    return messageText.replace(/\n/g, "<br>");
}

async function getSummaryFromBackend(bodyJSON) {
    // Fetch user information
    let userToken = await getUserToken();

    // Add the userId to the metadata of bodyJSON
    if (!userToken) {
        throw new Error('User information not found in storage; cannot make request to backend.');
    }
    
    let assistantInstance = await getAssistant();
    bodyJSON.gptBody.messages[0].content = assistantInstance.getSystemPrompt();
    bodyJSON.metadata.token = userToken;

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
