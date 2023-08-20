const CLIENT_ID = '941303876227-gh6j2ddi77tql5n0hr12dum9v8b40had.apps.googleusercontent.com';
const EXTENSION_ID = 'iglmbhepoiigniimpiljkfalgpcbjhjh';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'login') {
        const authURL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=https%3A%2F%2F${EXTENSION_ID}.chromiumapp.org%2F&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20profile`;

        chrome.identity.launchWebAuthFlow({
            'url': authURL,
            'interactive': true
        }, function(redirectURL) {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError });
                return;
            }

            // Extract the token from the redirect URL
            const userToken = redirectURL.split('#access_token=')[1].split('&')[0];
            
            // Now, use this token to get the user's info
            const userInfoURL = 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + userToken;

            fetch(userInfoURL)
                .then(response => response.json())
                .then(userInfo => {

                    const expiresIn = Number(redirectURL.split('expires_in=')[1].split('&')[0]); // get the expires_in value
                    const expirationTime = new Date().getTime() + expiresIn * 1000; // Convert to milliseconds and add to current time
                    
                    // Store user information for later use
                    chrome.storage.local.set({ userInfo: userInfo, userToken: userToken, expirationTime: expirationTime }, function() {
                        sendResponse({ status: "User info & token fetched and stored.", userInfo: userInfo });
                    });
                })
                .catch(error => {
                    console.error('Error fetching user info:', error);
                    sendResponse({ error: "Failed to fetch user info." });
                });
        });

        return true; // Indicates this is an asynchronous response.
    }
});
