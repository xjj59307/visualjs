import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web
 
class WSHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        print 'new connection'
      
    def on_message(self, message):
        print 'message received'
        msgSize = len(message.decode("utf-8"))
        self.write_message('receive %s bytes message' % msgSize)
 
    def on_close(self):
      print 'connection closed'
 
application = tornado.web.Application([
    (r'/ws', WSHandler),
])
 
if __name__ == "__main__":
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(8888)
    tornado.ioloop.IOLoop.instance().start()