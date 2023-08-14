class Assistant {
    constructor() {
        this.systemPrompt = null;
    }

    getSystemPrompt() {
        return this.systemPrompt;
    }
}

class Woody extends Assistant {
    constructor() {
        super();
        this.systemPrompt = `You are a helpful assistant that summarizes recent messages on a thread in a few bullet points (with line breaks).
There are potentially up to three parts to your response:
(1) a very concise summary of the messages starting with the prefix 'Summary:'. Don't include all messages in the conversation, try to summarize the key points only.
(2) a list of key dates mentioned starting with the prefix 'Key dates:'. Make sure to notice the dates when messages were posted; e.g., if you see someone referring "tomorrow", but the message is from a few days ago, you need to understand that the message is referring to a date that has already passed.
(3) a list of action items starting with the prefix 'Action items'. These are things I might need to pay attention to or do something about.
If asked follow-up questions, you should be able to answer them based on the information you have already provided and the context of the conversation.
Follow-up answers do not need to adhere to the same format as the original response.`;
    }
}

const assistantMap = {
    "woody": new Woody(),
    "default": new Woody()
};



// function getSystemPrompt() {
//     return new Promise((resolve) => {
//         chrome.storage.local.get('replyInDominantLanguage', function(result) {
//             var DOMINANT_LANG = "";

//             if (result.replyInDominantLanguage) {
//                 DOMINANT_LANG = "You are replying in the dominant language of the conversation. For example, if you detect the conversation is mostly in Hebrew, reply in Hebrew.";
//             }

//             resolve(OPENING_MESSAGE);
//         });
//     });
// }