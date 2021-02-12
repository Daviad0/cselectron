const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')
const communicate = require("./communicate")

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

const server = require('./app');

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
  })
}

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
