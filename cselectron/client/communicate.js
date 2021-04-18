const {app, BrowserWindow} = require('electron')
const {ipcMain} = require('electron')

let hostState = null

exports.startCommuncations = function(hostname){
    
}

exports.updateState = function(state){
    hostState = state;
}