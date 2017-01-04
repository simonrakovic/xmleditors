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
    var treeLevel = req.query.treeLevel;
    var searchedElement = req.query.searchedElement;

    if(treeLevel != null){
        res.send(req.session.xmlElements[treeLevel]);
    }

    var builder = new xml2js.Builder();

    if(searchedElement != null){
        var searchedJson =  xpath.find(req.session.jsonXml, "//"+searchedElement);
        //console.log(searchedJson);
        res.send(builder.buildObject(searchedJson));
    }
    else{
        mideplast.readXML(function(err, xmlElements, jsonXml){
            if(err) res.status(500).send(err);
            req.session.xmlElements = xmlElements;
            req.session.jsonXml = jsonXml;

            jsonXml = builder.buildObject(jsonXml);

            res.render('XMLcombiner',{'xmlElements':xmlElements,'xmlElement0':xmlElements[0], 'xml': jsonXml});
        });
    }
});

router.post('/', function(req, res){
    var csvKupcev = req.files.csvKupcev;
    var csvRacunov = req.files.csvRacunov;

    mideplast.readFiles(csvKupcev, csvRacunov, function(err, name){
        if(err){
            res.status(500).send(err);
        }
        res.download(__dirname +'/../../data/racuni.xml','racuni.xml', function(err){
            if(err){
                res.status(500).send(err);
            }

        });
    });

});




module.exports = router;