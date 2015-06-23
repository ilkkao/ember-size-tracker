'use strict';

const fs = require('fs'),
      path = require('path'),
      _ = require('lodash'),
      moment = require('moment');

const branches = [ 'release', 'beta', 'canary' ];
const htmlTemplate = path.join(__dirname, 'index.template');
const htmlFile = path.join(__dirname, 'index.html');

let outputArray = [];

branches.forEach(function(branch) {
    let dataFile = path.join(__dirname, `ember-sizes-${branch}.json`);

    let data = JSON.parse(fs.readFileSync(dataFile));
    let dataArray = [];

    for (let revision of Object.keys(data)) {
        dataArray.push(data[revision]);
    }

    let timeStamps = [];
    let dataPoints = [];
    let dataPointsGzipped = [];

    dataPoints.push(0);
    dataPointsGzipped.push(0);
    labels.push('');

    for (let revision of _.sortBy(dataArray, 'date')) {
        let unixTime = moment(revision.date).unix() * 1000;

        dataPoints.push({ x: unixTime, y: parseInt(revision.len) });
        dataPointsGzipped.push({ x: unixTime, y: parseInt(revision.gzippedLen) });
    }

    outputArray.push({
        branch: branch,
        timeStamps: timeStamps,
        dataPoints: dataPoints,
        dataPointsGzipped: dataPointsGzipped
    });
});

let template = fs.readFileSync(htmlTemplate);
let compiled = _.template(template);

let output = compiled({'branches': outputArray});

fs.writeFileSync(htmlFile, output);
