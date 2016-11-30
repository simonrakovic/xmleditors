/**
 * Created by simon on 26.10.2016.
 */
var fs = require("fs");
var util = require('util')
var moment = require('moment');
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");
var clone = require('clone');
var Converter = require("csvtojson").Converter;

function createXML(searchedDocDate, callback){

    var searchedDocRecords = [];
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
                            jsonObjectClone["Amt"][0]["_"] = String(searchedDocRecords[j]["Vrednost"]).replace(',', '.');
                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] = searchedDocRecords[j]["Naslovnik"].split(',')[0];
                            var referenca = searchedDocRecords[j]["Referenca"];

                            if (referenca.match(/SI00 [\d]{2}\-[\d]{4}\-[\d]{1}/i)) {
                                referenca = referenca.replace(/\s/g,'');
                            }else if(referenca.match(/SI 00 [\d]{2}\-[\d]{4}\-[\d]{1}/i)){
                                referenca = referenca.replace(/\s/g,'');
                            }else if(referenca.match(/SI00-[\d]{2}\-[\d]{4}\-[\d]{1}/i)){
                                referenca = referenca.replace('-','');
                            }
                            referenca = referenca.toUpperCase();
                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["EndToEndId"][0] = referenca;
                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["TxId"][0] = referenca;
                            jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RmtInf"][0]["Strd"][0]["CdtrRefInf"][0]["Ref"][0] = referenca;
                            matches.push(jsonObjectClone);
                        }
                        delete matches[i];
                    }
                }

                json["Document"]["BkToCstmrStmt"][0]["Stmt"][0]["Ntry"] = matches;


                var builder = new xml2js.Builder();

                xml = builder.buildObject(json);

                fs.writeFile('data/freja/output.xml', xml, function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback();
                    }
                });

            });
        });
    });
}


function readFiles(xmlFile, csvFile, searchedDocDate, cb){
    xmlFile.mv('data/banka.xml', function (err) {
        if (err) {
            cb(err);
        }

        csvFile.mv('data/posta.csv', function (err) {
            if (err) {
               cb(err);
            }

            createXML(searchedDocDate, function(err){
                if(err){
                    cb(err);
                }

                cb(err, "aa");
            });

        });

    });
}


module.exports = {
    readFiles: readFiles
};