import { setVisibilityState } from './util.js';
import { sendGroupNameMessageToBackend } from './messaging.js';

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('user', function(data) {
        const user = data.user;

        if (user) {
            console.log('User info found in storage:', user);
            bootstrapAfterLogin(user);
        } else {
            console.log('User not logged in');
            setVisibilityState(0);
        }
    });
});

export function bootstrapAfterLogin(user) {
    document.getElementById('user-name').innerHTML = user.given_name;
    chrome.storage.local.get(['remainingQuota', 'quotaDate'], function(data) {
        // get current date in UTC
        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split('T')[0];

        if (data.remainingQuota && data.quotaDate&& data.quotaDate === currentDateString) {
            document.getElementById('quota-message').innerHTML = data.remainingQuota;
        }
    });
        
    sendGroupNameMessageToBackend();
    setVisibilityState(1);
}
