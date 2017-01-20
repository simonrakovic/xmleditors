/**
 * Created by simon on 24.10.2016.
 */
var fs = require("fs");
var util = require('util');
var moment = require('moment');
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");
var clone = require('clone');
var Converter = require("csvtojson").Converter;
var iconv = require('iconv-lite');


function hasMultipleElements(array, element) {
    //console.log(array);
    for (var i = 0; i < array.length; i++) {
        //console.log(array[i].element +"|"+ element)
        if (array[i].element === element) {
            return true;
        }
    }
    return false;
}


function traverse(x, level, jsonElements, previousElement, parentIndex) {
    if (isArray(x)) {
        traverseArray(x, level, jsonElements, previousElement, parentIndex);
    } else if ((typeof x === 'object') && (x !== null)) {

        traverseObject(x, level, jsonElements, previousElement, parentIndex);
    } else {

    }
}

function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
}

function traverseArray(arr, level, jsonElements, previousElement, parentIndex) {
        var tmp = 0;
        if(previousElement.multiple){
            arr.forEach(function (x) {
                traverse(x, level, jsonElements, previousElement, tmp);
                tmp++;
            });
        }else {
            arr.forEach(function (x) {
                traverse(x, level, jsonElements, previousElement, -1);
            });
        }

}

function traverseObject(obj, level, jsonElements, previousElement, parentIndex) {
    for (var key in obj) {
        if (key == '$')continue;
        if (obj.hasOwnProperty(key)) {
            //console.log(key + ":" + level);
            if (jsonElements[level] == null)jsonElements[level] = [];
            //console.log(key);
            var element = {};

            if(obj[key].length <= 1 && parentIndex != -1){ // sledim indeksom samo na prvi globini, indeks starša samo na prvi globini
                element ={"element": key, "parentElement": previousElement, "multiple": false, "parentIndex":parentIndex};
                jsonElements[level].push(element);
            }else if(obj[key].length <= 1){
                element = {"element": key, "parentElement": previousElement, "multiple": false};
                jsonElements[level].push(element);
            }else{
                element = {"element": key, "parentElement": previousElement, "multiple": true, "length": obj[key].length};
                jsonElements[level].push(element);
            }

            traverse(obj[key], level + 1, jsonElements, element, parentIndex);
        }
    }

    return jsonElements;
}

function getJsonKeys(json) {
    return traverseObject(json, 0, {}, null, -1);
}

//////////////////////////////////////////////////////////////////////////////////////////////
function hasChilldren(x, y) {

    for (var i = 0; i < x.length; i++) {
        for (var j = 0; j < y.length; j++) {
            if (x[i].element == y[j].parentElement.element) {
                x[i] = null;
                break;
            }

        }
    }

}

function getElementData(table) {
    var elementDataTable = clone(getJsonKeys(table));
    var allData = {};
    var allDataMultiple = {};
    for (var key in elementDataTable) {
        if (elementDataTable.hasOwnProperty(parseInt(key) + 1)) {
            hasChilldren(elementDataTable[key], elementDataTable[parseInt(key) + 1]);
        }

    }
    /// zelo požrešna funkcija šeen dvojni for, lahko se izognem ampak je tko bl u izi, niso velki arrayi za obdelavo tako da ni časovno požrešno

    for(var key in elementDataTable){
        if(elementDataTable.hasOwnProperty(key)){
            elementDataTable[key].forEach(function(obj){
                if(obj != null){
                    if(!obj.hasOwnProperty("parentIndex")){
                        if(allData.hasOwnProperty(obj.parentElement.element))allData[obj.parentElement.element].push(obj);
                        else allData[obj.parentElement.element] = [obj]
                    }
                    else{
                        if(allDataMultiple.hasOwnProperty(obj.parentElement.element)){
                            allDataMultiple[obj.parentElement.element].elements.push(obj);
                        }else{
                            allDataMultiple[obj.parentElement.element] = {'elements' : [obj], 'length' : obj.parentElement.length};
                        }
                    }
                }

            });
        }
    }
    return [allData, allDataMultiple];
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////


function readXML(cb, jsonElements, xml) {
    fs.readFile('data/XMLcombiner/temeljnica.xml', 'utf8', function (err, data) {
        if (err)cb(err);
        xml2js.parseString(data, function (err, json) {
            if (err)cb(err);
            var jsonElements = getJsonKeys(json);
            //console.log(util.inspect(jsonElements, false, null));
            cb(err, jsonElements, json);
        });

    });
}

function stepOne(req, res, cb) {
    var treeLevel = req.query.treeLevel;
    var searchedElement = req.query.searchedElement;
    var builder = new xml2js.Builder();


    if (treeLevel != null) {
        res.send(req.session.xmlElements[treeLevel]);
    } else if (searchedElement != null) {
        var searchedJson = xpath.find(req.session.jsonXml, "//" + searchedElement);
        //console.log(searchedJson);
        //console.log(util.inspect({"Temeljnice":searchedJson},false, null));
        var seachedXml = {};
        seachedXml[searchedElement] = searchedJson[0];
        res.send(builder.buildObject(seachedXml));
    } else {
        readXML(function (err, xmlElements, jsonXml) {
            if (err) cb(err);
            req.session.xmlElements = xmlElements;
            req.session.jsonXml = jsonXml;
            //console.log(xmlElements);
            jsonXml = builder.buildObject(jsonXml);

            res.render('XMLcombiner', {
                'xmlElements': xmlElements,
                'xmlElement0': xmlElements[0],
                'xml': jsonXml,
                'step': 1
            });
        });
    }
}

function stepTwo(req, res, cb) {
    var treeLevel = req.query.treeLevel;
    var searchedElement = req.query.searchedElement;
    var builder = new xml2js.Builder();
    if(req.session.jsonXml){
        var searchedJson = xpath.find(req.session.jsonXml, "//" + searchedElement);

        var json2Xml = {};
        json2Xml[searchedElement] = searchedJson[0];
        var data = getElementData(searchedJson);
        //console.log(data[1]);
        res.render('XMLcombiner', {'step': 2, 'elementData': data[0], 'elementDataMultiple': data[1], 'xml': builder.buildObject(json2Xml)});
    }else{
        res.redirect("/xmlcombiner?step=1");
    }

}

function stepTwoPost(req, res, cb) {
    var selectedElements = req.body.selectedElements;
    //console.log(selectedElements);
    req.session.selectedElements = selectedElements;
    res.send({'status': 'success', 'redirectUrl': '/XMLcombiner?step=3'});
}

module.exports = {
    stepOne: stepOne,
    stepTwo: stepTwo,
    stepTwoPost: stepTwoPost
};





