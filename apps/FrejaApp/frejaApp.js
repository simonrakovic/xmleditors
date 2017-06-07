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
var iconv = require('iconv-lite');

function convertToUTF(csvPath, cb) {
    fs.readFile(csvPath, function (err, buffer1) {
        if (err) cb(err);
            cb(iconv.decode(buffer1, 'win1250'));
    });
}

function createXML(searchedDocDate, callback){

    var searchedDocRecords = [];
    var converter = new Converter({delimiter: ';'});
    convertToUTF("data/posta.csv", function(data){
        converter.fromString(data, function (err, results) {
            //console.log(results);
            for (var i = 0; i < results.length; i++) {

                var resultDate = results[i]['Datum nakazila'];
                var datePart = null;

                if(resultDate !== undefined){
                  datePart = resultDate.split(' ');
                }else{
                  return callback({"error": "Napačna datoteka prometa!"});
                }

                var docDate = moment(datePart[0], "D.M.YYYY");
                if (docDate.format("DD-MM-YYYY") == searchedDocDate.format("DD-MM-YYYY")) {

                    searchedDocRecords.push(results[i]);
                }
            }
            if(searchedDocRecords.length === 0){
                return callback({"error": "Na ta datum ni nobenega plačila!"});
            }
            fs.readFile('data/banka.xml', 'utf8', function (err, data) {
                if (err) {
                    callback(err);
                }
                xml2js.parseString(data, function (err, json) {
                    var matches = xpath.find(json, "//Ntry");
                    var postaExsist = false;

                    for (var i = 0; i < matches.length; i++) {
                        if (matches[i]["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] == "POSTA SLOVENIJE D.O.O. " || matches[i]["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] == "POSTA SLOVENIJE D.O.O.") {
                            postaExsist = true;
                            for (var j = 0; j < searchedDocRecords.length; j++) {
                                var jsonObjectClone = clone(matches[i]);
                                jsonObjectClone["Amt"][0]["_"] = String(searchedDocRecords[j]["Vrednost"]).replace(',', '.');
                                jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RltdPties"][0]["Dbtr"][0]["Nm"][0] = searchedDocRecords[j]["Naslovnik"].split(',')[0];
                                var referenca = searchedDocRecords[j]["Referenca"];

                                if (referenca.match(/SI00 [\d]{2}\-[\d]+\-[\d]{1}/i)) {
                                    referenca = referenca.replace(/\s/g,'');
                                }else if(referenca.match(/SI 00 [\d]{2}\-[\d]+\-[\d]{1}/i)){
                                    referenca = referenca.replace(/\s/g,'');
                                }else if(referenca.match(/SI00-[\d]{2}\-[\d]+\-[\d]{1}/i)){
                                    referenca = referenca.replace('-','');
                                }else if(referenca.match(/[\d]{2}\-[\d]+\-[\d]{1}/i)){

                                    referenca = "SI00".concat(referenca);
                                }
                                //console.log(referenca);
                                referenca = referenca.toUpperCase();
                                jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["EndToEndId"][0] = referenca;
                                jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["Refs"][0]["TxId"][0] = referenca;
                                jsonObjectClone["NtryDtls"][0]["TxDtls"][0]["RmtInf"][0]["Strd"][0]["CdtrRefInf"][0]["Ref"][0] = referenca;
                                matches.push(jsonObjectClone);
                            }
                            delete matches[i];
                        }
                    }

                    if(!postaExsist){
                      return callback({"error": "V bančnem izpisku ni postavke POŠTA!"});
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
    });

}


function readFiles(xmlFile, csvFile, searchedDocDate, cb){
    xmlFile.mv('data/banka.xml', function (err) {
        if (err) {
            cb(err);
        }else{
          csvFile.mv('data/posta.csv', function (err) {
              if (err) {
                 cb(err);
              }else{
                createXML(searchedDocDate, function(err){
                    if(err){
                        cb(err);
                    }else{
                        cb();
                    }

                });
              }
          });
        }

    });
}


module.exports = {
    readFiles: readFiles
};
