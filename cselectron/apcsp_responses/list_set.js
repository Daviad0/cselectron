/* 
 NOTICE: This code segment omits other parts of code that are not necessary for the answering of question 3B. Please refer to the entire PDF document for the correctly formatted code that is runnable!
*/

/* 
 REMINDER: As stated on the author's APCSP portfolio profile, CollegeBoard has absolutely no rights to reproduce, reuse, or republish this code unless it is being used for the purposes of scoring (or validating the originality of the program from) the author in question. This code may be used for other professional projects by the student in the future, and the author retains ALL rights to publish the code on GitHub after the CollegeBoard scoring administration is over.
*/

// This code shows the tracking of all of the clients (on the server side) throughout the runtime of all of the applications
let instances = [];

/*
  Title: Socket.IO (Server)
  Author: rauchg
  Date: 2/12/2021
  Code Version: 3.1.1
  Code Availaibility: https://github.com/socketio/socket.io
  Notes: Paired with the Socket.IO-client package on main.js through port 3000, the definition of this code is excluded in this code segment
*/
io.on('connection', (socket) => {
    // Push a new instance on the FIRST connect. It will still handle for "loginWithRole"
    if(instances.filter(el => el.socketId == socket.id).length <= 0){
      instances.push(new Instance(socket.id, new Date(), null))
      
    }
    // request back from the client that it has recieved the PING request and the connection is alive
    socket.on("PONG", () => {
      try{
        respondedSockets.push(socket.id)
        if(instances.filter(el => el.socketId == socket.id)[0].unresponsive){
          // LET THE DIRECTOR KNOW THAT IT ISN'T UNRESPONSIVE
          instances.filter(el => el.socketId == socket.id)[0].unresponsive = false
          
          
        }
      }catch(err){
  
      }
      
      
    });
    // tell server that a client has logged in requesting a specific role
    socket.on('loginWithRole', (roleIdentifier) => {
        // notify CONSOLE
        console.log(socket.id + " logged in with role " + roleIdentifier)
        // set the role of the instance
        instances.filter(el => el.socketId == socket.id)[0].role = roles.filter(el => el.identifier == roleIdentifier)[0]
        // notify director that a change was made by instances
        instances.filter(el => el.role != undefined && el.role.identifier == "director").forEach(dirIns => {
          io.to(dirIns.socketId).emit("instancesUpdate", JSON.stringify([{change: 'update', data: instances.filter(el => el.socketId == socket.id)[0]}]), dirIns.socketId);
        });
      });
});

// END OF FILE