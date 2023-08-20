export function getMatchesPatterns() {
    var manifest = chrome.runtime.getManifest();
    var contentScripts = manifest.content_scripts || [];
    var allMatches = [];

    contentScripts.forEach(function(contentScript) {
        if (contentScript.matches) {
            allMatches = allMatches.concat(contentScript.matches);
        }
    });

    return allMatches;
}

export function isUrlRelevant(url, patterns) {
    return patterns.some(pattern => {
        var regexPattern = pattern.replace('*://', 'https://|http://').replace('*', '.*');
        var regex = new RegExp(regexPattern);
        return regex.test(url);
    });
}

function toggleElementsVisibility(elements, display) {
    elements.forEach(el => {
        document.getElementById(el).style.display = display;
    });
}

export function setVisibilityState(state) {
    // First, we hide all elements by default
    let elements = [
        'summarize-text',
        'summarize-text-date',
        'scrollable-section',
        'summarize-button',
        'details-input',
        'regenerate-button',
        'login-section',
        'main-section'
    ];

    toggleElementsVisibility(elements, 'none');
    document.getElementById('details-input').disabled = false;

    // if state = 0, show only login-section; else, show main-section
    if (state === 0) {
        toggleElementsVisibility(['login-section'], 'block');
    } else {
        toggleElementsVisibility(['main-section'], 'block');
    }

    console.log('Setting visibility state to ' + state);

    // Then, based on the state, we show the appropriate elements inside of main section
    switch(state) {
        case 0:
            break;
        case 1:
            toggleElementsVisibility(['summarize-button'], 'block');
            break;
        case 2:
            toggleElementsVisibility(['summarize-text', 'scrollable-section'], 'block');
            break;
        case 3:
            toggleElementsVisibility(['summarize-text-date', 'scrollable-section', 'details-input', 'regenerate-button'], 'block');
            break;
        case 4:
            toggleElementsVisibility(['summarize-text', 'scrollable-section', 'details-input', 'regenerate-button'], 'block');
            document.getElementById('details-input').disabled = true;
            break;
        default:
            console.log('Invalid state');
            break;
    }
}

export function handleTextDirection(summaryText, textElement) {
    if (/[\u0590-\u05FF\u0600-\u06FF]/.test(summaryText[0])) {
        document.getElementById(textElement).style.direction = 'rtl';
    }
}