const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log("Connected")
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
  
    ws.send('something');
  });

exports.startServer = function () {
    if(wss == undefined){
        console.log("Simulating WS Server at port 8080")

        
    }
}

