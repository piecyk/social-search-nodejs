var app = require('./app');
var debug = require('debug')('drwal:server');
var http = require('http');
var socketIo = require('socket.io');
var utils = require('./utils');

var port = utils.normalizePort(process.env.PORT || '3001');
app.set('port', port);
var server = http.createServer(app);



// TODO: move this
// socket
var io = socketIo.listen(server);

io.on('connection', function (socket) {
  console.log('socket connected');

  socket.on('drwal', function (from, msg) {
    console.log('recieved message from', from, 'msg', JSON.stringify(msg));
    console.log('broadcasting message payload is', msg);

    io.sockets.emit('broadcast', {
      payload: msg,
      source: from
    });
    console.log('broadcast complete');
  });

  socket.on('disconnect', function(){
    console.log('disconnected ;/');
  });

});


server.listen(port);
server.on('error', function(error) {
  console.log('error on = ' + error);
});
server.on('listening', function() {
  console.log('Listening on = ' + port);
});
