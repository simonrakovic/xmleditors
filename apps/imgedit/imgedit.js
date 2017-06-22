var express = require('express');
var router = express.Router();
var gm = require('gm').subClass({imageMagick: true});
var pdfDocument = require('pdfkit');
var fs = require("fs");

var dirPath = "/home/simon/Projects/xmleditors"

function createPdf(file, filepath, filename, cb){
  fs.chmod(filepath, 0777, function(err){
    if(err){
      cb(err);
    }else{
      var pdf = new pdfDocument();
      var stream = pdf.pipe(fs.createWriteStream(filepath));

      pdf.image(file.data, 0, 0 , 'width: 400');
      pdf.end();
      stream.on('finish', function() {

        var stats = fs.statSync(filepath);

        var compressedFile = {"name": filename, "url":"/public/" + filename};
        compressedFile["size"] = stats.size;

        cb(err, compressedFile)
      });

    }
  });
}

function readFiles(files, cb){

  var compressedFiles = [];
  files.map(function(image){
    var imgName = image.name.split('.')[0]+"_compressed.pdf";
    gm(image.data)
        .resize(600)
        .noProfile()
        .write( dirPath+'/public/' + imgName, function (error) {
            if(error){
              cb(error)
            }else{

              createPdf(image, dirPath + '/public/' + imgName, imgName, function(err, compressedFile){
                if(err){
                  cb(err)
                }else{
                    compressedFiles.push(compressedFile);
                    if(compressedFiles.length === files.length){
                      cb(err, compressedFiles);
                  };
                }
              });
            }
        });
  });


}

router.post('/', function (req, res) {

    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    var images = req.files.images;

    if(!(images instanceof Array)){
      images = [images];
    }

    readFiles(images, function(err, compressFiles){
      if(err){
        res.status(500).send(err)
      }else{
        res.json({"type": "success", "files":compressFiles});
      }
    });


});


module.exports = router;
