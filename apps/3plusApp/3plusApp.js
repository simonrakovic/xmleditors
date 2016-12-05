/**
 * Created by simon on 24.10.2016.
 */
var fs = require("fs");
var util = require('util')
var moment = require('moment');
var xml2js = require("xml2js");
var clone = require('clone');
var Converter = require("csvtojson").Converter;




function createTemplate(callback) {
    fs.readFile('data/3plus/temeljnicaFT.xml', 'utf8', function (err, data) {
        xml2js.parseString(data, function (err, json) {
            callback(json);
        });

    });
}

function readFiles(textData, totalValue, taxValue, desc, shopID, date, cb) {
    date = moment(date, 'DD.MM.YYYY').format('YYYY-MM-DD');

    var textLines = textData.split('\n');
    var jsonData = {};

    var textLineKeys = textLines[0].split('\t');
    var textLineValues = textLines[1].split('\t');
    for (var i = 0; i < textLineKeys.length; i++) {
        if (parseInt(textLineValues[i]) != 0 && textLineKeys[i] != '')

            jsonData[textLineKeys[i]] = textLineValues[i].replace(',','');
    }

    createTemplate(function (jsonTemplate) {

        var xmlJson = clone(jsonTemplate);
        delete xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice;

        var trgovineSifra= {'002':'100002','003':'100001','004':'100003','006':'100007'};

        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].GlavaTemeljnice[0].OpisGlaveTemeljnice[0] = desc;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].GlavaTemeljnice[0].DatumTemeljnice[0] = date;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumDDV[0] = date;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumKnjizenjaDDV[0] = date;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].SifraStranke[0] = trgovineSifra[shopID];
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].Listina[0] = desc;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVGlava[0].DatumListine[0] = date;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].Osnova[0] = totalValue;
        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].DDV[0].DDVVrstica[0].DDVStopnje[0].DDVStopnja[0].DDV[0] = taxValue;

        var postavkeStranke = {
            'BA KARTICA': '100008',
            'MAESTRO': '100008',
            'MASTERCARD': '100009',
            'DINERS': '100010',
            'AMEX': '100011',
            'VISA': '100012',
            'KARANTA': '100013',
            'ACTIVA': '100014',
            'BONI-BTC': '100016',
            'BONI-RUDNIK': '100015',
            'BONI-CELJE': '',
            'BONI-DOMZAZE': '',
            'GOTOVINA-BTC': '100001',
            'GOTOVINA-RUDNIK': '100003',
            'GOTOVINA-CELJE': '100007',
            'GOTOVINA-DOMZAZE': '100002'
        };

        var kontoPostavke = {'DARILNI BONI': '75702', 'DRUGO': '75701', 'IZRAVNAVA': '75700'};

        //console.log(util.inspect(vrsticaTemeljnice, false, null));
        //console.log(util.inspect(vrsticaTemeljnice, false, null));
        var vrsticeTemepljnice = [];
        for(var key in jsonData){
            var vrsticaTemeljnice = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0]);
            if(key in postavkeStranke){

                vrsticaTemeljnice.DatumKnjizbe[0] = date;
                vrsticaTemeljnice.OpisVrsticeTemeljnice[0] = desc;

                vrsticaTemeljnice.SifraStranke[0] = postavkeStranke[key];
                vrsticaTemeljnice.DatumZapadlosti[0] = date;
                vrsticaTemeljnice.DatumOpravljanja[0] = date;
                vrsticaTemeljnice.VezaZaPlacilo[0] = date;
                vrsticaTemeljnice.ZnesekVBremeVDenarniEnoti[0] = jsonData[key];
                vrsticaTemeljnice.ZnesekVBremeVDomaciDenarniEnoti[0] = jsonData[key];
                delete vrsticaTemeljnice.ZnesekVDobroVDenarniEnoti[0];
                delete vrsticaTemeljnice.ZnesekVDobroVDomaciDenarniEnoti[0];
                vrsticaTemeljnice.SifraAnalitike[0] = shopID;

                vrsticeTemepljnice.push(vrsticaTemeljnice);


            }else if(key in kontoPostavke){

                vrsticaTemeljnice.DatumKnjizbe[0] = date;
                vrsticaTemeljnice.OpisVrsticeTemeljnice[0] = desc;
                delete vrsticaTemeljnice.SifraStranke[0];
                delete vrsticaTemeljnice.DatumZapadlosti[0];
                delete vrsticaTemeljnice.DatumOpravljanja[0];
                delete vrsticaTemeljnice.VezaZaPlacilo[0];
                vrsticaTemeljnice.ZnesekVBremeVDenarniEnoti[0] = jsonData[key];
                vrsticaTemeljnice.ZnesekVBremeVDomaciDenarniEnoti[0] = jsonData[key];
                delete vrsticaTemeljnice.ZnesekVDobroVDenarniEnoti[0];
                delete vrsticaTemeljnice.ZnesekVDobroVDomaciDenarniEnoti[0];
                vrsticaTemeljnice.SifraKonta[0] = kontoPostavke[key];
                vrsticaTemeljnice.SifraAnalitike[0] = shopID;

                vrsticeTemepljnice.push(vrsticaTemeljnice);

            }
        }

        //console.log(util.inspect(vrsticaTemeljnice, false, null));

        var vrsticaTemeljniceOsnova = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0]);
        vrsticaTemeljniceOsnova.DatumKnjizbe[0] = date;
        vrsticaTemeljniceOsnova.OpisVrsticeTemeljnice[0] = desc;
        delete vrsticaTemeljniceOsnova.SifraStranke[0];
        delete vrsticaTemeljniceOsnova.DatumZapadlosti[0];
        delete vrsticaTemeljniceOsnova.DatumOpravljanja[0];
        delete vrsticaTemeljniceOsnova.VezaZaPlacilo[0];
        vrsticaTemeljniceOsnova.ZnesekVDobroVDenarniEnoti[0] = totalValue;
        vrsticaTemeljniceOsnova.ZnesekVDobroVDomaciDenarniEnoti[0] = totalValue;
        delete vrsticaTemeljniceOsnova.ZnesekVBremeVDenarniEnoti[0];
        delete vrsticaTemeljniceOsnova.ZnesekVBremeVDomaciDenarniEnoti[0];
        vrsticaTemeljniceOsnova.SifraKonta[0] = '76201';
        vrsticaTemeljniceOsnova.SifraAnalitike[0] = shopID;
        vrsticeTemepljnice.push(vrsticaTemeljniceOsnova);

        var vrsticaTemeljniceDDV = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0]);
        vrsticaTemeljniceDDV.DatumKnjizbe[0] = date;
        vrsticaTemeljniceDDV.OpisVrsticeTemeljnice[0] = desc;
        delete vrsticaTemeljniceDDV.SifraStranke[0];
        delete vrsticaTemeljniceDDV.DatumZapadlosti[0];
        delete vrsticaTemeljniceDDV.DatumOpravljanja[0];
        delete vrsticaTemeljniceDDV.VezaZaPlacilo[0];
        vrsticaTemeljniceDDV.ZnesekVDobroVDenarniEnoti[0] = taxValue;
        vrsticaTemeljniceDDV.ZnesekVDobroVDomaciDenarniEnoti[0] = taxValue;
        delete vrsticaTemeljniceDDV.ZnesekVBremeVDenarniEnoti[0];
        delete vrsticaTemeljniceDDV.ZnesekVBremeVDomaciDenarniEnoti[0];
        vrsticaTemeljniceDDV.SifraKonta[0] = '26002';
        vrsticaTemeljniceDDV.SifraAnalitike[0] = shopID;
        vrsticeTemepljnice.push(vrsticaTemeljniceDDV);

        var izravnava = (parseFloat(taxValue) + parseFloat(totalValue)) - parseFloat(jsonData['SKUPAJ'].replace(',',''));

        if(izravnava != 0){
            var vrsticaTemeljniceIzravnava = clone(jsonTemplate.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice[0].VrsticaTemeljnice[0]);
            vrsticaTemeljniceIzravnava.DatumKnjizbe[0] = date;
            vrsticaTemeljniceIzravnava.OpisVrsticeTemeljnice[0] = desc;
            delete vrsticaTemeljniceIzravnava.SifraStranke[0];
            delete vrsticaTemeljniceIzravnava.DatumZapadlosti[0];
            delete vrsticaTemeljniceIzravnava.DatumOpravljanja[0];
            delete vrsticaTemeljniceIzravnava.VezaZaPlacilo[0];
            vrsticaTemeljniceIzravnava.ZnesekVBremeVDenarniEnoti[0] = izravnava.toFixed(2);
            vrsticaTemeljniceIzravnava.ZnesekVBremeVDomaciDenarniEnoti[0] = izravnava.toFixed(2);
            delete vrsticaTemeljniceIzravnava.ZnesekVDobroVDenarniEnoti[0];
            delete vrsticaTemeljniceIzravnava.ZnesekVDobroVDomaciDenarniEnoti[0];
            vrsticaTemeljniceIzravnava.SifraKonta[0] = '75700';
            vrsticaTemeljniceIzravnava.SifraAnalitike[0] = shopID;
            vrsticeTemepljnice.push(vrsticaTemeljniceIzravnava);

        }

        xmlJson.miniMAXUvozKnjigovodstvo.Temeljnice[0].Temeljnica[0].VrsticeTemeljnice = {'VrsticaTemeljnice':vrsticeTemepljnice};

        var builder = new xml2js.Builder();

        var xml = builder.buildObject(xmlJson);

        fs.writeFile('data/3plus/temeljnicaOut.xml', xml, function (err) {
            if (err) {
                cb(err);
            }
            cb();
        });

    });


}


module.exports = {
    readFiles: readFiles
};





