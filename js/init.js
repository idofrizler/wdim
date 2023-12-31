import { setVisibilityState } from './util.js';
import { sendGroupNameMessageToBackend } from './messaging.js';

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['userInfo', 'expirationTime'], function(data) {
        const userInfo = data.userInfo;
        const expirationTime = data.expirationTime;

        if (userInfo && new Date().getTime() <= expirationTime) {
            console.log('User info found in storage:', userInfo);
            bootstrapAfterLogin(userInfo);
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
