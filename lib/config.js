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

var path = require('path');
var fs = require('fs');

var underscore = require('lodash');
var Validator = require('jsonschema').Validator;

var DEFAULT_TEMPLATES_PATH = path.resolve(__dirname, '../templates/');

var DEFAULT_VALUES = {
  'server': {
    'hostname': 'localhost'
  },
  'misc': {
    'templates_path': DEFAULT_TEMPLATES_PATH
  }
};

var SERVER_SCHEMA = {
  'id': '/Server',
  'properties': {
    'port': {
      'type': 'number',
      'required': true
    },
    'hostname': {
      'type': 'string',
      'required': true
    },
    'secret': {
      'type': 'string',
      'required': true
    }
  }
};

var MISC_SCHEMA = {
  'id': '/Misc',
  'properties': {
    'templates_path': {
      'type': 'string',
      'required': true
    }
  }
};

var TWITTER_SCHEMA = {
  'id': '/Twitter',
  'properties': {
    'consumer_key': {
      'type': 'string',
      'required': true
    },
    'consumer_secret': {
      'type': 'string',
      'required': true
    },
    'access_token_key': {
      'type': 'string',
      'required': true
    },
    'access_token_secret': {
      'type': 'string',
      'required': true
    }
  }
};

var SCHEMA = {
  'id': '/Config',
  'properties': {
    'server': {
      '$ref': '/Server'
    },
    'misc': {
      '$ref': '/Misc'
    },
    'twitter': {
      '$ref': '/Twitter'
    }
  }
};

function load(configPath) {
  var content, parsed;

  if (!fs.existsSync(configPath)) {
    throw new Error('Config ' + configPath + ' doesnt exist');
  }

  content = fs.readFileSync(configPath, 'utf-8');
  parsed = JSON.parse(content);
  parsed = underscore.merge(DEFAULT_VALUES, parsed);
  return parsed;
}

function validate(config) {
  var v, instance, result;

  v = new Validator();
  instance = 4;

  v.addSchema(SERVER_SCHEMA, '/Server');
  v.addSchema(MISC_SCHEMA, '/Misc');
  v.addSchema(TWITTER_SCHEMA, '/Twitter');

  result = v.validate(config, SCHEMA);

  if (result.errors.length >= 1) {
    throw new Error('Failed to validate config: ' + result.errors.join(', '));
  }

  return config;
}

function loadAndValidate(configPath) {
  var config = load(configPath);
  return validate(config);
}

exports.loadAndValidate = loadAndValidate;
