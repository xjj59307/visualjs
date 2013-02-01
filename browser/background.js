(function() {
    var version = "1.0";

    chrome.browserAction.onClicked.addListener(function() {
        chrome.tabs.query({'active': true}, actionClicked);
    });

    function actionClicked(tabs) {
        var tabId = tabs[0].id;
        var debuggee = {tabId: tabId};

        chrome.debugger.attach(debuggee, version, onAttach.bind(null, tabId));
    }

    function onAttach(tabId) {
        if (chrome.extension.lastError) {
            alert(chrome.extension.lastError.message);
            return;
        }

        chrome.windows.create(
            { url: "console.html?" + tabId, type: "normal", width: 1024, height: 980 }
        );
    }
})();
