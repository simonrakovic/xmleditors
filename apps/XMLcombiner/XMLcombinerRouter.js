/**
 * Created by simon on 30.11.2016.
 */
var fs = require("fs");
var util = require('util');
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");
var Converter = require("csvtojson").Converter;
var fileUpload = require('express-fileupload');
var express = require('express');
var router = express.Router();

var mideplast = require('./XMLcombinerApp.js');

router.get('/', function (req, res) {
    var step = req.query.step;
    if (step == 1) {
        mideplast.stepOne(req, res, function (err) {
            res.status(500).send(err);
        });
    } else if (step == 2) {
        mideplast.stepTwo(req, res, function (err) {
            res.status(500).send(err);
        });
    } else if(step == 3){
         mideplast.stepThree(req, res, function(err){
             res.status(500).send(err);
         });
    } else if(step == 4){
        mideplast.stepFour(req, res, function (err) {
            res.status(500).send(err);
        });
    }else{
        res.render('XMLcombiner', {"step":0});
    }
});

router.post('/', function (req, res) {
    var step = req.query.step;
    if (step == 2) {
        mideplast.stepTwoPost(req, res, function (err) {
            res.status(500).send(err);
        });
    } else if(step == 3){
        mideplast.stepThreePost(req, res, function(err){
            res.status(500).send(err);
        });
    }else {
        var xmlFile = req.files.xmlFile,
            cvsFile = req.files.csvFile;
        xmlFile.mv('data/XMLcombiner/temp/xmlFile.xml', function(err){
            if (err) res.status(500).send(err);
            cvsFile.mv('data/XMLcombiner/temp/csvFile.csv', function(err){
                if (err) res.status(500).send(err);
                res.redirect('/xmlcombiner?step=1');
            });
        });
    }


});


module.exports = router;