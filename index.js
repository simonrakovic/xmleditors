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




var searchedDocRecords = [];

var app = express();
app.use(fileUpload());

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.render('index', {title: 'Hey', message: 'Hello there!'});
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
                    //zacne se pretvorba datotek, callback hell i know, who cares.
                    var converter = new Converter({delimiter: ';',});

                    converter.fromFile("data/posta.csv", function (err, results) {

                        for (var i = 0; i < results.length; i++) {
                            var resultDate = results[i]['Datum nakazila'];
                            var datePart = resultDate.split(' ');
                            var docDate = moment(datePart[0], "D.M.YYYY");
                            if (docDate.format("DD-MM-YYYY") == searchedDocDate.format("DD-MM-YYYY")) {

                                searchedDocRecords.push(results[i]);
                            }
                        }

                        fs.readFile('data/banka.xml', 'utf8', function (err, data) {
                            if (err) {
                                return console.log(err);
                            }
                            xml2js.parseString(data, function (err, json) {
                                var matches = xpath.find(json, "//Ntry");

                                for (var i = 0; i < matches.length; i++) {

                                    if (matches[i]["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] == "POSTA SLOVENIJE D.O.O. " || matches[i]["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] == "POSTA SLOVENIJE D.O.O.") {

                                        for (var j = 0; j < searchedDocRecords.length; j++) {
                                            var jsonObjectClone = clone(matches[i]);
                                            jsonObjectClone["Amt"][0]["_"] = searchedDocRecords[j]["Vrednost"].replace(',', '.');
                                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] = searchedDocRecords[j]["Naslovnik"].split(',')[0];
                                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["EndToEndId"][0] = searchedDocRecords[j]["Referenca"].split('-')[1];
                                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["TxId"][0] = searchedDocRecords[j]["Referenca"].split('-')[1];
                                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RmtInf"][0]["Strd"][0]["CdtrRefInf"][0]["Ref"][0] = searchedDocRecords[j]["Referenca"].split('-')[1];
                                            matches.push(jsonObjectClone);
                                        }
                                        delete matches[i];
                                    }
                                }

                                json["Document"]["BkToCstmrStmt"][0]["Stmt"][0]["Ntry"] = matches;


                                var builder = new xml2js.Builder();

                                xml = builder.buildObject(json);


                                fs.writeFile('data/output.xml', xml, function (err) {
                                    if (err) {

                                    } else {
                                        res.sendFile('data/output.xml',{"root": __dirname});
                                    }
                                });

                            });

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










