var express = require('express');
var elasticsearch = require('elasticsearch');

var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'elastic',
    create   : function(callback) {
        var client = new elasticsearch.Client({
          host: 'localhost:9200'
        });
        callback(null, client);
    },
    max      : 10,
    min      : 2,
    log : false
});



var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/search', function(req, res, next) {
  var result = {
    result: ''
  };
  if(!req.body.keyword) {
    result['error'] = 'missing search keyword';
    res.send(result);
  } else {
    pool.acquire(function(err, client) {
      if(err) {
        result['error'] = err;
        res.send(result);
      } else {
        client.search({q:req.body.keyword}).then(
          function(body){
            pool.release(client);
            result.result = body.hits.hits;
            res.send(result);
          },
          function(error){
            result.error = error;
            res.send(result);
          }
        );
      }
    });
  }
});

module.exports = router;
