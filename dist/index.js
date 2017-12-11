var express = require('express');
const path = require('path');
var app = express();

app.use(express.static(__dirname));

app.get('/', function(req, res) {
  res.sendfile(path.resolve(__dirname, "index.html"));
});

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});

if (module.hot) {
 module.hot.accept('./server', () => {
  server.removeListener('request', currentApp)
  server.on('request', app)
  currentApp = app
 })
};
