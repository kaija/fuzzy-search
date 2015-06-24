var express = require('express');
var elasticsearch = require('elasticsearch');
var config = require('../config');

var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name     : 'elastic',
    create   : function(callback) {
        var client = new elasticsearch.Client({
          host: 'localhost:9200'
        });
        callback(null, client);
    },
    destroy  : function(client){
    },
    max      : 10,
    min      : 2,
    log : false
});



var router = express.Router();


router.post('/delete', function(req, res, next) {
  console.log("Delete all index");
  var result = {
    result: ''
  };
  pool.acquire(function(err, client) {
    if(err) {
      result['error'] = err;
      res.send(result);
    } else {
      client.indices.delete({index: config.index}, function(err, body){
        pool.release(client);
        if (err) {
          result['error'] = err;
          res.send(result);
        } else {
          result.result = body;
          res.send(result);
        }
      });
    }
  });
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
        //var lucent = req.body.keyword + '~';
        var lucent = req.body.keyword;
        client.search({index:config.index, type: config.type, q: lucent, size: 100}).then(
          function(body){
            pool.release(client);
            result.result = body.hits.hits;
            res.send(result);
          },
          function(error){
            pool.release(client);
            result.error = error;
            res.send(result);
          }
        );
      }
    });
  }
});

module.exports = router;
