/* 
 NOTICE: This code segment omits other parts of code that are not necessary for the answering of question 3B. Please refer to the entire PDF document for the correctly formatted code that is runnable!
*/

/* 
 REMINDER: As stated on the author's APCSP portfolio profile, CollegeBoard has absolutely no rights to reproduce, reuse, or republish this code unless it is being used for the purposes of scoring (or validating the originality of the program from) the author in question. This code may be used for other professional projects by the student in the future, and the author retains ALL rights to publish the code on GitHub after the CollegeBoard scoring administration is over.
*/

// ASSUME THAT INSTANCES ALREADY HAVE ELEMENTS FROM THE PREVIOUS ARTIFACT. ALSO ASSUME THAT NO CODE WILL RETURN UNDEFINED
let instances = [];

// code in order to automatically remove inactive roles. This was packaged inside a setInterval()
// lists initialized to track each and every change made in the ping function for the DIRECTOR
var updatedInstances = []
var deletedInstances = []
instances.forEach(inso => {
  try{
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
        if(savedDevices.filter(el => el.deviceId == del.deviceId).length == 0){
          // add an instance to saved devices
          if(del.role != undefined){
            // no use in saving if they didn't already join a role!
            // allows for 5 minutes of waiting before not being allowed to rejoin
            savedDevices.push({deviceId : del.deviceId, role: del.role, finalChance : new Date(new Date().getTime + (5*60000))})
          }
          
        }else{
          // edit an instance to saved devices
        }
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
  }catch(notexist){

  }
  
});
// puts changes into an interable array that is easier to work with when sending down to the client (adding the "update" or "delete" event parameters)
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
var i = 0;
instances.filter(el => el.role != undefined && el.role.identifier == "crew_spotlight").forEach(dirIns => {
  io.to(dirIns.socketId).emit("spotlightInstance", i);
  i = i + 1
});

/*
  Title: Socket.IO (Server)
  Author: rauchg
  Date: 2/12/2021
  Code Version: 3.1.1
  Code Availaibility: https://github.com/socketio/socket.io
  Notes: Paired with the Socket.IO-client package on main.js through port 3000, the definition of this code is excluded in this code segment
*/
io.on('connection', (socket) => {
    socket.on('getInstanceList', (loginRequest) => {
        var allUsers = instances
        // to send down to the director/user manager all of the currently connected clients in order to GET/SEND data
        socket.emit('instancesSent',JSON.stringify(allUsers), socket.id);
    });
});

// END OF FILE