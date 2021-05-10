/* 
 NOTICE: This code segment omits other parts of code that are not necessary for the answering of question 3B. Please refer to the entire PDF document for the correctly formatted code that is runnable!
*/

/* 
 REMINDER: As stated on the author's APCSP portfolio profile, CollegeBoard has absolutely no rights to reproduce, reuse, or republish this code unless it is being used for the purposes of scoring (or validating the originality of the program from) the author in question. This code may be used for other professional projects by the student in the future, and the author retains ALL rights to publish the code on GitHub after the CollegeBoard scoring administration is over.
*/

/* 
 QUESTION SPECIFIC NOTICE: This is used in an HTML file, however, the <script> tag is completely Javascript based. HTML is omitted out of this file, but please understand that this reflects the same functionality as shown in the video (click play button = play song)
*/


// this function will try and set the current song playing, overriding the previous track (takes ELEMENT as an argument, being the element ID clicked)
// assume that all previously defined variables in this snippet are already defined, however due to the purpose of flexibility, some may be undefined at the start runtime of the program
function setSongAndPlay(element){
    var filetype = element.srcElement.id.split("|")[1].split(".")[element.srcElement.id.split("|")[1].split(".").length-1]
    var name = element.srcElement.id.split("|")[1].substring(0, element.srcElement.id.split("|")[1].length - filetype.length - 1)
    var instanceNum = parseInt(element.srcElement.id.split("|")[2])
    var track = element.srcElement.id.split("|")[0]
    
    if(element.srcElement.innerHTML == "play_arrow"){
      var prevSong = "";
      try{
        prevSong = currentSong;
      }catch(ex){

      }
      if(sound != undefined){
        if((currentSong["instanceIndex"] + currentSong["songName"]) != (instanceNum + name)){
          if(sound._src != undefined && sound.playing()){
            sound.stop();
          }
          var trackIndex = rawTrackList.indexOf(track);
          var indexOfSong = songList[trackIndex]["trackSongs"].indexOf(songList[trackIndex]["trackSongs"].filter(song => song["songName"] == name && song["instanceIndex"] == instanceNum)[0]);
          
          document.getElementById("songNamePlaying").innerHTML = name;
          document.getElementById("songPositionPlaying").innerHTML = track + " - Song " + (indexOfSong + 1);
          var location = downloadedSongs.includes(name + "." + filetype) ? "../public/audio/" : "http://localhost:3000/audio/"
          sound = new Howl({
            src: [location + name + "." + filetype],
            volume: setVolume,
            onend: function(){
              
              document.getElementById("songProgress").style.width = "0%"
              if(!shuffleState.current){
                if(autoplay && indexOfSong < (songList[trackIndex]["trackSongs"].length-1)){
                  playNextSong(indexOfSong+1)
                }else{
                  document.getElementById("playSong").innerHTML = "play_arrow";
                  document.getElementById(track + "|" + songList[trackIndex]["trackSongs"][indexOfSong]["songName"] + "." + songList[trackIndex]["trackSongs"][indexOfSong]["fileType"] + "|" + songList[trackIndex]["trackSongs"][indexOfSong]["instanceIndex"]).innerHTML = "play_arrow"
                }
              }else{
                if(!(shuffleState.index == (shuffleState.shuffleIndexes.length - 1))){
                  shuffleState.index = shuffleState.index + 1;
                  console.log(shuffleState.shuffleIndexes[shuffleState.index])
                  playNextSong(shuffleState.shuffleIndexes[shuffleState.index])
                }else{
                  document.getElementById("playSong").innerHTML = "play_arrow";
                  document.getElementById(track + "|" + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["songName"] + "." + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["fileType"] + "|" + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["instanceIndex"]).innerHTML = "play_arrow"
                }
              }
            }
          });
          console.log(currentTrack + "|" + prevSong["songName"] + "." + prevSong["fileType"] + "|" + prevSong["instanceIndex"])
          console.log(element.srcElement.id)
          document.getElementById(currentTrack + "|" + prevSong["songName"] + "." + prevSong["fileType"] + "|" + prevSong["instanceIndex"]).innerHTML = "play_arrow"
          currentSong = songList[trackIndex]["trackSongs"][indexOfSong]
          shuffleState.shuffleIndexes.unshift(songList[trackIndex]["trackSongs"].indexOf(currentSong))
          changeSongListView(prevSong)

          sound.play();
          document.getElementById("playSong").innerHTML = "pause";
          document.getElementById(element.srcElement.id).innerHTML = "pause"
          
          currentTrack = track
          if(shuffleState.current){
            resetShuffle();
            //shuffleState.shuffleIndexes.splice(shuffleState.shuffleIndexes.indexOf(indexOfSong), 1)
          }
        }else{
          document.getElementById("playSong").innerHTML = "pause";
          document.getElementById(element.srcElement.id).innerHTML = "pause"
          sound.play()
        }
      }else{
        var trackIndex = rawTrackList.indexOf(track);
          var indexOfSong = songList[trackIndex]["trackSongs"].indexOf(songList[trackIndex]["trackSongs"].filter(song => song["songName"] == name && song["instanceIndex"] == instanceNum)[0]);
          if(shuffleState.current){
            resetShuffle();
            shuffleState.shuffleIndexes.splice(shuffleState.shuffleIndexes.indexOf(indexOfSong), 1)
          }
          document.getElementById("songNamePlaying").innerHTML = name;
          document.getElementById("songPositionPlaying").innerHTML = track + " - Song " + (indexOfSong + 1);
          var location = downloadedSongs.includes(name + "." + filetype) ? "../public/audio/" : "http://localhost:3000/audio/"
          sound = new Howl({
            src: [location + name + "." + filetype],
            volume: setVolume,
            onend: function(){
              
              document.getElementById("songProgress").style.width = "0%"
              if(!shuffleState.current){
                if(autoplay && indexOfSong < (songList[trackIndex]["trackSongs"].length-1)){
                  playNextSong(indexOfSong+1)
                }else{
                  document.getElementById("playSong").innerHTML = "play_arrow";
                  document.getElementById(track + "|" + songList[trackIndex]["trackSongs"][indexOfSong]["songName"] + "." + songList[trackIndex]["trackSongs"][indexOfSong]["fileType"] + "|" + songList[trackIndex]["trackSongs"][indexOfSong]["instanceIndex"]).innerHTML = "play_arrow"
                }
              }else{
                if(!(shuffleState.index == (shuffleState.shuffleIndexes.length - 1))){
                  shuffleState.index = shuffleState.index + 1;
                  console.log(shuffleState.shuffleIndexes[shuffleState.index])
                  playNextSong(shuffleState.shuffleIndexes[shuffleState.index])
                }else{
                  document.getElementById("playSong").innerHTML = "play_arrow";
                  document.getElementById(track + "|" + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["songName"] + "." + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["fileType"] + "|" + songList[trackIndex]["trackSongs"][shuffleState.shuffleIndexes[shuffleState.index]]["instanceIndex"]).innerHTML = "play_arrow"
                }
              }
            }
          });
          currentSong = songList[trackIndex]["trackSongs"][indexOfSong]
          shuffleState.shuffleIndexes.unshift(songList[trackIndex]["trackSongs"].indexOf(currentSong))
          changeSongListView(prevSong)
          currentTrack = track
          sound.play();
          document.getElementById("playSong").innerHTML = "pause";
          document.getElementById(element.srcElement.id).innerHTML = "pause"
      }
    }else{
      document.getElementById("playSong").innerHTML = "play_arrow";
      document.getElementById(element.srcElement.id).innerHTML = "play_arrow";
      sound.pause();
    }
    
    
    
  }


  // NOTE: The purpose of this code block is to NOT reflect the procedure definition, it is only to give context on where the play buttons come from in the first place and where the .addEventListener('click') is happening
  ipcRenderer.on("songsToLoad", (event,args) => {
    // ... OMITTED FROM SNIPPET
    Array.from(document.getElementsByClassName("thissong")).forEach(btn => {
      btn.addEventListener("click", setSongAndPlay)
    })
    Array.from(document.getElementsByClassName("download")).forEach(btn => {
      btn.addEventListener("click", download)
    })
    // ... OMITTED FROM SNIPPET
  });