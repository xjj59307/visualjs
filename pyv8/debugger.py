from pyv8 import _PyV8
import json

def processDebugEvent(event):
	print "receive debug event %s" % repr(event)

def processDebugMessage(msg):
	print repr(msg)

_PyV8.debug().enabled = True
_PyV8.debug().context.enter()
file = open("source.js", "r").read()
script = _PyV8.JSEngine().compile(file)
script.run()

_PyV8.debug().onDebugMessage = processDebugMessage
_PyV8.debug().onDebugEvent = processDebugEvent
request = json.dumps({
	"sep": 0,
	"type": "request",
	"command": "evaluate",
	"arguments": { "expression": "1+2", "global": True }
})
_PyV8.debug().sendCommand(request)
_PyV8.debug().enabled = False
