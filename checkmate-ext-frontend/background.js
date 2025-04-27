chrome.runtime.onInstalled.addListener(() => {
    clearCachedTokens();
});

function clearCachedTokens() {
    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
        if (token) {
            console.log("Found cached token, removing it...");
            chrome.identity.removeCachedAuthToken({ 'token': token }, function() {
                console.log("Token removal completed");
            });
        } else {
            console.log("No cached token found");
        }
    });
}