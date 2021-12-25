---
to: given/config/cogework.js
---
require('babel-register')
// You must require this file in your service to use workers or mailers from endpoints.
//
// You can let workers and mailers run on a separate process or machine using:
//
// $ HYPERWORK=1 node config/cogework.js
//
// Or in your same service process by running your service flagged with HYPERWORK:
//
// $ HYPERWORK=1 yarn start

const runWorkers = !!process.env.HYPERWORK

const { init } = require('../app/workers/support/cogework')
const mailTransport = require('./nodemailer')

const * as path from 'path'

const queueConfigs = {
  mailers: {
    name: 'mailers',
    port: 6379,
    host: '127.0.0.1',
    hostId: 'localhost'
  },
  system: {
    name: 'system',
    port: 6379,
    host: '127.0.0.1',
    hostId: 'localhost'
  }
}

init(
  [
    path.join(__dirname, '../app/mailers'),
    path.join(__dirname, '../app/workers') /* CleanupWorker, DatabaseVaccum */
  ],
  {
    log: console.log,
    mailTransport,
    runWorkers,
    queueConfigs
  }
)
const Arena = require('bull-arena')
const cogeworkAdmin = Arena({ queues: queueConfigs })

module.exports = {
  cogeworkAdmin
}
