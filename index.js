/**
 * Created by simon on 11.10.2016.
 */

var fs = require("fs");
var util = require('util')
var moment = require('moment');
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");
var clone = require('clone');
var Converter = require("csvtojson").Converter;
var express = require('express');
var fileUpload = require('express-fileupload');
var mideplast = require('./mideplast.js');
var berlicPosta = require('./berlicPosta');

var app = express();
app.use(fileUpload());

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/mideplast/', function (req, res) {

    res.render('mideplast');
});

app.post('/mideplast/upload', function(req, res){
    var csvKupcev = req.files.csvKupcev;
    var csvRacunov = req.files.csvRacunov;
    csvKupcev.mv('data/kupci.csv', function (err) {
        if (err) {
            res.status(500).send(err);
        }
        csvRacunov.mv('data/racuni.csv', function (err) {
            if (err) {
                res.status(500).send(err);
            }
            mideplast.readCSV("data/kupciUTF.csv","data/racuniUTF.csv", function(jsonKupci, jsonRacuni){
                mideplast.createXML(jsonKupci, jsonRacuni, function(err){
                    if(err){
                        res.status(500).send(err);
                    }
                    res.download(__dirname +'/data/racuni.xml','racuni.xml', function(err){
                        if(err){
                            res.status(500).send(err);
                        }
                        res.redirect('/mideplast');
                    });
                });
            });
        });
    });
});

app.post('/upload', function (req, res) {
    if (!req.files) {
        res.send('No files were uploaded.');
        return;
    }

    var xmlFile = req.files.xmlFile;
    var csvFile = req.files.csvFile;
    var searchedDocDate = moment(req.body.date, "D.M.YYYY");
    xmlFile.mv('data/banka.xml', function (err) {
        if (err) {
            res.status(500).send(err);
        }
        else {
            csvFile.mv('data/posta.csv', function (err) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    berlicPosta.createBankaXML(searchedDocDate, function(err){
                        if(err){
                            res.status(500).send(err);
                        }

                        res.download(__dirname +'/data/output.xml','banka.xml', function(err){
                            if(err){
                                res.status(500).send(err);
                            }
                            res.redirect('/');
                        });
                    });
                }
            });
        }
    });


});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});










