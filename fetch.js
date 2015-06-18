'use strict';

const fs = require('fs'),
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

              request.head(`${baseUrl}${sha}/ember.min.js`).end(function(err, res) {
                  let len = res.header['content-length'];
                  knownCommits[sha] = { date: date, len: len };

                  console.log(`Fetched size of revision: ${sha} (${date})`);
                  fetchesLeft--;

                  if (!fetchesLeft) {
                      console.log('Saving updated data file');
                      fs.writeFileSync(dataFile, JSON.stringify(knownCommits));
                  }
              });
          }
      }
  });
});
