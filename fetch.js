'use strict';

const assert = require('assert'),
      fs = require('fs'),
      path = require('path'),
      GitHubApi = require('github'),
      request = require('superagent');

const github = new GitHubApi({
    version: '3.0.0',
    headers: { 'user-agent': 'Ember-libaray-size-tracker' }
});

const branches = ['canary', 'beta', 'release'];
const baseUrl = 'https://raw.githubusercontent.com/components/ember/';

branches.forEach(function(branch) {
    let dataFile = path.join(__dirname, `ember-sizes-${branch}.json`);
    let knownCommits;
    let fetchesLeft = 0;

    try {
        knownCommits = JSON.parse(fs.readFileSync(dataFile));
    } catch(e) {
        knownCommits = {};
    }

    github.repos.getCommits({
        user: 'components',
        repo: 'ember',
        page: 1,
        sha: branch,
        path: 'ember.min.js',
        per_page: 100
    }, function(err, res) {
        for (let item of res) {
            let sha = item.sha;
            let date = item.commit.author.date;

            if (!knownCommits[sha]) {
                fetchesLeft++;

                getSizes(`${baseUrl}${sha}/ember.min.js`, function(len, gzippedLen) {
                    fetchesLeft--;

                    knownCommits[sha] = { date: date, len: len, gzippedLen: gzippedLen };
                    console.log(`! Fetched sizes of revision: ${sha} (${date})`);
                    console.log(`    plain: ${len} bytes`);
                    console.log(`    gzipped: ${gzippedLen} bytes`);

                    if (!fetchesLeft) {
                        console.log('Saving updated data file');
                        fs.writeFileSync(dataFile, JSON.stringify(knownCommits, null, 2));
                    }
                });
            }
        }
    });
});

function getSizes(url, cb) {
    let len;
    let gzippedLen;
    let encoding;

    request.head(url).end(function(err, res) {
        len = res.header['content-length'];
        encoding = res.header['content-encoding'];

        if (encoding !== undefined) {
            console.log(`ERROR: Unexpected encoding, expected none: ${encoding}`);
        }

        request.head(url).set('Accept-Encoding', 'gzip, deflate').end(function(err, res) {
            gzippedLen = res.header['content-length'];
            encoding = res.header['content-encoding'];

            if (encoding !== 'gzip') {
               console.log(`ERROR: Unexpected encoding, expected none: ${encoding}`);
            }

            cb(len, gzippedLen);
        });
    });
}
