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

//////////////////////////////////////////////////////////////////////////////////////////////
function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}

function findObjectTraverseArray(arr, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects) {

    if (arr.length > 1) {
        var index = 0;
        arr.forEach(function (x) {
            prevElement["parentIndex"] = index;
            findObjectTraverse(x, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects);
            index++;
        });
    } else {
        arr.forEach(function (x) {
            findObjectTraverse(x, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects);
        });
    }

}

function findObjectTraverse(x, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects) {
    if (isArray(x)) {
        findObjectTraverseArray(x, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects);
    } else if ((typeof x === 'object') && (x !== null)) {
        findObject(x, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects);
    } else {
        for (var i = 0; i < selectedElementsData.length; i++) {
            if (selectedElementsData[i].hasOwnProperty('parentIndex')) {
                //console.log(util.inspect(prevElement,false, null));
                if (selectedElementsData[i].parentElement == prevElement.parentElement.element && selectedElementsData[i].element == prevElement.element && prevElement.parentElement.parentIndex == selectedElementsData[i].parentIndex) {
                    //console.log(selectedElementsData[i].elementData);
                    //prevObj[prevElement.element] = [selectedElementsData[i].elementData];

                    selectedElementXmlObjects.push({"xmlObject": prevObj, "objectKey": prevElement.element, "dataIndex": selectedElementsData[i].elementData});
                }
            } else {
                if (selectedElementsData[i].parentElement == prevElement.parentElement.element && selectedElementsData[i].element == prevElement.element) {
                    //console.log(selectedElementsData[i].elementData);
                    //prevObj[prevElement.element] = [selectedElementsData[i].elementData];

                    selectedElementXmlObjects.push({"xmlObject": prevObj, "objectKey": prevElement.element, "dataIndex": selectedElementsData[i].elementData});
                }
            }

        }
    }
}

function findObject(json, prevObj, prevElement, selectedElementsData, selectedElementXmlObjects) {

    for (var key in json) {
        if (key == '$')continue;
        if (json.hasOwnProperty(key)) {

            findObjectTraverse(json[key], json, {"element": key, "parentElement": prevElement}, selectedElementsData, selectedElementXmlObjects);
        }
    }

    return selectedElementXmlObjects;
}


function editJsonXml(selectedElementsData, xmlJson, rootXmlElement, cb) {
    //console.log(util.inspect(selectedElementsData, false, null));
    var searchedXml =xpath.find(xmlJson, "//" + rootXmlElement);
    var selectedElementXmlObjects = findObject(searchedXml, null, null, selectedElementsData, []);


    console.log(util.inspect(selectedElementXmlObjects[0], false, null));
    cb(xmlJson);

}


///////////////////////////////////////////////////////////////////////////////////////////

function traverse(x, prevObj, level, jsonElements, previousElement, parentIndex) {
    if (isArray(x)) {
        traverseArray(x, prevObj, level, jsonElements, previousElement, parentIndex);
    } else if ((typeof x === 'object') && (x !== null)) {

        traverseObject(x, prevObj, level, jsonElements, previousElement, parentIndex);
    } else {
        previousElement['isData'] = true;
    }
}

function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
}

function traverseArray(arr, prevObj, level, jsonElements, previousElement, parentIndex) {
    var tmp = 0;
    if (previousElement.multiple) {
        arr.forEach(function (x) {
            traverse(x, prevObj, level, jsonElements, previousElement, tmp);
            tmp++;
        });
    } else {
        arr.forEach(function (x) {
            traverse(x, prevObj, level, jsonElements, previousElement, -1);
        });
    }

}

function traverseObject(obj, prevObj, level, jsonElements, previousElement, parentIndex) {
    for (var key in obj) {
        if (key == '$')continue;
        if (obj.hasOwnProperty(key)) {
            //console.log(key + ":" + level);
            if (jsonElements[level] == null)jsonElements[level] = [];
            //console.log(key);
            var element = {};

            if (obj[key].length <= 1 && parentIndex != -1) { // sledim indeksom samo na prvi globini, indeks starša samo na prvi globini
                element = {
                    "element": key,
                    "parentElement": previousElement,
                    "multiple": false,
                    "parentIndex": parentIndex
                };
                jsonElements[level].push(element);
            } else if (obj[key].length <= 1) {
                element = {"element": key, "parentElement": previousElement, "multiple": false};
                jsonElements[level].push(element);
            } else {
                element = {
                    "element": key,
                    "parentElement": previousElement,
                    "multiple": true,
                    "length": obj[key].length
                };
                jsonElements[level].push(element);

            }

            traverse(obj[key], obj, level + 1, jsonElements, element, parentIndex);
        }
    }

    return jsonElements;
}

function getJsonKeys(json) {
    return traverseObject(json, null, 0, {}, null, -1);
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

    for (var key in elementDataTable) {
        if (elementDataTable.hasOwnProperty(key)) {
            elementDataTable[key].forEach(function (obj) {
                if (obj != null) {
                    if (!obj.hasOwnProperty("parentIndex")) {
                        if (allData.hasOwnProperty(obj.parentElement.element))allData[obj.parentElement.element].push(obj);
                        else allData[obj.parentElement.element] = [obj]
                    }
                    else {
                        if (allDataMultiple.hasOwnProperty(obj.parentElement.element)) {
                            allDataMultiple[obj.parentElement.element].elements.push(obj);
                        } else {
                            allDataMultiple[obj.parentElement.element] = {
                                'elements': [obj],
                                'length': obj.parentElement.length
                            };
                        }
                    }
                }

            });
        }
    }
    return [allData, allDataMultiple];
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
function convertToUTF(csvPath, cb) {
    fs.readFile(csvPath, function (err, buffer1) {
        if (err) cb(err);
        cb(iconv.decode(buffer1, 'win1250'));
    });
}

function readCsv(cb) {
    var converter = new Converter({delimiter: ';'});
    convertToUTF("data/XMLcombiner/temp/csvFile.csv", function (data) {
        converter.fromString(data, function (err, results) {
            if (err)cb(err);
            cb(err, results);
        });
    });
}

function readXML(cb, xml) {
    fs.readFile('data/XMLcombiner/temp/xmlFile.xml', 'utf8', function (err, data) {
        if (err)cb(err);
        xml2js.parseString(data, function (err, json) {
            if (err)cb(err);
            cb(err, json);

        });

    });
}

function filesToJSON(cb) {
    readXML(function (err, jsonXml) {
        if (err)cb(err);
        readCsv(function (err, jsonCsv) {
            if (err)cb(err);
            //console.log(jsonCsv);
            cb(err, jsonXml, jsonCsv);
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
        req.session.rootXmlElement = searchedElement;
        var searchedJson = xpath.find(req.session.jsonXml, "//" + searchedElement);
        //console.log(searchedJson);
        //console.log(util.inspect({"Temeljnice":searchedJson},false, null));
        var seachedXml = {};
        seachedXml[searchedElement] = searchedJson[0];
        res.send(builder.buildObject(seachedXml));
    } else {
        filesToJSON(function (err, jsonXml, jsonCsv) {
            if (err) cb(err);
            var xmlElements = getJsonKeys(jsonXml);
            req.session.xmlElements = xmlElements;
            req.session.jsonXml = jsonXml;
            req.session.jsonCsv = jsonCsv;

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
    if (req.session.jsonXml) {
        var searchedJson = xpath.find(req.session.jsonXml, "//" + searchedElement);

        var json2Xml = {};
        json2Xml[searchedElement] = searchedJson[0];
        var data = getElementData(req.session.jsonXml);
        //console.log(data[0]);
        res.render('XMLcombiner', {
            'step': 2,
            'elementData': data[0],
            'elementDataMultiple': data[1],
            'xml': builder.buildObject(json2Xml)
        });
    } else {
        res.redirect("/xmlcombiner/?step=1");
    }

}

function stepTwoPost(req, res, cb) {
    var selectedElements = req.body.selectedElements;
    //console.log(selectedElements);
    req.session.selectedElements = selectedElements;
    res.send({'status': 'success', 'redirectUrl': '/XMLcombiner/?step=3'});
}

function stepThree(req, res, cb) {
    var selectedElements = req.session.selectedElements,
        jsonCvs = req.session.jsonCsv,
        csvElementKeys = [];

    for (var key in jsonCvs[0]) {
        csvElementKeys.push(key);
    }

    res.render('XMLcombiner', {'step': 3, 'selectedElements': selectedElements, 'csvElementKeys': csvElementKeys});
}

function stepThreePost(req, res, cb) {
    //console.log(req.body.selectedElementsData);
    editJsonXml(req.body.selectedElementsData, req.session.jsonXml, req.session.rootXmlElement,function (jsonXml) {
        //console.log(util.inspect(jsonxml,false, null));
        req.session.jsonXml = jsonXml;
        res.send({'status': 'success', 'redirectUrl': '/XMLcombiner/?step=4'});
    });
}

function stepFour(req, res, cb) {
    var jsonxml = req.session.jsonXml;
    var builder = new xml2js.Builder();

    res.render('XMLcombiner', {'step': 4, 'xml': builder.buildObject(jsonxml)});
}

module.exports = {
    stepOne: stepOne,
    stepTwo: stepTwo,
    stepTwoPost: stepTwoPost,
    stepThree: stepThree,
    stepThreePost: stepThreePost,
    stepFour: stepFour
};





