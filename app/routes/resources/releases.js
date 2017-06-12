const async = require('async');
const request = require('request');
const sqlHelper = require('../../sqlHelper');
const jsonHelper = require('../../jsonHelper');

module.exports = (apiRouter, AppConfig) => {

  //http://localhost:8081
  const AppUrl = `${AppConfig.url}:${AppConfig.port}`;

  // FOR RELEASES
  // routing for your_url/api/releases request
  apiRouter.route('/releases')

  // GET all requests your_url/api/requests
    .get((req, res) => {

    let query = 'SELECT * FROM brm.dbo.Releases';

    console.log(query);

    // if url has a query parameter
    // e.g. api/releases?projectID=2
    // append to the mssql query
    const projectID = req.query.projectID;

    if (projectID) {
      query += ` WHERE projectID = ${projectID}`;
    }

    //connect to your database & return json response
    sqlHelper.queryDB(query, jsonHelper(res).callback, jsonHelper(res).error, 'read');
  });

  // FOR RELEASES
  // routing for your_url/api/releases request
  apiRouter.route('/releases/:release_id').get((req, res) => {

    let releaseId = req.params.release_id;

    // if url has a query parameter
    // e.g. api/releases/1?complete=true
    // append to the mssql query
    // This is to aggregate all Release values in one JSON response
    const isQueryForComplete = req.query.complete;

    if (isQueryForComplete === 'true') {

      async.series([
        (callback) => {
          request.get(`${AppUrl}/api/releases/${releaseId}`, callback)
        },
        (callback) => {
          request.get(`${AppUrl}/api/components/${releaseId}`, callback)
        },
        (callback) => {
          request.get(`${AppUrl}/api/milestones?releaseID=${releaseId}`, callback)
        }
      ],

      //callback
      (err, results) => {
        if (err) {
          jsonHelper(res).error();
          return;
        }

        let aggregatedData = {
          releaseInfo: JSON.parse(results[0][1]),
          components: JSON.parse(results[1][1]),
          milestones: JSON.parse(results[2][1])
        }

        //return json as response
        jsonHelper(res).callback('get', aggregatedData);
      })
    } else {
      let query = `SELECT * FROM brm.dbo.Releases WHERE ID = ${releaseId}`;

      //connect to your database & return json response
      sqlHelper.queryDB(query, jsonHelper(res).callback, jsonHelper(res).error, 'read');
    }

  })

  // PUT ENDPOINT
  // FOR UPDATING RELEASE INFO
    .put((req, res) => {

    let releaseId = req.params.release_id;

    const {title, RFCNumber, owner, goLiveDate, status} = req.body;

    let query = `UPDATE Releases SET
          Title =  '${title}',
          RFCNumber = '${RFCNumber}',
          Owner = '${owner}',
          GoLiveDate = '${goLiveDate}',
          Status = '${status}'
          WHERE ID = ${releaseId}`;

    //connect to your database & return json response
    sqlHelper.queryDB(query, jsonHelper(res).callback, jsonHelper(res).error, 'update');

  });
}
