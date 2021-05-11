/* 
 NOTICE: This code segment omits other parts of code that are not necessary for the answering of question 3D. Please refer to the entire PDF document for the correctly formatted code that is runnable!
*/

/* 
 QUESTION SPECIFIC NOTICE: This is used in an HTML file, however, the <script> tag is completely Javascript based. HTML is omitted out of this file, but please understand that this reflects the same functionality as shown in the video (click play button = play song)
*/

// This function serves the purpose of resetting the notes view whenever something needs to be updated
// assume that all previously defined variables in this snippet are already defined, however due to the purpose of flexibility, some may be undefined at the start runtime of the program
// while idToScrollTo is the only DEFINED parameter in the function definition, it uses several other dynamic variables to change the output
function resetNoteList(idToScrollTo){
  var rawStringsPinned = []
  pinnedNotes.forEach(el => {
    rawStringsPinned.push(el["id"])
  });
  document.getElementById('noteList_allnotes').innerHTML = "";
  document.getElementById('noteList_pinned').innerHTML = "";
  notes.filter(note => !rawStringsPinned.includes(note["id"])).sort((a,b) => (rawTrackList.indexOf(a["noteTrack"]) > rawTrackList.indexOf(b["noteTrack"])) ? 1 : ((rawTrackList.indexOf(a["noteTrack"]) == rawTrackList.indexOf(b["noteTrack"])) ? ((parseInt(a["noteSongIndex"]) > parseInt(b["noteSongIndex"]) ? 1 : -1)) : -1)).forEach(remake => {
    var trackIndex = rawTrackList.indexOf(remake["noteTrack"])
    // A statement would add HTML here, but CollegeBoard didn't anticipate long code segments, so it is omitted for room purposes (just added a note to the notes list)
  });
  if(pinnedNotes.length > 0){
    document.getElementById("noteList_pinnedLabel").style.display = "inline-block"
    document.getElementById("noteList_allnotesLabel").style.display = "inline-block"
  }else{
    document.getElementById("noteList_pinnedLabel").style.display = "none"
    document.getElementById("noteList_allnotesLabel").style.display = "none"
  }
  pinnedNotes.sort((a,b) => (rawTrackList.indexOf(a["noteTrack"]) > rawTrackList.indexOf(b["noteTrack"])) ? 1 : ((rawTrackList.indexOf(a["noteTrack"]) == rawTrackList.indexOf(b["noteTrack"])) ? ((parseInt(a["noteSongIndex"]) > parseInt(b["noteSongIndex"]) ? 1 : -1)) : -1)).forEach(remake => {
    var trackIndex = rawTrackList.indexOf(remake["noteTrack"])
    // A statement would add HTML here, but CollegeBoard didn't anticipate long code segments, so it is omitted for room purposes (just added a note to the notes list)
  });
  
  notes.forEach(el => {
    document.getElementById(el["id"] + "_triggerOptions").addEventListener('click', function(){
      document.getElementById(el["id"] + "_options").style.transform = "translateY(-" + document.getElementById("noteList").scrollTop + "px)"
      document.getElementById(el["id"] + "_options").style.display = "block"
      document.getElementById(el["id"] + "_options").focus()
    });
    document.getElementById(el["id"] + "_options").addEventListener('focusout', function(evt){
      if(evt.relatedTarget == null || evt.relatedTarget.localName != "a"){
        document.getElementById(el["id"] + "_options").style.display = "none"
      }
      
    });
  });

  // addEventListener blocks of code here were omitted for the same reason as the HTML above (CollegeBoard auto WR PDF bad)

  if(idToScrollTo != undefined && idToScrollTo != null){
    var topPos = document.getElementById(idToScrollTo).offsetTop;
    document.getElementById('noteList').scrollTop = topPos;
  }
}

// END OF FILE