#!/usr/bin/env node

const HyperswarmServer = require("./server-swarm")
const send = require("send")
const path = require("path")

const maintainerEmail = process.env["EMAIL"]
if (!maintainerEmail) throw new Error("LETSENCRYPT REQUIRES EMAIL")

const wss_port = parseInt(process.env['PORT'], 10) || 4977
const https_port = parseInt(process.env['HTTPS_PORT'], 10) || 443
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
  var httpsServer = glx.httpsServer(null, function (req, res) {
    res.end("Hello, Encrypted World!")
  })

  const wsServer = new HyperswarmServer()
  wsServer.listenOnServer(httpsServer)
  
  httpsServer.listen(wss_port, "0.0.0.0", function () {
    console.info("Listening on ", httpsServer.address())
  })
  
  var httpServer = glx.httpServer()

  httpServer.listen(http_port, "0.0.0.0", function () {
    console.info("Listening on ", httpServer.address())
  })

  console.log(`Listening on ws://localhost:${wss_port}`)
  console.log(`-> Proxy available on ws://localhost:${wss_port}/proxy`)
  console.log(`-> Signal available on ws://localhost:${wss_port}/signal`)
}
