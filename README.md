# Network Node

## Setup

Network node requires SSL certificates for WSS connections. We have built-in generation of free letsencrypt.org certificates and they are renewed automatically, but you need to set it up.

*Note: BackboneDAO does not receive your information, only letsencrypt*

**Docker**
```bash
docker run -v ${HOME}/.backbone/certs:/app/certs -it ghcr.io/backbonedao/network-node npm run setup --email=your@email.com --domain=node.yourdomain.com
```

**Cloned repo**
```bash
npm run setup --email=your@email.com --domain=node.yourdomain.com
```

### SSL certificates storage
The above command creates `~/.backbone/certs` directory and all letsencrypt related configs are stored there. If you ever need to switch to another server, copy this directory over and all your existing certificates continue working.

## Run

**Docker**
```bash
docker run -p 80:80 -p 1337:1337 -p 19302:19302/udp -p 3478:3478/udp --restart=unless-stopped -v ${HOME}/.backbone/certs:/app/certs -dt ghcr.io/backbonedao/network-node
```

**Cloned repo**
```bash
node server.js
```
