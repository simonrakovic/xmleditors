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

var mideplast = require('./3plusApp.js');

router.get('/', function (req, res) {

    res.render('3plus');
});

router.post('/', function(req, res){

    mideplast.readFiles(req.body.textData.replace(/[\r]/g, '\\r'), req.body.totalValue, req.body.taxValue, req.body.desc, req.body.shopID, req.body.date, function(err, name){
        if(err){
            res.status(500).send(err);
        }

        res.download(__dirname +'/../../data/3plus/temeljnicaOut.xml','temeljnica.xml', function(err){
            if(err){
                res.status(500).send(err);
            }

        });

    });

});


module.exports = router;