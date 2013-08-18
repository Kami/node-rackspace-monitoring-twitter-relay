# Rackspace Monitoring Twitter Relay

*Note: This is an unofficial application and not is affiliated with Rackspace in
any way.*

An application which listens for [Rackspace Cloud Monitoring][1] alert webhooks
and relays them to Twitter.

## Installation

```bash
npm install -g rackspace-monitoring-twitter-relay
```

## Usage

```bash
raxmon-twitter-relay --config <path to config file>
```

For a sample config, please see examples/config.json file.

## Build Status

[![Build Status](https://secure.travis-ci.org/Kami/node-rackspace-monitoring-twitter-relay.png)](http://travis-ci.org/Kami/node-rackspace-monitoring-twitter-relay)

[1]: http://www.rackspace.com/cloud/monitoring/
