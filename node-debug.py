import subprocess
import time

run = subprocess.Popen('node --debug=5858 app', shell=True)
time.sleep(1)
reload = subprocess.Popen(['osascript node-debug.scpt'], shell=True)

run.wait()
reload.wait()
