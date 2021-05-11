/* 
 NOTICE: This code segment omits other parts of code that are not necessary for the answering of question 3D. Please refer to the entire PDF document for the correctly formatted code that is runnable!
*/

/* 
 QUESTION SPECIFIC NOTICE: This is used in an HTML file, however, the <script> tag is completely Javascript based. HTML is omitted out of this file, but please understand that this reflects the same functionality as shown in the video (click play button = play song)
*/

// This is the first possible calling location: where a server mandated update is happening
ipcRenderer.on("notifyNoteChange", (event, args) => {
    var el = JSON.parse(args["data"])
    if(args["change"] == 'delete'){
      notes.splice(notes.indexOf(notes.filter(note => note["id"] == el["id"])[0]),1)
      document.getElementById(el["id"]).remove()
    }
    else if(args["change"] == 'update'){
      
      notes[notes.indexOf(notes.filter(note => note["id"] == el["id"])[0])] = el
      console.log(notes.filter(note => note["id"] == el["id"])[0])
      if(pinnedNotes.filter(note => note["id"] == el["id"]).length > 0){
        pinnedNotes[pinnedNotes.indexOf(pinnedNotes.filter(note => note["id"] == el["id"])[0])] = el
      }
      var keepTrackOf = el["id"]
      resetNoteList()
    }
    else if(args["change"] == 'create'){
      notes.push(el)
      var keepTrackOf = el["id"]
      resetNoteList()
      
    }
    
  });

// This is the second possible calling location: whenever the pin button is either checked or unchecked (please note that this shows up in both the server "notesToLoad" and procedure itself)
Array.from(document.getElementsByClassName("pinNote")).forEach(el => {
      
    el.addEventListener('click', function(evt){
    var noteId = evt.srcElement.id.split("|")[0]
    if(pinnedNotes.filter(el => el["id"] == noteId).length == 0){
      document.getElementById(noteId + "_options").style.display = "none"
      var element = $('#' + noteId).detach();
      pinnedNotes.push(notes.filter(note => note["id"] == noteId)[0])
      resetNoteList();
    }else{
      console.log(pinnedNotes.filter(el => el["id"] == noteId)[0])
      console.log(pinnedNotes.indexOf(pinnedNotes.filter(el => el["id"] == noteId)[0]))
      pinnedNotes.splice(pinnedNotes.indexOf(pinnedNotes.filter(el => el["id"] == noteId)[0]),1)
      resetNoteList();
    }
    
    
  });
  
})

// END OF FILE