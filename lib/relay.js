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

var templates = require('magic-templates');
var async = require('async');
var log = require('logmagic').local('twitter-relay.relay');

function Relay(config, twit) {
  this._config = config;
  this._twit = twit;
  this._queue = [];
  this._timeoutId = null;
  this._interval = 500;

  templates.setTemplatesDir(this._config.misc.templates_path);
}

Relay.prototype.start = function() {
  this._schedule();
};

Relay.prototype.addMessage = function(msg) {
  this._queue.push(msg);
};

Relay.prototype._schedule = function() {
  this._timeoutId = setTimeout(this._relayMessages.bind(this), this._interval);
};

Relay.prototype._relayMessages = function() {
  // Only relay one message per interval so we don't get throttled
  var msg = this._queue.shift(), self = this;

  if (!msg) {
    this._schedule();
    return;
  }

  log.infof('Relaying message ${id} to Twitter...', {'id': msg.event_id});

  this._sendToTwitter(msg, function(err) {
    if (err) {
      log.errorf('Failed to relay message to Twitter', {'err': err});
    }
    else {
      log.infof('Message relayed to Twitter');
    }

    self._schedule();
  });
};

Relay.prototype._renderTemplate = function(template, context, callback) {
  template = new templates.Template(template);

  async.waterfall([
    template.load.bind(template),

    function render(template, callback) {
      template.render(context, callback);
    },

    function(rendered, callback) {
      rendered = rendered.join('');
      callback(null, rendered);
    }
  ], callback);
};

Relay.prototype._sendToTwitter = function(msg, callback) {
  var template, context, state, self = this;

  state = msg.details.state.toLowerCase();

  if (['ok', 'warning', 'critical'].indexOf(state) === -1) {
    callback(new Error('Invalid state: ' + msg.details.state));
    return;
  }

  template = state + '.txt';
  context = {'payload': msg};

  async.waterfall([
    this._renderTemplate.bind(this, template, context),

    function sendToTwitter(rendered, callback) {
      var message = rendered.slice(0, 140);
      self._twit.updateStatus(message, function(data) {
        if (data instanceof Error) {
          callback(data);
          return;
        }

        callback(null, data);
      });
    }
  ], callback);
};

exports.Relay = Relay;
