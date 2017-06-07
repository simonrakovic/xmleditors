/**
 * Created by simon on 30.11.2016.
 */

var fs = require("fs");
var util = require('util');
var moment = require('moment');
var fileUpload = require('express-fileupload');
var express = require('express');
var router = express.Router();

var freja = require('./frejaApp.js');

router.get('/', function (req, res) {
    res.render('freja');
});


router.post('/', function (req, res) {
    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    var xmlFile = req.files.xmlFile;
    var csvFile = req.files.csvFile;
    var searchedDocDate = moment(req.body.date, "D.M.YYYY");
    
    freja.readFiles(xmlFile, csvFile, searchedDocDate, function(err, name){
        if (err) {
            res.status(500).send(err);
        }else{
          res.download(__dirname +'/../../data/freja/output.xml','banka.xml', function(err){
              if(err){
                  res.status(500).send(err);
              }
          });
        }
    });
});


router.get('/test', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ a: 1 }));
});


module.exports = router;
