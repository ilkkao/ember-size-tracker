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

    let labels = [];
    let dataPoints = [];
    let dataPointsGzipped = [];
    let previousDate = '';

    dataPoints.push(0);
    dataPointsGzipped.push(0);
    labels.push('');

    for (let revision of _.sortBy(dataArray, 'date')) {
        let date = moment(revision.date).format('MMM D');
        let label = date === previousDate ? '' : date;

        labels.push(label);
        dataPoints.push(parseInt(revision.len));
        dataPointsGzipped.push(parseInt(revision.gzippedLen));

        previousDate = date;
    }
    outputArray.push({
        branch: branch,
        labels: labels,
        dataPoints: dataPoints,
        dataPointsGzipped: dataPointsGzipped
    });
});

let template = fs.readFileSync(htmlTemplate);
let compiled = _.template(template);

let output = compiled({'branches': outputArray});

fs.writeFileSync(htmlFile, output);
