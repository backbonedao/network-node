#!/usr/bin/env node

const HyperswarmServer = require("./server-swarm")
const stun = require("stun")
const turn = require("node-turn")
const send = require("send")
const path = require("path")
const greenlockExpress = require("greenlock-express")
let maintainerEmail = process.env["EMAIL"]
if (!maintainerEmail)
  maintainerEmail =
    parseInt(Math.random() * 10000000).toString() + "bb@mailinator.com"

const greenlock_conf = {
  packageRoot: __dirname,
  configDir: "./certs",
  maintainerEmail,
  cluster: false,
  // manager: "@greenlock/manager",
}

const wss_port = parseInt(process.env["PORT"], 10) || 1337
const http_port = parseInt(process.env["HTTP_PORT"], 10) || 80
const stun_port = parseInt(process.env["STUN_PORT"], 10) || 19302
const turn_port = parseInt(process.env["TURN_PORT"], 10) || 3478

// STUN SERVER
const stun_server = stun.createServer({ type: "udp4" })

const { STUN_BINDING_RESPONSE, STUN_EVENT_BINDING_REQUEST } = stun.constants
const userAgent = `node/${process.version} stun/v1.0.0`

stun_server.on(STUN_EVENT_BINDING_REQUEST, (request, rinfo) => {
  const message = stun.createMessage(
    STUN_BINDING_RESPONSE,
    request.transactionId
  )

  message.addXorAddress(rinfo.address, rinfo.port)
  message.addSoftware(userAgent)

  stun_server.send(message, rinfo.port, rinfo.address)
})

stun_server.listen(stun_port, () => {
  // console.log("[stun] server started")
})

// TURN SERVER
if (!process.env.NO_TURN) {
  const turn_server = new turn({
    // set options
    authMech: "none", //'long-term',
    // credentials: {
    //   username: "password"
    // }
  })
  turn_server.start()
}

// WSS SERVER
greenlockExpress.init(greenlock_conf).ready((glx) => {
  startServer(glx)
})

function startServer(glx) {
  const httpsServer = glx.httpsServer(null, function (req, res) {
    res.end()
  })

  const httpServer = glx.httpServer()

  const wsServer = new HyperswarmServer()
  if (process.env.DEBUG) wsServer.listenOnServer(httpServer)
  else wsServer.listenOnServer(httpsServer)

  httpsServer.listen(wss_port, "0.0.0.0", function () {
    // console.info("[wss] Listening on ", httpsServer.address())
  })

  httpServer.listen(http_port, "0.0.0.0", function () {
    // console.info("[wss] Listening on ", httpServer.address())
  })

  console.log(
    `Backbone Swarm Node listening on port ${
      process.env.DEBUG ? http_port : wss_port
    }`
  )
  console.log(
    `-> WSS proxy available on port ${
      process.env.DEBUG ? http_port : wss_port
    }/proxy`
  )
  console.log(
    `-> WSS signal available on port ${
      process.env.DEBUG ? http_port : wss_port
    }/signal`
  )
  console.log(
    `-> STUN available on port ${process.env.DEBUG ? http_port : stun_port}`
  )
  if (!process.env.NO_TURN)
    console.log(
      `-> TURN available on port ${process.env.DEBUG ? http_port : turn_port}`
    )
}
