TOKEN_LIMIT_WITH_BUFFER = 4000;

function tokenEstimator(messageText) {
    // const tokenCount = messageText.split(/[\s\n-]+/).length;
    const tokenCount = messageText.length;
    return tokenCount;
}

// Helper functions
function getFromElement(element, attr = null) {
    if (!element) return null;
    if (attr) return element.getAttribute(attr);
    return element.textContent;
}

function getTimestampAuthorText(message) {
    const timeStr = getFromElement(message.querySelector('div[data-testid="msg-meta"] span'));
    const author = message.querySelector('span[data-testid="author"]');
    let authorText;

    if (author) {
        authorText = getFromElement(author);
    } else {
        const ariaLabelSpan = message.querySelector('span[aria-label]');
        authorText = getFromElement(ariaLabelSpan, 'aria-label').slice(0, -1);
    }

    return `[${timeStr}] ${authorText}`;
}

function identifyMessageType(message) {
    if (message.querySelector('div.copyable-text')) return "copyableText";
    if (message.querySelector('div[data-testid="image-thumb"]')) return "imageThumb";
    if (message.querySelector('img') && message.querySelector('span[aria-label]')) return "sticker";
    return "unknown";
}

function parseCopyableTextMessage(message) {
    const copyableText = message.querySelector('div.copyable-text');
    const prePlainText = getFromElement(copyableText, 'data-pre-plain-text');

    const imageCaption = message.querySelector('span[data-testid="image-caption"]');
    if (imageCaption) {
        const caption = getFromElement(imageCaption.querySelector('span'));
        return prePlainText.slice(0, -2) + " shared a photo with this caption: " + caption + "\n";
    }

    const span = copyableText.querySelector('span');
    if (span && span.getAttribute('data-testid') === 'link-preview-title') {
        return prePlainText.slice(0, -2) + " shared a link: " + span.textContent + "\n";
    }

    const quotedDiv = copyableText.querySelector('div[data-testid="quoted-message"]');
    if (quotedDiv) {
        const quotedSpan = quotedDiv.querySelector('span.quoted-mention');
        const authorSpan = quotedDiv.querySelector('span[data-testid="author"]');
        if (quotedSpan) {
            const quotedMentionText = quotedSpan.textContent;
            const authorText = authorSpan ? authorSpan.textContent + "'s" : "your";
            const replySpan = copyableText.querySelector('span.selectable-text.copyable-text');
            const replyImage = copyableText.querySelector('img.selectable-text.copyable-text');
            const replyText = replySpan ? replySpan.textContent : getFromElement(replyImage, 'alt');
            return prePlainText.slice(0, -2) + " replied \"" + replyText + "\" to " + authorText + " message \"" + quotedMentionText + "\"\n";
        }
    }

    return prePlainText + span.textContent + "\n";
}

function parseImageThumbMessage(message) {
    return `${getTimestampAuthorText(message)} shared a photo\n`;
}

function parseStickerMessage(message) {
    return `${getTimestampAuthorText(message)} shared a sticker\n`;
}

function parseHTMLRows(rowElements, tokenLimit = TOKEN_LIMIT_WITH_BUFFER) {
    let messageText = "";
    let msgIndex = 0;

    while (msgIndex < rowElements.length && tokenEstimator(messageText) <= tokenLimit) {
        const message = rowElements[msgIndex];

        switch (identifyMessageType(message)) {
            case "copyableText":
                messageText += parseCopyableTextMessage(message);
                break;
            case "imageThumb":
                messageText += parseImageThumbMessage(message);
                break;
            case "sticker":
                messageText += parseStickerMessage(message);
                break;
            default:
                console.log(`Error: message type not identified at index ${msgIndex}`);
        }

        // TODO: support voice messages

        msgIndex++;
    }

    return {messageCount: msgIndex, messageText: messageText};
}

function calcTimePassed(messageText) {
    // split messageText by <br> and take first item
    const firstMessage = messageText.split("\n")[0];

    // split firstMessage by ] and take first item, including the ]
    const firstMessagePrefix = firstMessage.split("]")[0] + "]";

    // Extract the date using Regex from the first message, which looks like this: [22:46, 21/07/2023]
    const dateRegex = /\[(\d{2}):(\d{2}), (\d{2})\/(\d{2})\/(\d{4})\]/;
    const match = firstMessagePrefix.match(dateRegex);

    // if no matches, return null
    if (!match) {
        return null;
    }

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