const hyperswarm = require('.')
const crypto = require('crypto')

const swarm = hyperswarm({
  // Specify a server list of HyperswarmServer instances
  bootstrap: ['wss://node1.network.backbonedao.com:1337'],
})

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('my-hyperswarm-topic')
  .digest()

swarm.join(topic)

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // socket.pipe(hypercore.replicate()).pipe(socket)
})

swarm.on('disconnection', (socket, details) => {
  console.log(details.peer.host, 'disconnected!')
  console.log('now we have', swarm.peers.length, 'peers!')
})