var httpServer = require('http-server');

var port = process.env['PORT'] || 8080;

var server = httpServer.createServer({
  root: __dirname + '/../',
  cache: 10,
  showDir: true,
  autoIndex: true
});

server.listen(port, '127.0.0.1', function() {
  console.log('Server started on %d', port);
});
