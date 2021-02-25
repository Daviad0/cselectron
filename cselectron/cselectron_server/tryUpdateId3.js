const NodeID3 = require('node-id3')
const fs = require('fs')

const audioFolder = "./public/audio/"

var num = 0;
fs.readdir(audioFolder, (err, files) => {
    console.log("Read files")
    files.forEach(file => {
        tags = {
            subtitle: "cnfg:" + num
        }
        NodeID3.update(tags, audioFolder+file, function(err, buffer){
            console.log(file + " update success!");
            console.log(err)
        })
        num += 1
    });
    
  });