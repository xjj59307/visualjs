from pyv8 import _PyV8
import json

sep = 0

def processDebugEvent(type, event):
	print "receive debug event %s %s" % repr(type), repr(event)

def processDebugMessage(msg):
	print repr(msg)
	# ctnReq = json.dumps({
	# 	"sep": ++sep,
	# 	"type": "request",
	# 	"command": "continue"
	# })
	# _PyV8.debug().sendCommand(ctnReq)

_PyV8.debug().enabled = True
_PyV8.debug().context.enter()
file = open("source.js", "r").read()
script = _PyV8.JSEngine().compile(file, "source")
# script.run()

_PyV8.debug().onDebugMessage = processDebugMessage
# _PyV8.debug().onDebugEvent = processDebugEvent

brkReq = json.dumps({
	"sep": ++sep,
	"type": "request",
	"command": "setbreakpoint",
	"arguments": { "type": "script", "target": "source", "line": 1 }
})
_PyV8.debug().sendCommand(brkReq)
script.run()

evalReq = json.dumps({
	"sep": ++sep,
	"type": "request",
	"command": "continue"
	# "arguments": { "expression": "1+2" }
})
_PyV8.debug().sendCommand(evalReq)
_PyV8.debug().enabled = False
