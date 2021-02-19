const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

class Note {
  constructor(position, content, isDirector){
    this.position = position;
    this.content = content;
    this.isDirector = isDirector;
  }
}

class Role {
  constructor(identifier, prettyName, max, elevated){
    this.identifier = identifier
    this.prettyName = prettyName
    this.max = max
    this.elevated = elevated
  }
}

class Instance {
  constructor(socketId, lastRequest, role){
    this.socketId = socketId
    this.lastRequest = lastRequest
    this.role = role
  }
}

let instances = [];

let roles = [new Role("admin_director", "Director", 1, true), new Role("crew_spotlight-left", "Left Spotlight", -1, true), new Role("crew_spotlight-right", "Right Spotlight", -1, true)]

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  if(instances.filter(el => el.socketId == socket.id).length <= 0){
    instances.push(new Instance(socket.id, new Date(), roles.filter(el => el.identifier == "admin_director")[0]))
    console.log("Full instance list: \n\n" + JSON.stringify(instances))
  }
  console.log('a user connected');
  socket.on('requestRoles', (loginRequest) => {
    socket.emit('rolesSent',roles)
  });
  socket.on('songUpdate', (to, outOf, paused, name, subtitle) => {
    console.log("Current Song" + (paused ? " (PAUSED)" : "") + ": " + name + " (" + subtitle + ") >>> " + Math.round((to/outOf)*100))
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});


module.exports = app;
