function parseHTMLRow(rowElements) {
    const maxMessages = 50;
    let startIndex = Math.max(0, rowElements.length - maxMessages);
    let messageText = "";
    let messageCount = 0;
    for (let i = startIndex; i < rowElements.length; i++) {
        const message = rowElements[i];
        messageCount++;

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
                        messageText += prePlainText + span.textContent + "<br>";
                    }
                } else {
                    console.log(`Error: span not found at index ${i}`);
                }
            }
        } else { // Image message
            const imageThumb = message.querySelector('div[data-testid="image-thumb"]');
            if (imageThumb) {
    
            } else {
                
            }
    
        }
    }

    return {messageCount: messageCount, messageText: messageText};
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

module.exports = {
    parseHTMLRow: parseHTMLRow,
    calcTimePassed: calcTimePassed
};