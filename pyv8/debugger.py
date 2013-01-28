from pyv8 import PyV8

class Global(PyV8.JSClass):
	def hello(self):
		print "Hello World"

context = PyV8.JSContext(Global())
context.enter()
context.eval("hello()")

engine = PyV8.JSEngine()
file = open("source.js", "r").read()
script = engine.compile(file)
print script.run()
	
		