'use strict';

const fs = require('fs'),
      path = require('path'),
      _ = require('lodash'),
      moment = require('moment');

const branches = [ 'release', 'beta', 'canary' ];

const trackingPeriods = {
    release: moment.duration(3, 'years'),
    beta: moment.duration(2, 'months'),
    canary: moment.duration(2, 'months')
};

const htmlTemplate = path.join(__dirname, 'index.template');
const htmlFile = path.join(__dirname, 'index.html');

let outputArray = [];

branches.forEach(function(branch) {
    let dataFile = path.join(__dirname, `ember-sizes-${branch}.json`);

    let data = JSON.parse(fs.readFileSync(dataFile));
    let timeStamps = [];
    let dataPoints = [];
    let dataPointsGzipped = [];
    let periodStart = moment().subtract(trackingPeriods[branch]);

    for (let revision of _.sortBy(_.values(data), 'date')) {
        if (moment(revision.date) < periodStart) {
            continue;
        }

        let unixTs = moment(revision.date).valueOf();
        dataPoints.push({ x: unixTs, y: parseInt(revision.len) });
        dataPointsGzipped.push({ x: unixTs, y: parseInt(revision.gzippedLen) });
    }

    // Add a dummy point to make sure data period is exact
    dataPoints.unshift({ x: periodStart.valueOf(), y: dataPoints[0].y });
    dataPointsGzipped.unshift({ x: periodStart.valueOf(), y: dataPointsGzipped[0].y });

    outputArray.push({
        branch: branch,
        timeStamps: timeStamps,
        dataPoints: dataPoints,
        dataPointsGzipped: dataPointsGzipped,
        trackingPeriod: branch === 'release' ? '3 years' : '2 months'
    });
});

let template = fs.readFileSync(htmlTemplate);
let compiled = _.template(template);

let output = compiled({'branches': outputArray});

fs.writeFileSync(htmlFile, output);
