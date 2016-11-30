/**
 * Created by simon on 24.10.2016.
 */
var fs = require("fs");
var util = require('util')
var moment = require('moment');
var xml2js = require("xml2js");
var clone = require('clone');
var Converter = require("csvtojson").Converter;




function findKupec(jsonKupci,jsonRacun){
    // poisci id_ddv kupca racuna
    // vrne json
    var racun = {"sifra":"", "st_racuna":"", "datum_racuna":"", "datum_opravljanja":"", "datum_valute":"", "znesek_breme":0};

    for(var i = 0;i < jsonKupci.length;i++){
        if(jsonKupci[i]["Šifra kupca"] === jsonRacun["Šifra kupca"]){
            racun["sifra"] = jsonKupci[i]["Davčna številka"];
            racun["st_racuna"] = jsonRacun["Št"]["računa"];
            racun["datum_racuna"] = jsonRacun["Datum"];
            racun["datum_opravljanja"] = jsonRacun["Datum pošilj"][""];
            racun["datum_valute"] = jsonRacun["Zapade"];
            racun["znesek_breme"] = parseFloat(jsonRacun["Znesek terjatev"]);
        }
    }
    return racun;
}


function combineCSV(jsonKupci,jsonRacuni){
    var racuni = [];
    for(var i = 0; i < jsonRacuni.length; i++){
        racuni.push(findKupec(jsonKupci, jsonRacuni[i]));
    }
    return racuni;
}

function readCSV(csv1path, csv2path, cb){
    var converter = new Converter({delimiter: ';',});
    converter.fromFile(csv1path, function (err, results) {
        var converter2 = new Converter({delimiter: ';',});
        converter2.fromFile(csv2path, function (err, results2) {
            cb(results,results2);
        });
    });
}

function createTemplate(callback){
    fs.readFile('data/temeljnica.xml', 'utf8', function (err, data) {
        xml2js.parseString(data, function (err, json) {
            callback(json);
        });

    });
}

function createTemeljnica(racun,xmlJson, temeljnicaJson){

    temeljnicaJson.Temeljnica[0].GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = "IR:" + racun.st_racuna;
    temeljnicaJson.Temeljnica[0].GlavaTemeljnice[0].DatumTemeljnice[0] =  racun.datum_racuna;

    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = racun.sifra;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = "IR:" + racun.st_racuna;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = racun.datum_racuna;

    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevOsnova[0] = racun.znesek_breme / 1.22;
    temeljnicaJson.Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevDDV[0] = racun.znesek_breme - racun.znesek_breme / 1.22;

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].OpisVrsticeTemeljnice[0] = "IR:" + racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].SifraStranke[0] = racun.sifra;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumZapadlosti[0] = racun.datum_valute;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumOpravljanja[0] = racun.datum_opravljanja;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].VezaZaPlacilo[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDenarniEnoti[0] = racun.znesek_breme;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDomaciDenarniEnoti[0] = racun.znesek_breme;

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].OpisVrsticeTemeljnice[0] = "IR:" + racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDenarniEnoti[0] = racun.znesek_breme / 1.22;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDomaciDenarniEnoti[0] = racun.znesek_breme / 1.22;

    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].DatumKnjizbe[0] = racun.datum_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].OpisVrsticeTemeljnice[0] = "IR:" + racun.st_racuna;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDenarniEnoti[0] =  racun.znesek_breme - racun.znesek_breme / 1.22;
    temeljnicaJson.Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDomaciDenarniEnoti[0] =  racun.znesek_breme - racun.znesek_breme / 1.22;

    xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice.push(temeljnicaJson);

    return xmlJson;
}

function createXML(jsonKupci,jsonRacuni, callback){

    createTemplate(function(jsonTemplate){

        var xmlJson = clone(jsonTemplate);
        delete xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0];

        var racuni = combineCSV(jsonKupci, jsonRacuni);

        for(var i = 0;i < racuni.length;i++){
            var temeljnica = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0]);
            xmlJson = createTemeljnica(racuni[i], xmlJson, temeljnica);
        }

        //console.log(util.inspect(xmlJson, false, null))

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

function readFiles(csvKupcev, csvRacunov, cb){
    csvKupcev.mv('data/kupci.csv', function (err) {
        if (err) {
            cb(err);
        }
        csvRacunov.mv('data/racuni.csv', function (err) {
            if (err) {
                cb(err);
            }
            readCSV("data/kupciUTF.csv","data/racuniUTF.csv", function(jsonKupci, jsonRacuni){
                createXML(jsonKupci, jsonRacuni, function(err){
                    if(err){
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





