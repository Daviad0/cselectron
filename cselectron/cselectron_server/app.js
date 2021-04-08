const express = require('express')
const app = express();

let jsonSchemaTest = ""
let noteSchemaTest = ""

let serverState = undefined;

class TheaterState {
  constructor(initDate, active, logging, musicStage){
    this.initDate = initDate
    this.active = active
    this.logging = logging
    this.musicStage = musicStage
  }
}

serverState = new TheaterState(new Date(), true, true, "Pre-Show")

const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs')
const path = require('path')

fs.readFile('./storage/schema/testSchema.json', 'utf-8', (err, jsonString) => {
  jsonSchemaTest = jsonString;
});

fs.readFile('./storage/schema/testNoteSchema.json', 'utf-8', (err, jsonString) => {
  noteSchemaTest = jsonString;
});

app.use(express.static(path.join(__dirname, 'storage')))

const audioFolder = "./storage/audio/"

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

let roles = [new Role("controller_music", "Music Controller", 1, false), new Role("crew_backstage", "Backstage Progress Viewer", -1, false), new Role("controller_schema", "Schema Designer", 1, true), new Role("director", "Director", 1, true)]

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  if(instances.filter(el => el.socketId == socket.id).length <= 0){
    instances.push(new Instance(socket.id, new Date(), null))
  }
  console.log('a user connected');
  socket.on('requestRoles', (loginRequest) => {
    socket.emit('rolesSent',roles)
  });
  socket.on('loginWithRole', (roleIdentifier) => {
    console.log(socket.id + " logged in with role " + roleIdentifier)
    instances.filter(el => el.socketId == socket.id)[0].role = roles.filter(el => el.identifier == roleIdentifier)[0]
  });
  socket.on('getNoteList', (loginRequest) => {
    socket.emit('notesSent',JSON.parse(noteSchemaTest));
  });
  socket.on('getAudioList', (loginRequest) => {
    var songList = JSON.parse(jsonSchemaTest);
    fs.readdir(audioFolder, (err, files) => {
      console.log("Audio files requested by client")
      socket.emit('recAudioList',songList)
    });
    
  });
  socket.on('songUpdate', (to, outOf, paused, name, subtitle) => {
    console.log("Current Song" + (paused ? " (PAUSED)" : "") + ": " + name + " (" + subtitle + ") >>> " + Math.round((to/outOf)*100))
    socket.broadcast.emit("songUpdate", to, outOf, paused, name, subtitle);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});


module.exports = app;
