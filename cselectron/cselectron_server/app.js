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

function resetShowSchema(){
  fs.readFile('./storage/schema/testSchema.json', 'utf-8', (err, jsonString) => {
    jsonSchemaTest = jsonString;
  });
}

function resetNoteSchema(){
  fs.readFile('./storage/schema/testNoteSchema.json', 'utf-8', (err, jsonString) => {
    noteSchemaTest = jsonString;
  });
} 
resetNoteSchema()
resetShowSchema()


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
  constructor(socketId, lastRequest, role, deviceId, name){
    this.socketId = socketId
    this.lastRequest = lastRequest
    this.role = role
    this.deviceId = deviceId
    this.name = name
  }
}

let savedDevices = {};

let instances = [];

let roles = [new Role("controller_music", "Music Controller", 1, false), new Role("crew_backstage", "Backstage Progress Viewer", -1, false), new Role("controller_schema", "Schema Designer", 1, true), new Role("director", "Director", 1, true)]

var unresponsiveSockets = []
var respondedSockets = []
// this will run every 5-10 seconds to check to make sure that everything is still connected!
function pingInstances(){
  // ping with TARGETED = FALSE & reinit respondedSockets
  respondedSockets = []
  io.emit('PING', false)
  setTimeout(function(){
    instances.forEach(inso => {
      var ins = inso.socketId
      // 3 warning system for unresponsiveness
      if(respondedSockets.filter(soc => soc == ins).length == 0){
        console.log("Failed to connect to " + ins)
        if(unresponsiveSockets.filter(unsoc => unsoc['id'] == ins).length > 0){
          unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] = unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] + 1
          if(unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] + 1 > 3){
            // disconnect event
            unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] = 0
            instances.pop(instances.indexOf(instances.filter(el => el == ins)[0]))
            console.log("Removed " + ins + " from the system")
          }
        }else{
          unresponsiveSockets.push({ 'id' : ins, 'times' : 1})
        }
      }else{
        try{
          unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0].times = 0
        }catch(err){

        }
      }
    });
  }, 3000);
}

setInterval(pingInstances, 10000)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/songupload', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  // I need to sort by role so that I can use socket.off() in the client side in order to improve security/performance
  if(instances.filter(el => el.socketId == socket.id).length <= 0){
    instances.push(new Instance(socket.id, new Date(), null))
  }

  socket.on("PONG", () => {
    respondedSockets.push(socket.id)
  });

  socket.emit('requestDeviceInfo', ["deviceId"])
  socket.on('receiveDeviceInfo', (informationes) => {
    if(informationes['deviceId'] != undefined){
      instances.filter(el => el.socketId == socket.id)[0].deviceId = informationes['deviceId']
      console.log(socket.id + " identified with " + informationes['deviceId'])
    }
  });
  console.log('a user connected');
  socket.on('requestRoles', (loginRequest) => {
    if(savedDevices[instances.filter(el => el.socketId == socket.id)[0].deviceId] !== undefined){
      // There is already an instance of this device in the saved database, so it will pass down the preivous login information
      instances.filter(el => el.socketId == socket.id)[0].name = savedDevices[instances.filter(el => el.socketId == socket.id)[0].deviceId].name
      socket.emit('rolesSent',roles, {'name' : savedDevices[instances.filter(el => el.socketId == socket.id)[0].deviceId].name, 'role' : savedDevices[instances.filter(el => el.socketId == socket.id)[0].deviceId].role})
    }
    socket.emit('rolesSent',roles)
  });
  socket.on('loginWithRole', (roleIdentifier) => {
    console.log(socket.id + " logged in with role " + roleIdentifier)
    instances.filter(el => el.socketId == socket.id)[0].role = roles.filter(el => el.identifier == roleIdentifier)[0]
  });
  socket.on('getNoteList', (loginRequest) => {
    socket.emit('notesSent',JSON.parse(noteSchemaTest));
  });
  socket.on('getInstanceList', (loginRequest) => {
    var allUsers = instances
    socket.emit('instancesSent',JSON.stringify(allUsers), socket.id);
  });
  socket.on('getAudioList', (loginRequest) => {
    fs.readFile('./storage/schema/testSchema.json', 'utf-8', (err, jsonString) => {
      var songList = JSON.parse(jsonString);
      console.log("Audio files requested by client")
      songList["tracks"] = songList["tracks"].filter(el => el["visible"] == true || instances.filter(el => el.socketId == socket.id)[0].role.elevated == true)
      console.log("Filtered Song List: " + songList["tracks"])
      socket.emit('recAudioList',songList)
    });
    
  });
  socket.on('saveSchema', (typeOf, rawJson) => {
    console.log(typeOf + " " + rawJson);
    if(typeOf == "show") { 
      fs.writeFile('./storage/schema/testSchema.json', rawJson, function(err){
        console.log(err)
      }); 
    }
    
  });
  socket.on('getSystemAudioList', (loginRequest) => {
    fs.readdir(audioFolder, (err, files) => {
      console.log("Server audio files requested by client")
      socket.emit('recSystemAudioList',files)
    });
    
  });
  
  socket.on('songUpdate', (to, outOf, paused, name, subtitle) => {
    //console.log("Current Song" + (paused ? " (PAUSED)" : "") + ": " + name + " (" + subtitle + ") >>> " + Math.round((to/outOf)*100))
    socket.broadcast.emit("songUpdate", to, outOf, paused, name, subtitle);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});


module.exports = app;
