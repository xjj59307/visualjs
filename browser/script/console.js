var sys = {

    callFrame: null,

    pause: function() {
        chrome.debugger.sendCommand(this.debuggee, 'Debugger.enable');
        chrome.debugger.sendCommand(this.debuggee, 'Debugger.pause');
    },

    parse: function(cmd) {
        if (cmd === 'pause') {
            this.pause();
            return 'paused';
        }
        else {
            var async_response = null;
            chrome.debugger.sendCommand(
                this.debuggee,
                'Debugger.evaluateOnCallFrame',
                {
                    callFrameId: sys.callFrame.callFrameId,
                    expression: cmd
                },
                function(response) {
                    async_response = response;
                }
            );

            var value = async_response.result.value;

            if (typeof value != 'undefined') {
                return value.toString();
            }
            else return true;
        }
    },

    createConsole: function() {
        self = this;

        $(document).ready(function() {
            var console = $('<div class="console">');
            $('body').append(console);
            var controller1 = console.console({
                promptLabel: 'debug> ',
                commandValidate: function(line) {
                    if(line === "") return false;
                    else return true;
                },
                commandHandle: function(cmd) {
                    try {
                        return self.parse(cmd);
                    }
                    catch (e) { return e.toString(); }
                },
                autofocus: true,
                animateScroll: true,
                promptHistory: true
            });
        });
    },

    initialize: function() {
        var tabId = parseInt(window.location.search.substring(1));
        this.debuggee = { tabId: tabId };

        this.createConsole();
    }

};

chrome.debugger.onEvent.addListener(function(debuggee, method, params) {
    switch (method) {
        case 'Debugger.paused':
            sys.callFrame = params.callFrames[0];
        break;
        default:
            break;
    }
});

sys.initialize();
