/**
 * Created by simon on 30.11.2016.
 */
var fs = require("fs");
var util = require('util');
var xml2js = require("xml2js");
var Converter = require("csvtojson").Converter;
var fileUpload = require('express-fileupload');
var express = require('express');
var router = express.Router();

var mideplast = require('./mideplastApp.js');

router.get('/', function (req, res) {

    res.render('mideplast');
});

router.post('/', function(req, res){
    var csvKupcev = req.files.csvKupcev;
    var csvRacunov = req.files.csvRacunov;
    //console.log(csvKupcev.name);
    mideplast.readFiles(csvKupcev, csvRacunov, function(err, url, racuniLastnosti){
        if(err){
          res.status(500).send(err);
        }else{
          fs.readFile(__dirname +'/../../public/racuni.xml', 'utf8', function(err, data){
            if(err){
              res.status(500).send(err);
            }else{
              res.json({"type":"success", "msg": data, "url": url, "properties": racuniLastnosti});
            }
          });
        }
        /*
        res.download(__dirname +'/../../data/racuni.xml','racuni.xml', function(err){
            if(err){
                res.status(500).send(err);
            }
        });
        */
    });

});


module.exports = router;
