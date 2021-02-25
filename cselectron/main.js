const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const communicate = require("./communicate")
const audioFolder = "./public/audio/"
const fs = require('fs')
const io = require("socket.io-client")
const request = require('request')


const socket = io.connect("http://localhost:3000", {reconnect: true});

socket.on("connect", function(instance){
  
})

socket.on('majorEvent', (sender, message) => {
  // Handle sending to client
});
socket.on('songUpdateFromServer', (songName, subtitle, progress) => {
  // Handle sending to client
});
socket.on('roleRegisterAs', (roleIdentifier) => {
  // Logic to make sure that all of the required event handlers are here.
});
socket.on('songUpdate', (to, outOf, paused, name, subtitle) => {
  console.log("SONG UPDATE")
  try{
    mainWindow.webContents.send("songUpdate", { 'songTitle' : name, 'songSubtitle' : subtitle, 'songPaused' : paused, 'songDuration' : to, 'songLength' : outOf })
  }catch(err){
    
  }
  
});
socket.on('recAudioList', (listOfFiles) => {

  // sending down the schema and then the songs that the client has downloaded to make it more easier
  // downloaded items should work in an array and calculated on the fly (because then we can just get rid of a lot of the beginning logic)
  fs.readdir(audioFolder, (err, files) => {
    if(listOfFiles != null){
      mainWindow.webContents.send("songsToLoad", {'songsInSystem' : files, 'songs' : listOfFiles })
    }
    
    
  });
});

// every request needs to include a hoststate!
class HostState {
  constructor(token, time, role, connected){
    this.token = token
    this.time = time
    this.role = role
    this.connected = connected
  }
}

let currentHostState = new HostState(null, null, null, false);

ipcMain.on('quitapp', (evt, arg) => {
  app.quit()
})

ipcMain.on('selectRole', (evt, arg) => {
  console.log("Role Selected: " + arg["role"])
  if(arg["role"] == "controller_music"){
    createWindow(true);
  }else{
    createWindow(false);
  }
})

ipcMain.on('sendMainMessage', (evt, arg) => {
  console.log(arg["greeting"])
})

ipcMain.on('downloadFile', (evt, arg) => {
  console.log(arg["fileName"])
  var newFileStream = request.get("http://localhost:3000/" + arg["sourceFolder"] + "/" + arg["fileName"] + "." + arg["fileType"]).pipe(fs.createWriteStream(audioFolder + arg["fileName"] + "." + arg["fileType"]))
  newFileStream.on('finish', function(){
    console.log("Downloaded file " + arg["fileName"])
    mainWindow.webContents.send("downloadSuccess", { 'fileName': arg["fileName"], 'fileType' : arg["fileType"] });
  });
});

ipcMain.on('songControl', (evt, arg) => {
  
  socket.emit('songUpdate', arg["seek"], arg["duration"], arg["paused"], arg["name"], arg["subtitle"]);
})


let mainWindow;
let roleSelectionWindow;

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

socket.on('rolesSent', (roles) => {
  console.log(roles)
  roleSelectionWindow.webContents.send("rolesToSelect", {'roles' : roles});
});

function createWindow (isMusic) {

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
  mainWindow.loadFile(isMusic ? "views/music_controller.html" : "views/viewer.html")
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

ipcMain.on("getMeSpiderman", (event, args) => {
  console.log("Get me Spiderman!!!")
  socket.emit('getAudioList')
  // trying to get a list of current ids from the server
});


app.on('ready', letUserSelectRole)

app.on('resize', function(e,x,y){
  mainWindow.setSize(x, y);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
