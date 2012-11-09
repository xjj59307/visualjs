$(document).ready(function(){
    var console = $('<div class="console">');
    $('body').append(console);
    var controller1 = console.console({
        promptLabel: 'debug> ',
        commandValidate:function(line){
            if (line == "") return false;
            else return true;
        },
        commandHandle:function(line){
            try {
                var ret = eval(line);
                if (typeof ret != 'undefined') return ret.toString();
                else return true;
            }
            catch (e) { return e.toString(); }
        },
        autofocus:true,
        animateScroll:true,
        promptHistory:true,
    });
});

var eval = function(expr) {
    var tabId = debuggeeId.tabId;

    chrome.debugger.sendCommand(
        tabId,
        "Runtime.evaluate",
        { expression: expr },
        function(response) {
            alert(response.result);                    
        }
    );
}
