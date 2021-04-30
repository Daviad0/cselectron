/*
  Title: ElectronJS
  Author: OpenJS Foundation
  Date: 2/12/2021
  Code Version: 4.2.12
  Code Availaibility: https://www.electronjs.org/
  Notes: This is the library that brings the HTML page to life in a new window instead of the Chrome browser. All content that shows up inside the window is not within Electron's control, and is completely coded by this project's author
*/
const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
// Defines where to grab the already available audio files.
const audioFolder = "./public/audio/"
/*
  Title: FS (File System)
  Author: NPM Js
  Date: 2/12/2021
  Code Version: Built in w/ NodeJS
  Code Availaibility: https://nodejs.org/en/
*/
const fs = require('fs')
/*
  Title: Socket.IO (Client)
  Author: rauchg
  Date: 2/12/2021
  Code Version: 3.1.1
  Code Availaibility: https://github.com/socketio/socket.io-client
  Notes: Paired with the Socket.IO package on app.js through port 3000
*/
const io = require("socket.io-client")
/*
  Title: Request
  Author: fredkschott
  Date: 2/12/2021
  Code Version: 2.88.2
  Code Availaibility: https://www.npmjs.com/package/request
  Notes: Depreciated, but still used
*/
const request = require('request')
/*
  Title: node-machine-id
  Author: automation-stack
  Date: 2/12/2021
  Code Version: 1.1.12
  Code Availaibility: https://www.npmjs.com/package/node-machine-id
*/
const machineId = require('node-machine-id')

// init variables
let currentRole = "";
let myMachineId = "";

// At the start of the program, set the variable "machineId" to whatever the node-machine-id package identifies. For the purpose of simplicity, this does not use fingerprinting
machineId.machineId({original: true}).then((id) => {
  myMachineId = id
  console.log("Your Machine ID is " + id)
});

// socket server at port 3000 (for the purposes of the CollegeBoard demonstration, the server and client are both packaged together)
const socket = io.connect("http://localhost:3000", {reconnect: true});

socket.on("connect", function(instance){
  
})


// send back message when asked to confirm alive-ness
socket.on("PING", () => {
  socket.emit("PONG");
});

// send up all the information that is needed for the server to correctly know the client. Right now only machineId is included in this telemetry
socket.on("requestDeviceInfo", (thingsToAttach) => {
  var informationes = {}
  
  if(thingsToAttach.filter(el => el == 'deviceId').length > 0){
    informationes['deviceId'] = myMachineId
  }
  console.log(thingsToAttach)
  socket.emit('receiveDeviceInfo', informationes)
});

// pass along the currently connected clients to the director tab (no other client view has a handler for this)
socket.on('instancesSent', (rawJson, mySocketId) => {
  mainWindow.webContents.send('instancesSent', { 'rawJson' : rawJson, 'mySocketId' : mySocketId })
});

// update each client as there is a change
socket.on('instancesUpdate', (rawJson, mySocketId) => {
  mainWindow.webContents.send('instancesUpdate', { 'rawJson' : rawJson, 'mySocketId' : mySocketId })
});

// send down all of the notes to the client depending on the role that is being requested from. If the user is a director, it will send down all notes as the client is specifically built for role-based notes
socket.on('notesSent', (notes) => {
  if(notes["noteRoleGroups"].length > 0){
    if(currentRole != "director"){
      let roleNoteGroup = notes["noteRoleGroups"].filter(el => (el.roleId == currentRole) || (currentRole == "director"))[0]
      let publicNoteGroup = notes["noteRoleGroups"].filter(el => el.roleId == "public")[0]
      mainWindow.webContents.send("notesToLoad", { 'roleNotes' : (roleNoteGroup != undefined && roleNoteGroup["available"]) ? roleNoteGroup["notes"] : null, 'publicNotes' : (publicNoteGroup != undefined && publicNoteGroup["available"]) ? publicNoteGroup["notes"] : null })
    }else{
      // has to be different to track ALL roles
      console.log(notes["noteRoleGroups"])
      mainWindow.webContents.send("notesToLoad", { 'roleNotes' : notes["noteRoleGroups"]})
    }
  }else{
    // nothing in notes
    mainWindow.webContents.send("notesToLoad", { 'roleNotes' : notes["noteRoleGroups"]})
  }
  
  
});

// CONSIDER REMOVING
socket.on('songUpdateFromServer', (songName, subtitle, progress) => {
  // Handle sending to client
});

// notify the client that there was a note change either on THEIR end or another user's end (for reliability purposes, changes must be passed through the server before client is updated)
socket.on('notifyNoteChange', (change, data, role) => {
  mainWindow.webContents.send("notifyNoteChange", { 'change' : change, 'data' : data, 'role' : role })
});

// send down a rolemap that pairs ID with other important information for user viewing
socket.on('roleMap', (roles) => {
  mainWindow.webContents.send("roleMap", { 'roles' : roles })
});

// CONSIDER REMOVING
socket.on('roleRegisterAs', (roleIdentifier) => {
  // Logic to make sure that all of the required event handlers are here.
});

// if the client is built properly, it will recieve a song update that can be used to know the current position in the show
socket.on('songUpdate', (to, outOf, paused, name, subtitle) => {
  
  try{
    mainWindow.webContents.send("songUpdate", { 'songTitle' : name, 'songSubtitle' : subtitle, 'songPaused' : paused, 'songDuration' : to, 'songLength' : outOf })
  }catch(err){
    
  }
  
});

// send down to the music player what songs are availble
socket.on('recAudioList', (listOfFiles) => {

  // sending down the schema and then the songs that the client has downloaded to make it more easier
  // downloaded items should work in an array and calculated on the fly (because then we can just get rid of a lot of the beginning logic)
  fs.readdir(audioFolder, (err, files) => {
    if(listOfFiles != null){
      mainWindow.webContents.send("songsToLoad", {'songsInSystem' : files, 'songs' : listOfFiles })
    }
    
    
  });
});

// only send down the audio list from the server, not the client downloaded
socket.on('recSystemAudioList', (listOfFiles) => {
  mainWindow.webContents.send("systemSongFiles", {'songs' : listOfFiles })
});

// every request needs to include a hoststate!
// No it doesn't past author, CONSIDER REMOVING
class HostState {
  constructor(token, time, role, connected){
    this.token = token
    this.time = time
    this.role = role
    this.connected = connected
  }
}

let currentHostState = new HostState(null, null, null, false);

// simple: close the app
ipcMain.on('quitapp', (evt, arg) => {
  app.quit()
})

// send user back to login screen and send event to server stating so (stays on same instance)
ipcMain.on('logOut', (evt, arg) => {
  mainWindow.close();
  mainWindow = null;
  currentRole = "";
  letUserSelectRole()
  socket.emit("logOut");
})

// client req to get instances, event handler above
ipcMain.on('getInstanceList', (evt, arg) => {
  socket.emit('getInstanceList');
});

// saving the show schema to the server directly
ipcMain.on('saveSchema', (evt, arg) => {
  socket.emit('saveSchema', arg["typeOf"], arg["rawJson"]);
})

// login with certain role
ipcMain.on('selectRole', (evt, arg) => {
  currentRole = arg["role"]
  socket.emit('loginWithRole', arg["role"])
  console.log("Role Selected: " + arg["role"])
  createWindow(arg["role"]);
})

// communication framework
ipcMain.on('sendMainMessage', (evt, arg) => {
  console.log(arg["greeting"])
})

// send the current ready status to be reflected on the director page
ipcMain.on('readyStatus', (evt, arg) => {
  socket.emit("readyStatus", arg["isReady"]);
})

// client req for role map, event handler above
ipcMain.on('getRoleMap', (evt, arg) => {
  socket.emit("getRoleMap");
})

// attempt to download a song file from the server directly. A failure or success notice is given at the end of the process
ipcMain.on('downloadFile', (evt, arg) => {
  console.log(arg["fileName"])
  var error = false;
  var newFileStream = request.get("http://localhost:3000/" + arg["sourceFolder"] + "/" + arg["fileName"] + "." + arg["fileType"]).pipe(fs.createWriteStream(audioFolder + arg["fileName"] + "." + arg["fileType"]))
  newFileStream.on('finish', function(){
    var newFileStats = fs.statSync(audioFolder + arg["fileName"] + "." + arg["fileType"])
    var fileSizeInBytes = newFileStats.size;
    console.log(fileSizeInBytes + " bytes")
    // lmao this should be changed to support larger file names in a flexible fashion (size of name * x amount of bytes?)
    if(fileSizeInBytes > 400){
      console.log("Downloaded file " + arg["fileName"])
      mainWindow.webContents.send("downloadSuccess", { 'fileName': arg["fileName"], 'fileType' : arg["fileType"] });
    }else{
      console.log("Failed to download file " + arg["fileName"])
      mainWindow.webContents.send("downloadFailure", { 'fileName': arg["fileName"], 'fileType' : arg["fileType"] });
    }
    
  });
  
});

// controls the current song for the event handler above
ipcMain.on('songControl', (evt, arg) => {
  
  socket.emit('songUpdate', arg["seek"], arg["duration"], arg["paused"], arg["name"], arg["subtitle"]);
})

// electron window definiton
let mainWindow;
let roleSelectionWindow;


// defining params for the role selection window. The ipcMain sends down the roles as it recieves them
function letUserSelectRole() {
  roleSelectionWindow = new BrowserWindow({
    width: 600,
    height:500,
    webPreferences: {
      nodeIntegration: true
    }, 
    show: false,
    frame: false,
    transparent: true,
    resizable: false
  });

  roleSelectionWindow.loadFile("views/roles.html")
  roleSelectionWindow.isMenuBarVisible(false)
  roleSelectionWindow.on('closed', function () {
    roleSelectionWindow = null
  });
  roleSelectionWindow.webContents.on('did-finish-load', function(){
    socket.emit("requestRoles", false);
    roleSelectionWindow.show();
  })
  
}

// send role list to client (to select)
socket.on('rolesSent', (roles) => {
  console.log(roles)
  roleSelectionWindow.webContents.send("rolesToSelect", {'roles' : roles});
});

// main window that actually allows the user to interact with the show
function createWindow (role) {

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }, 
    show: false
    
  })
  //mainWindow.setFullScreen(true)
  //mainWindow.setMenu(null)
  var fileToLoad = ""
  console.log(role)

  // Checks whatever role was given back by the server and loads the corresponding file
  if(role == "controller_music"){
    fileToLoad = "views/music_controller.html"
  }else if(role == "controller_schema"){
    fileToLoad = "views/schema_designer.html"
  }else if(role == "director"){
    fileToLoad = "views/director.html"
  }
  else if(role == "crew_spotlight"){
    fileToLoad = "views/spotlight.html"
  }else{
    fileToLoad = "views/viewer.html"
  }
  mainWindow.loadFile(fileToLoad)
  mainWindow.isMenuBarVisible(false)
  
  mainWindow.on('closed', function () {
    mainWindow = null
  });
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    try{
      roleSelectionWindow.close();
    }catch(err){
      
    }
    
  });
  
  
}
// get list of songs, named "getMeSpiderman" as a joke
ipcMain.on("getMeSpiderman", (event, args) => {
  console.log("Get me Spiderman!!!")
  socket.emit('getAudioList')
  // trying to get a list of current ids from the server
});

// client req for server songs
ipcMain.on("requestServerSongs", (event, args) => {
  socket.emit('getSystemAudioList')
  // trying to get a list of current ids from the server
});

// client req for notes (does not return all in all cases)
ipcMain.on("getNotes", (event, args) => {
  socket.emit('getNoteList')
  // trying to get a list of current ids from the server
});

// sends a change in the client's notes to the server. Responded to by an event to update the page
ipcMain.on("noteChange", (event, args) => {
  socket.emit('noteChange', args["change"], args["data"], (currentRole == "director" ? args["role"] : currentRole))
  // tell the server that the client changed a note
});


// when ElectronJS is ready, start up the role selection window
app.on('ready', letUserSelectRole)

// event for user resize (if allowed by the window definition)
app.on('resize', function(e,x,y){
  mainWindow.setSize(x, y);
});

// quit when every window is closed, except if on macintosh (due to library issues)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// if there is no mainWindow on activation (other than the first runtime), start up the role window
app.on('activate', function () {
  if (mainWindow === null) {
    letUserSelectRole()
  }
})
