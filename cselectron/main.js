const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const communicate = require("./communicate")
const audioFolder = "./public/audio/"
const fs = require('fs')
const io = require("socket.io-client")

// This is socket.io simulation
const server = require('./app')


const socket = io.connect("http://localhost:3000", {reconnect: true});

socket.on("connect", function(instance){
  socket.emit("requestRoles", false);
})
socket.on('rolesSent', (roles) => {
  // Login page
});
socket.on('majorEvent', (sender, message) => {
  // Handle sending to client
});
socket.on('songUpdateFromServer', (songName, subtitle, progress) => {
  // Handle sending to client
});
socket.on('roleRegisterAs', (roleIdentifier) => {
  // Logic to make sure that all of the required event handlers are here.
});


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

ipcMain.on('sendMainMessage', (evt, arg) => {
  console.log(arg["greeting"])
})

ipcMain.on('songControl', (evt, arg) => {
  
  socket.emit('songUpdate', arg["seek"], arg["duration"], arg["paused"], arg["name"], arg["subtitle"]);
})


let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //mainWindow.setFullScreen(true)
  mainWindow.loadFile("views/index.html")
  mainWindow.isMenuBarVisible(false)
  
  mainWindow.on('closed', function () {
    mainWindow = null
  });

  
  
}

ipcMain.on("getMeSpiderman", (event, args) => {
  console.log("Get me Spiderman!!!")
  fs.readdir(audioFolder, (err, files) => {
    console.log("Read files")
    mainWindow.webContents.send("songsToLoad", {'songs' : files})
  });
});


app.on('ready', createWindow)

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
