const express = require('express')
const app = express();

// stores current schema for both the notes & songs
let jsonSchemaTest = ""
let noteSchemaTest = ""

// defines the current state of the theater (the server) and is able to be changed throughout
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

// function to actively reset the song schema whenever it is requested to be changed
function resetShowSchema(){
  fs.readFile('./storage/schema/testSchema.json', 'utf-8', (err, jsonString) => {
    jsonSchemaTest = jsonString;
  });
}

// function to actively reset the note schema whenever it is requested to be changed
function resetNoteSchema(){
  fs.readFile('./storage/schema/testNoteSchema.json', 'utf-8', (err, jsonString) => {
    noteSchemaTest = JSON.parse(jsonString);
  });
} 
function pushNoteSchema(){
  fs.writeFile('./storage/schema/testNoteSchema.json', JSON.stringify(noteSchemaTest), function(err){

  }); 
}
// initialize the schemas at the start of the program so clients are able to receive the value
resetNoteSchema()
resetShowSchema()

// for webserver, allow connections to reach the storage area for audio & schema
app.use(express.static(path.join(__dirname, 'storage')))

// define where songs are stored server side
const audioFolder = "./storage/audio/"

// UNUSED: note obj to take notes during a show
class Note {
  constructor(position, content, isDirector){
    this.position = position;
    this.content = content;
    this.isDirector = isDirector;
  }
}

// role obj to define all of the roles and their permissions. is passed down to clients at beginning of runtime
class Role {
  constructor(identifier, prettyName, max, elevated){
    this.identifier = identifier
    this.prettyName = prettyName
    this.max = max
    this.elevated = elevated
  }
}

// instance obj to store all of the client instances. references to role obj. is frequently changed & tracked, and can have CRUD actions
class Instance {
  constructor(socketId, lastRequest, role, deviceId, name, unresponsive, ready){
    this.socketId = socketId
    this.lastRequest = lastRequest
    this.role = role
    this.deviceId = deviceId
    this.name = name
    this.unresponsive = unresponsive;
    this.ready = ready;
  }
}

// UNUSED: saved instances using the UUID of the device that is passed up (like a token system)
let savedDevices = {};

// array to store all of the instances (a dynamic amount which cannot be done using individual vars)
let instances = [];

// array to initialize an unchanging list of roles that are available throughout the runtime of the theater
let roles = [new Role("controller_music", "Music Controller", 1, false), new Role("crew_backstage", "Backstage Progress Viewer", -1, false), new Role("controller_schema", "Schema Designer", 1, true), new Role("director", "Director", 1, true)]

// variables to track un/responsive instances while doing a PING/PONG request every 7 seconds
var unresponsiveSockets = []
var respondedSockets = []
// this will run every 5-10 seconds to check to make sure that everything is still connected!
function pingInstances(){
  // ping with TARGETED = FALSE & reinit respondedSockets
  respondedSockets = []
  io.emit('PING', false)
  setTimeout(function(){
    // lists initialized to track each and every change made in the ping function for the DIRECTOR
    var updatedInstances = []
    var deletedInstances = []
    instances.forEach(inso => {
      var ins = inso.socketId
      // 3 warning system for unresponsiveness
      if(respondedSockets.filter(soc => soc == ins).length == 0){
        console.log("Failed to connect to " + ins)
        if(unresponsiveSockets.filter(unsoc => unsoc['id'] == ins).length > 0){
          // start (or continue) tracking # of times instance fails to connect
          unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] = unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] + 1
          // after 3 consec. warnings, disconnect the instance entirely
          if(unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] + 1 > 3){
            // disconnect event
            unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0]['times'] = 0
            // pushes note of deletion to push to DIRECTOR role view (as in, remove it from the view)
            var del = instances.splice(instances.indexOf(instances.filter(el => el.socketId == ins)[0]), 1)
            deletedInstances.push(del[0])
            console.log("Removed " + ins + " from the system")
            
          }
        }else{
          // this block means this was the first time that it had disconnected
          unresponsiveSockets.push({ 'id' : ins, 'times' : 1})
          instances.filter(el => el.socketId == ins)[0].unresponsive = true 
          // takes note of disconnect for DIRECTOR
          updatedInstances.push(instances.filter(el => el.socketId == ins)[0])
        }
      }else{
        try{
          // this block means that it responded to the PING and should be at 0 warnings
          unresponsiveSockets.filter(unsoc => unsoc['id'] == ins)[0].times = 0
          instances.filter(el => el.socketId == ins)[0].unresponsive = false
          // takes note of lack of disconnect (if it is changed from x to 0 times disconnected) for DIRECTOR
          updatedInstances.push(instances.filter(el => el.socketId == ins)[0])
        }catch(err){
          // nothing bad happened here, it just meant that the socket was never in unresponsiveSockets in the first place, so times cannot be set.
        }
      }
    });

    changesArray = []
    updatedInstances.forEach(updIns => {
      changesArray.push({ change: "update", data: updIns })
    });
    deletedInstances.forEach(delIns => {
      changesArray.push({ change: "delete", data: delIns })
    });
    // UPDATE DIRECTOR PAGE
    instances.filter(el => el.role != undefined && el.role.identifier == "director").forEach(dirIns => {
      io.to(dirIns.socketId).emit("instancesUpdate", JSON.stringify(changesArray), dirIns.socketId);
    });

  }, 3000);
}

setInterval(pingInstances, 7000)

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
    if(instances.filter(el => el.socketId == socket.id)[0].unresponsive){
      // LET THE DIRECTOR KNOW THAT IT ISN'T UNRESPONSIVE
      instances.filter(el => el.socketId == socket.id)[0].unresponsive = false
      
      
    }
    
  });
  socket.on("readyStatus", (isReady) => {
    instances.filter(el => el.socketId == socket.id)[0].ready = isReady
    instances.filter(el => el.role != undefined && el.role.identifier == "director").forEach(dirIns => {
      io.to(dirIns.socketId).emit("instancesUpdate", JSON.stringify([{change: 'update', data: instances.filter(el => el.socketId == socket.id)[0]}]), dirIns.socketId);
    });
  });


  socket.on("noteChange", (change, data, role) => {
    // uh oh multi threading??
    data = JSON.parse(data)
    if(change == 'delete'){
      noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0].splice(noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0]["notes"].indexOf(noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0]["notes"].filter(elp => elp["id"] == data["id"])[0]))
    }else if(change == 'update'){
      noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0].indexOf(noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0]["notes"].filter(elp => elp["id"] == data["id"])[0]) = data
    }else if(change == 'create'){
      console.log(noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0])
      noteSchemaTest["noteRoleGroups"].filter(el => el["roleId"] == role)[0]["notes"].push(data)
    }
    console.log(noteSchemaTest)
    pushNoteSchema();
  });
  socket.emit('requestDeviceInfo', ["deviceId"])
  socket.on('receiveDeviceInfo', (informationes) => {
    if(informationes['deviceId'] != undefined){
      instances.filter(el => el.socketId == socket.id)[0].deviceId = informationes['deviceId']
      console.log(socket.id + " identified with " + informationes['deviceId'])
      instances.filter(el => el.role != undefined && el.role.identifier == "director").forEach(dirIns => {
        io.to(dirIns.socketId).emit("instancesUpdate", JSON.stringify([{change: 'create', data: instances.filter(el => el.socketId == socket.id)[0]}]), dirIns.socketId);
      });
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
    instances.filter(el => el.role != undefined && el.role.identifier == "director").forEach(dirIns => {
      io.to(dirIns.socketId).emit("instancesUpdate", JSON.stringify([{change: 'update', data: instances.filter(el => el.socketId == socket.id)[0]}]), dirIns.socketId);
    });
  });
  socket.on('getNoteList', (loginRequest) => {
    socket.emit('notesSent',noteSchemaTest);
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
        resetShowSchema();
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
