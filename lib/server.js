/*
 *  Copyright 2013 Tomaz Muraus
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

var express = require('express');
var async = require('async');
var scmp = require('scmp');
var twitter = require('twitter');
var log = require('logmagic').local('twitter-relay.server');

var Relay = require('./relay').Relay;

function Server(config) {
  this._config = config;

  this._app = express();
  this._twit = new twitter({
    'consumer_key': this._config.twitter.consumer_key,
    'consumer_secret': this._config.twitter.consumer_secret,
    'access_token_key': this._config.twitter.access_token_key,
    'access_token_secret': this._config.twitter.access_token_secret
  });

  this._relay = new Relay(this._config, this._twit);
}

Server.prototype.run = function(callback) {
  async.series([
    this._verifyTwitterCredentials.bind(this),
    this._initialize.bind(this),
    this._listen.bind(this),
    this._startRelay.bind(this)
  ],

  function(err) {
    if (err) {
      throw err;
    }

    if (callback) {
      callback();
    }
  });
};

Server.prototype._verifyTwitterCredentials = function(callback) {
  this._twit.verifyCredentials(function(data) {
    var err;

    if (data instanceof Error) {
      err = new Error('Failed to authenticate with Twitter: ' +
                      data.message.toString());
      callback(err);
      return;
    }

    callback();
  });
};

Server.prototype._initialize = function(callback) {
  this._app.use(express.bodyParser());
  this._app.post('/webhook', this._handleWebhook.bind(this));
  callback();
};

Server.prototype._listen = function(callback) {
  var port = this._config.server.port, hostname = this._config.server.hostname;
  this._app.listen(port, hostname, callback);
  log.infof('Server listening on ${hostname}:${port}',
            {'port': port, 'hostname': hostname});
};

Server.prototype._startRelay = function(callback) {
  this._relay.start();
  callback();
};

Server.prototype._handleWebhook = function(req, res) {
  var payload = req.body;

  if (!req.query.secret) {
    res.send('Missing secret', 401);
    return;
  }

  if (!scmp(this._config.server.secret, req.query.secret)) {
    res.send('Invalid secret', 401);
    return;
  }

  if (!payload.details || !payload.details.state) {
    res.send('Invalid payload', 400);
    return;
  }

  this._relay.addMessage(payload);
  res.send('Payload queued and will be relayed...');
};

exports.Server = Server;
