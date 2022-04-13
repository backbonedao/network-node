#!/usr/bin/env node

const HyperswarmServer = require("./server-swarm")
const send = require("send")
const path = require("path")

const maintainerEmail = process.env["EMAIL"]
if (!maintainerEmail) maintainerEmail = parseInt(Math.random() * 10000000).toString() + 'bb@mailinator.com'
const domain = process.env["DOMAIN"] || 'localhost'

const wss_port = parseInt(process.env['PORT'], 10) || 1337
const http_port = parseInt(process.env['HTTP_PORT'], 10) || 80

require("greenlock-express")
  .init({
    packageRoot: __dirname,
    configDir: "./letsencrypt.d",
    maintainerEmail,
    cluster: false,
  })
  .ready(httpsWorker)

function httpsWorker(glx) {
  const httpsServer = glx.httpsServer(null, function (req, res) {
    res.end()
  })

  const wsServer = new HyperswarmServer()
  wsServer.listenOnServer(httpsServer)
  
  httpsServer.listen(wss_port, "0.0.0.0", function () {
    console.info("Listening on ", httpsServer.address())
  })
  
  const httpServer = glx.httpServer()

  httpServer.listen(http_port, "0.0.0.0", function () {
    console.info("Listening on ", httpServer.address())
  })

  console.log(`Backbone Swarm Node listening on wss://${domain}:${wss_port}`)
  console.log(`-> Proxy available on wss://${domain}:${wss_port}/proxy`)
  console.log(`-> Signal available on wss://${domain}:${wss_port}/signal`)
}
