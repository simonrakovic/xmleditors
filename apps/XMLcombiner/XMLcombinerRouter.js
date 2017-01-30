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
    } else {
        var csvKupcev = req.files.csvKupcev;
        var csvRacunov = req.files.csvRacunov;
        mideplast.readFiles(csvKupcev, csvRacunov, function (err, name) {
            if (err) {
                res.status(500).send(err);
            }
            res.download(__dirname + '/../../data/racuni.xml', 'racuni.xml', function (err) {
                if (err) {
                    res.status(500).send(err);
                }

            });
        });
    }


});


module.exports = router;