const { EventEmitter } = require("events")
const webRTCSwarm = require("@geut/discovery-swarm-webrtc")
const HyperswarmClient = require("hyperswarm-proxy-ws/client")
const DuplexPair = require("duplexpair")
const wrtc = require("wrtc")
const DEFAULT_WEBRTC_BOOTSTRAP = ["wss://node1.network.backbonedao.com:1337"]
const DEFAULT_PROXY_SERVER = "wss://node1.network.backbonedao.com:1337"

module.exports = function swarm(opts) {
  return new HyperswarmWeb(opts)
}

function getBootstrapUrls(path, defaultUrls = [], specificUrls = []) {
  let urls = defaultUrls.map((url) => {
    if (url.endsWith("/")) {
      url = url.slice(0, -1)
    }

    return `${url}/${path}`
  })

  urls = urls.concat(specificUrls)

  if (urls.length === 0) return
  return urls
}

function webrtcPeerInfo(info) {
  const { id, channel, initiator } = info
  return {
    type: "webrtc",
    client: initiator,
    peer: {
      port: 0,
      host: id,
      topic: channel,
    },
    // TODO: Add deduplication to WebRTC logic
    deduplicate: () => false,
  }
}

class HyperswarmWeb extends EventEmitter {
  constructor(opts = {}) {
    super()
    let {
      bootstrap,
      webrtcBootstrap,
      wsProxy,
      maxPeers,
      simplePeer,
      wsReconnectDelay,
    } = opts

    simplePeer = { ...simplePeer, wrtc }

    this.webrtcOpts = {
      maxPeers,
      simplePeer,
      bootstrap:
        getBootstrapUrls("signal", bootstrap, webrtcBootstrap) ||
        DEFAULT_WEBRTC_BOOTSTRAP,
    }
    this.wsOpts = {
      maxPeers,
      proxy:
        getBootstrapUrls("proxy", bootstrap, wsProxy) || DEFAULT_PROXY_SERVER,
    }

    if (wsReconnectDelay) {
      this.wsOpts.reconnectDelay = wsReconnectDelay
    }

    this.isListening = false
    this.destroyed = false
    this._peers = new Map()
  }

  _handleConnection(connection, info) {
    this._peers.set(info.peer.host, { connection, info })
    this.emit("connection", connection, info)
  }

  _handleDisconnection(connection, info) {
    this._peers.delete(info.peer.host)
    this.emit("disconnection", connection, info)
  }

  get peers() {
    return Array.from(this._peers.values())
  }

  address() {
    // TODO: What could possibly go here?!?!?!
    return { port: 0, family: "IPv4", address: "127.0.0.1" }
  }

  listen(port, cb) {
    if (this.isListening) return setTimeout(cb, 0)

    this.isListening = true

    this.webrtc = webRTCSwarm(this.webrtcOpts)
    this.webrtc.on("connection", (connection, info) =>
      this._handleConnection(connection, webrtcPeerInfo(info))
    )
    this.webrtc.on("connection-closed", (connection, info) =>
      this._handleDisconnection(connection, webrtcPeerInfo(info))
    )

    this.ws = new HyperswarmClient(this.wsOpts)
    this.ws.on("connection", (connection, info) =>
      this._handleConnection(connection, info)
    )
    this.ws.on("disconnection", (connection, info) =>
      this._handleDisconnection(connection, info)
    )
  }

  join(key, opts) {
    this.listen()

    this.webrtc.join(key)
    this.ws.join(key, opts)
  }

  leave(key) {
    this.listen()

    this.webrtc.leave(key)
    this.ws.leave(key)
  }

  connect(peer, cb) {
    this.listen()

    this.ws.connect(peer, cb)
  }

  connectivity(cb) {
    this.listen(() => {
      cb(null, {
        bound: true,
        bootstrapped: true,
        holepunched: true,
      })
    })
  }

  // No clue how to implement this, it's undocumented
  flush(cb) {
    process.nextTick(cb)
  }

  // Always return that we're looking up and not announcing
  status() {
    return {
      lookup: true,
      announce: false,
    }
  }

  destroy(cb) {
    this.destroyed = true
    this.webrtc.close(() => {
      this.ws.destroy(cb)
    })
  }
}
