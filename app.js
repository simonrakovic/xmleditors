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
var path = require('path');
var mideplastRouter = require('./apps/MideplastApp/mideplastRouter');
var frejaRouter = require('./apps/FrejaApp/frejaRouter');
var plusRouter = require('./apps/3plusApp/3plusRouter');




var app = express();
app.use(fileUpload());
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res){
    res.render('main');
});

app.use('/freja', frejaRouter);
app.use('/mideplast', mideplastRouter);
app.use('/3plus', plusRouter);

app.set('view engine', 'pug');

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});










