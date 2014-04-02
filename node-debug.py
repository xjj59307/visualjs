import subprocess
import time

subprocess.Popen('node --debug=5858 app', shell=True)
time.sleep(1)
subprocess.Popen(['osascript node-debug.scpt'], shell=True)
