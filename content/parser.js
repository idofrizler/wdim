TOKEN_LIMIT_WITH_BUFFER = 3500;

function parseHTMLRows(rowElements, tokenLimit = TOKEN_LIMIT_WITH_BUFFER) {
    let messageText = "";
    let msgIndex = 0;

    // enumerate all messages in rowElements with index i
    while (msgIndex < rowElements.length && messageText.split(" ").length <= tokenLimit) {
        const message = rowElements[msgIndex];

        const copyableText = message.querySelector('div.copyable-text');
        if (copyableText) {
            const prePlainText = copyableText.getAttribute('data-pre-plain-text');
            const imageCaption = message.querySelector('span[data-testid="image-caption"]');
            if (imageCaption) { // Image + caption message
                const caption = imageCaption.querySelector('span').textContent;
                messageText += prePlainText.slice(0, -2) + " shared a photo with this caption: " + caption + "<br>";
            } else { // Regular text message, possibly with link
                const span = copyableText.querySelector('span');
                if (span) {
                    const hasLink = span.getAttribute('data-testid') === 'link-preview-title' ? true : false;
                    if (hasLink) {
                        messageText += prePlainText.slice(0, -2) + " shared a link: " + span.textContent + "<br>";
                    } else {
                        // get span of class quoted-mention inside message
                        const quotedDiv = copyableText.querySelector('div[data-testid="quoted-message"]');
                        if (quotedDiv) {
                            const authorSpan = quotedDiv.querySelector('span[data-testid="author"]');
                            const quotedSpan = quotedDiv.querySelector('span.quoted-mention');
                            const quotedMentionText = quotedSpan.textContent;

                            // if authorSpan, get its textContent; else, simply write "Your"
                            const authorText = authorSpan ? authorSpan.textContent + "'s" : "your";

                            const replySpan = copyableText.querySelector('span.selectable-text.copyable-text');
                            const replyText = replySpan.textContent;

                            messageText += prePlainText.slice(0, -2) + " replied \"" + replyText + "\" to " + authorText + " message \"" + quotedMentionText + "\"<br>";    
                        } else {
                            messageText += prePlainText + span.textContent + "<br>";
                        }
                    }
                } else {
                    console.log(`Error: span not found at index ${msgIndex}`);
                }
            }
        } else { // Image message
            const imageThumb = message.querySelector('div[data-testid="image-thumb"]');
            if (imageThumb) {
                const author = message.querySelector('span[data-testid="author"]');
                const timeStr = message.querySelector('div[data-testid="msg-meta"]').querySelector('span').textContent;
                if (author) {
                    const authorButton = message.querySelector('span[testid="author"]');
                    if (authorButton) {
                        const ariaLabel = author.getAttribute('aria-label');
                        messageText += "[" + timeStr + "] " + authorButton.textContent + " (" + ariaLabel + ")" + " shared a photo<br>";
                    } else {
                        // get text content from author
                        const authorText = author.textContent;
                        messageText += "[" + timeStr + "] " + authorText + " shared a photo<br>";
                    }
                }
            } else {
                console.log(`Error: message type not idenfitied at index ${msgIndex}`);        
            }
        }

        // TODO: support voice messages

        msgIndex++;
    }

    return {messageCount: msgIndex, messageText: messageText};
}

function calcTimePassed(messageText) {
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
    return `${daysPassed} days and ${hoursPassed} hours ago`;
}

try {
    module.exports = {
        parseHTMLRows: parseHTMLRows,
        calcTimePassed: calcTimePassed
    }
}
catch (e) {}