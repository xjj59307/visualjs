var Environment = function(environment, visualObject, evaluate, callback) {
  var self = this;
  this.nodeTable = {};
  this.variableTable = {};

  async.each(_.pairs(environment), function(pair, _callback) {
    var name = pair[0];
    var valueStr = pair[1];

    if (visualObject.isNode(name)) {
      self.nodeTable[name] = visualObject.getNode(name);
      _callback();
    }
    else {
      evaluate(valueStr, function(err, value) {
        self.variableTable[name] = value; 
        _callback(err);
      });
    }
  }, function(err) { callback(); });
};

Environment.prototype.getValue = function(name) {
  return this.variableTable[name];
};

Environment.prototype.getNode = function(name) {
  return this.nodeTable[name];
};

module.exports = Environment;
