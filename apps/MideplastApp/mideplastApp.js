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

            return String(jsonKupci[i]["Davčna številka"]);
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

            racun["datum_racuna"] = moment(jsonRacuni[i]["Datum"], 'DD.MM.YYYY').format('YYYY-MM-DD');
            racun["datum_opravljanja"] = moment(jsonRacuni[i]["Datum pošilj"][""], 'DD.MM.YYYY').format('YYYY-MM-DD');
            racun["datum_valute"] = moment( jsonRacuni[i]["Zapade"], 'DD.MM.YYYY').format('YYYY-MM-DD');
            var iddv = findKupec(jsonKupci, jsonRacuni[i]);
            if(!(/SI/g).test(iddv)){
                racun["sifra"] = iddv;
                racun["tujina"] = true;
            }else{
                racun["sifra"] = iddv.replace('SI','');
                racun["tujina"] = false;
            }
            console.log(jsonRacuni[i]["Znesek terjatev"]);
            racun["breme"] = parseFloat(String(jsonRacuni[i]["Znesek terjatev"]).replace(',','.'));

            if(jsonRacuni[i]["Konto GK"] == "260000"){
                racun["ddv"] = parseFloat(String(jsonRacuni[i]["Znesek"]).replace('-','').replace(',','.'));
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

            racun["datum_racuna"] = moment(jsonRacuni[i]["Datum"], 'DD.MM.YYYY').format('YYYY-MM-DD');
            racun["datum_opravljanja"] = moment(jsonRacuni[i]["Datum pošilj"][""], 'DD.MM.YYYY').format('YYYY-MM-DD');
            racun["datum_valute"] = moment( jsonRacuni[i]["Zapade"], 'DD.MM.YYYY').format('YYYY-MM-DD');

            var iddv = findKupec(jsonKupci, jsonRacuni[i]);
            if(!(/SI/g).test(iddv)){
                racun["sifra"] = iddv;
                racun["tujina"] = true;
            }else{
                racun["sifra"] = iddv.replace('SI','');
                racun["tujina"] = false;
            }

            racun["breme"] = parseFloat(String(jsonRacuni[i]["Znesek terjatev"]).replace(',','.'));

            if(jsonRacuni[i]["Konto GK"] == "260000"){
                racun["ddv"] = parseFloat(String(jsonRacuni[i]["Znesek"]).replace('-','').replace(',','.'));
            }
            currentInvNum = jsonRacuni[i]["Št"]["računa"];
        }

        if(i + 1 === jsonRacuni.length)racuni.push(clone(racun));

    }
    //console.log(racuni);
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

function getInvoiceData(racun, data){
  if(racun.tujina){
    data.tujine = data.tujine + 1;
    data.racuni = data.racuni + 1;
    data.osnova_tujina = data.osnova_tujina + parseFloat(racun["breme"]);

  }else if((/DBR/g).test(racun.st_racuna)){
    data.racuni = data.racuni + 1;
    data.dobropisi = data.dobropisi + 1;
    data.osnova = data.osnova + parseFloat(racun["breme"]) + parseFloat(racun["ddv"]);
    data.ddv = data.ddv - parseFloat(racun["ddv"]);

  }else{
    data.racuni = data.racuni + 1;
    data.osnova = data.osnova + parseFloat(racun["breme"]) - parseFloat(racun["ddv"]);
    data.ddv = data.ddv + parseFloat(racun["ddv"])
  }

  return data;
}

function createTemeljnica(racun, temeljnica) {
    var temeljnicaJson = clone(temeljnica);

    if(racun.tujina){

        temeljnicaJson.GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.GlavaTemeljnice[0].DatumTemeljnice[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = racun.st_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevOsnova[0] = racun["breme"].toFixed(2);
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevDDV[0] = 0;

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumZapadlosti[0] = racun.datum_valute;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumOpravljanja[0] = racun.datum_opravljanja;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].VezaZaPlacilo[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDenarniEnoti[0] = (racun["breme"]).toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDomaciDenarniEnoti[0] = (racun["breme"]).toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].SifraKonta[0] = 76111;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDenarniEnoti[0] = racun["breme"].toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDomaciDenarniEnoti[0] = racun["breme"].toFixed(2);

        delete temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2];


    }else if((/DBR/g).test(racun.st_racuna)){

        temeljnicaJson.GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.GlavaTemeljnice[0].DatumTemeljnice[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = racun.st_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevOsnova[0] = ((racun["breme"] + racun["ddv"]).toFixed(2));
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevDDV[0] = -racun["ddv"].toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumZapadlosti[0] = racun.datum_valute;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumOpravljanja[0] = racun.datum_opravljanja;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].VezaZaPlacilo[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDenarniEnoti[0] = (racun["breme"]).toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDomaciDenarniEnoti[0] = (racun["breme"]).toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDenarniEnoti[0] = ((racun["breme"] + racun["ddv"]).toFixed(2));
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDomaciDenarniEnoti[0] = ((racun["breme"] + racun["ddv"]).toFixed(2));

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDenarniEnoti[0] = -racun["ddv"].toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDomaciDenarniEnoti[0] = -racun["ddv"].toFixed(2);

    }else{

        temeljnicaJson.GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.GlavaTemeljnice[0].DatumTemeljnice[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = racun.datum_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = racun.st_racuna;
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = racun.datum_racuna;

        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevOsnova[0] = (racun["breme"] - racun["ddv"]).toFixed(2);
        temeljnicaJson.DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].StoritevDDV[0] = racun["ddv"].toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].SifraStranke[0] = racun.sifra;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumZapadlosti[0] = racun.datum_valute;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].DatumOpravljanja[0] = racun.datum_opravljanja;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].VezaZaPlacilo[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDenarniEnoti[0] = (racun["breme"]).toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[0].ZnesekVBremeVDomaciDenarniEnoti[0] = (racun["breme"]).toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDenarniEnoti[0] = (racun["breme"] - racun["ddv"]).toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[1].ZnesekVDobroVDomaciDenarniEnoti[0] = (racun["breme"]- racun["ddv"]).toFixed(2);

        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].DatumKnjizbe[0] = racun.datum_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].OpisVrsticeTemeljnice[0] = racun.st_racuna;
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDenarniEnoti[0] = racun["ddv"].toFixed(2);
        temeljnicaJson.VrsticeTemeljnice[0].VrsticaTemeljnice[2].ZnesekVDobroVDomaciDenarniEnoti[0] = racun["ddv"].toFixed(2);

    }


    return temeljnicaJson;
}

function createXML(jsonKupci, jsonRacuni, callback) {

    createTemplate(function (jsonTemplate) {

        var xmlJson = clone(jsonTemplate);
        delete xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0];
        var racuni = combineCSV(jsonKupci, jsonRacuni);
        //console.log(racuni);
        var temeljnicaJson = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0]);

        var temeljinice = [];
        var racuniLastnosti = {
          "tujine": 0,
          "dobropisi": 0,
          "racuni": 0,
          "osnova": 0.00,
          "ddv": 0.00,
          "osnova_tujina": 0.00,

        };
        for (var i = 0; i < racuni.length; i++) {
            racuniLastnosti = getInvoiceData(racuni[i], racuniLastnosti);
            temeljinice.push(createTemeljnica(racuni[i], temeljnicaJson));
        }

        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice =  {"Temeljnica":temeljinice};
        //console.log(util.inspect(xmlJson, false, null));
        var builder = new xml2js.Builder();

        var xml = builder.buildObject(xmlJson);

        fs.writeFile('public/racuni.xml', xml, function (err) {
            if (err) {
                callback(err);
            }else{
              callback(err, 'public/racuni.xml' ,racuniLastnosti);
            }
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
                //console.log(jsonKupci);
                createXML(jsonKupci, jsonRacuni, function (err, url, racuniLastnosti) {
                    if (err) {
                        cb(err);
                    }else{
                      cb(err, url, racuniLastnosti);
                    }
                });
            });
        });
    });
}


module.exports = {
    readFiles: readFiles
};
