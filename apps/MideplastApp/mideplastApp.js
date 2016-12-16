/**
 * Created by simon on 24.10.2016.
 */
var fs = require("fs");
var util = require('util');
var moment = require('moment');
var xml2js = require("xml2js");
var clone = require('clone');
var Converter = require("csvtojson").Converter;
var iconv = require('iconv-lite');

function convertToUTF(csv1Path, csv2Path, cb) {
    fs.readFile(csv1Path, function (err, buffer1) {
        if (err) cb(err);
        data1 = iconv.decode(buffer1, 'win1250');
        fs.readFile(csv2Path, function (err, buffer2) {
            if (err) cb(err);
            data2 = iconv.decode(buffer2, 'win1250');
            cb(data1, data2);
        });
    });

}

function findKupec(jsonKupci, jsonRacun) {
    // poisci id_ddv kupca racuna
    // vrne json


    for (var i = 0; i < jsonKupci.length; i++) {
        if (jsonKupci[i]["Šifra kupca"] === jsonRacun["Šifra kupca"]) {

            return String(jsonKupci[i]["Davčna številka"]).replace('SI','');
        }
    }

}


function combineCSV(jsonKupci, jsonRacuni) {

    var racuni = [];

    var racun = {
        "sifra": "",
        "st_racuna": "",
        "datum_racuna": "",
        "datum_opravljanja": "",
        "datum_valute": "",
        "ddv": "",
        "breme": ""
    };
    var currentInvNum = "init";
    for (var i = 0; i < jsonRacuni.length; i++) {
        if(jsonRacuni[i]["Znesek"] == 0){
            continue;
        }

        if(currentInvNum == "init" ){
            racun["st_racuna"] = jsonRacuni[i]["Št"]["računa"];

            racun["datum_racuna"] = jsonRacuni[i]["Datum"];
            racun["datum_opravljanja"] = jsonRacuni[i]["Datum pošilj"][""];
            racun["datum_valute"] = jsonRacuni[i]["Zapade"];

            racun["sifra"] = findKupec(jsonKupci, jsonRacuni[i]);
            racun["breme"] = parseFloat(jsonRacuni[i]["Znesek terjatev"].replace(',','.'));

            if(jsonRacuni[i]["Konto GK"] == "260000"){
                racun["ddv"] = parseFloat(jsonRacuni[i]["Znesek"].replace('-','').replace(',','.'));
            }
            currentInvNum = jsonRacuni[i]["Št"]["računa"];

        }else if(currentInvNum == jsonRacuni[i]["Št"]["računa"]){
            if(jsonRacuni[i]["Konto GK"] == "260000"){
                racun["ddv"] = parseFloat(jsonRacuni[i]["Znesek"].replace('-','').replace(',','.'));
            }
        }else if(currentInvNum != jsonRacuni[i]["Št"]["računa"]){

            racuni.push(clone(racun));
            racun["postavke"] = [];

            racun["st_racuna"] = jsonRacuni[i]["Št"]["računa"];

            racun["datum_racuna"] = jsonRacuni[i]["Datum"];
            racun["datum_opravljanja"] = jsonRacuni[i]["Datum pošilj"][""];
            racun["datum_valute"] = jsonRacuni[i]["Zapade"];

            racun["sifra"] = findKupec(jsonKupci, jsonRacuni[i]);

            racun["breme"] = parseFloat(jsonRacuni[i]["Znesek terjatev"].replace(',','.'));

            if(jsonRacuni[i]["Konto GK"] == "260000"){
                racun["ddv"] = parseFloat(jsonRacuni[i]["Znesek"].replace('-','').replace(',','.'));
            }
            currentInvNum = jsonRacuni[i]["Št"]["računa"];

        }

    }

    return racuni;
}


function readCSV(csv1path, csv2path, cb) {
    convertToUTF(csv1path, csv2path, function (data1, data2) {
        var converter = new Converter({delimiter: ';',});
        converter.fromString(data1, function (err, results) {

            var converter2 = new Converter({delimiter: ';',});
            converter2.fromString(data2, function (err, results2) {
                //console.log(util.inspect(results2, false, null));
                cb(results, results2);
            });

        });
    });

}

function createTemplate(callback) {
    fs.readFile('data/temeljnica.xml', 'utf8', function (err, data) {
        xml2js.parseString(data, function (err, json) {
            callback(json);
        });

    });
}

function createTemeljnica(racun, xmlJson, temeljnicaJson) {

    temeljnicaJson.Temeljnica[0].GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = racun.st_racuna;
    temeljnicaJson.Temeljnica[0].GlavaTemeljnice[0].DatumTemeljnice[0] = racun.datum_racuna;

    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = racun.sifra;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = racun.st_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = racun.datum_racuna;

    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevOsnova[0] = (racun["breme"] - racun["ddv"]).toFixed(2);
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevDDV[0] = racun["ddv"].toFixed(2);

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].OpisVrsticeTemeljnice[0] = racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].SifraStranke[0] = racun.sifra;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumZapadlosti[0] = racun.datum_valute;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumOpravljanja[0] = racun.datum_opravljanja;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].VezaZaPlacilo[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDenarniEnoti[0] = (racun["breme"]).toFixed(2);
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDomaciDenarniEnoti[0] = (racun["breme"]).toFixed(2);

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].OpisVrsticeTemeljnice[0] = racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDenarniEnoti[0] = (racun["breme"] - racun["ddv"]).toFixed(2);
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDomaciDenarniEnoti[0] = (racun["breme"]- racun["ddv"]).toFixed(2);

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].OpisVrsticeTemeljnice[0] = racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDenarniEnoti[0] = racun["ddv"].toFixed(2);
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDomaciDenarniEnoti[0] = racun["ddv"].toFixed(2);

    xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice.push(temeljnicaJson);

    return xmlJson;
}

function createXML(jsonKupci, jsonRacuni, callback) {

    createTemplate(function (jsonTemplate) {

        var xmlJson = clone(jsonTemplate);

        delete xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0];

        var racuni = combineCSV(jsonKupci, jsonRacuni);
        //console.log(util.inspect(racuni, false, null));
        for (var i = 0; i < racuni.length; i++) {
            var temeljnica = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0]);
            xmlJson = createTemeljnica(racuni[i], xmlJson, temeljnica);
        }


        var builder = new xml2js.Builder();

        var xml = builder.buildObject(xmlJson);

        fs.writeFile('data/racuni.xml', xml, function (err) {
            if (err) {
                callback(err);
            }
            callback();
        });
    });
}

function readFiles(csvKupcev, csvRacunov, cb) {
    csvKupcev.mv('data/kupci.csv', function (err) {
        if (err) {
            cb(err);
        }
        csvRacunov.mv('data/racuni.csv', function (err) {
            if (err) {
                cb(err);
            }
            readCSV("data/kupci.csv", "data/racuni.csv", function (jsonKupci, jsonRacuni) {
                createXML(jsonKupci, jsonRacuni, function (err) {
                    if (err) {
                        cb(err);
                    }
                    cb();
                });
            });
        });
    });
}


module.exports = {
    readFiles: readFiles
};





