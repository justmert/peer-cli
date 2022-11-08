import { createLibp2p } from "libp2p";
import { plaintext } from "libp2p/insecure";
import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webRTCDirect } from "@libp2p/webrtc-direct";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
// import wrtc from "wrtc"; // or 'electron-webrtc'
import wrtc from "@koush/wrtc"; // for macos
// import { webSockets } from '@libp2p/webSockets'
import { tcp } from "@libp2p/tcp";
import { multiaddr } from '@multiformats/multiaddr'

const wrtcStar = webRTCStar({ wrtc });
// const wrtcDirect = new webRTCDirect({ wrtc })

// Create our libp2p
const starAddr =
  "/dns4/pacific-shelf-40622.herokuapp.com/tcp/443/wss/p2p-webrtc-star/";
const p2pNode = await createLibp2p({
  addresses: {
    // Add the signaling server address, along with our PeerId to our multiaddrs list
    // libp2p will automatically attempt to dial to the signaling server so that it can
    // receive inbound connections from other peers
    listen: [
      // '/ip4/127.0.0.1/tcp/8000/ws',
      starAddr,
      // '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',

      // "https://wrtc-star1.par.dwebops.pub/"

      //   "/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct"
    ],
  },
  transports: [
    tcp(),
    webSockets(),

    //   webSockets(),
    wrtcStar.transport,
    // wrtcDirect
  ],
  connectionManager: {
    autoDial: true,
  },
  //   config: {
  connectionEncryption: [noise()],
  //     peerDiscovery: {
  //       webRTCStar: {
  //         // <- note the lower-case w - see https://github.com/libp2p/js-libp2p/issues/576
  //         enabled: true,
  //       },
  //     },

  //     transport: {
  //       [webRTCStar.prototype[Symbol.toStringTag]]: {
  //         wrtc, // You can use `wrtc` when running in Node.js
  //       },
  //     },
  //   },
  streamMuxers: [mplex()],
  peerDiscovery: [
    wrtcStar.discovery,
    // bootstrap({
    //     list: [
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    //     ]
    //   })

    //   bootstrap({
    //     list: [
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    //     ]
    //   })
  ],
});

// Listen for new peers
p2pNode.addEventListener("peer:discovery", async (evt) => {
  const peer = evt.detail;
  // console.log(`Found peer ${peer.id.toString()}`);

  //   wrtcDirect.dial(peer.id, (err, conn) => { console.log(err, conn) })
  // dial them when we discover them
  // console.log(starAddr + "p2p/" + evt.detail.id)
  // p2pNode.dial(evt.detail.id).catch((err) => {
  //   console.log(`Could not dial ${evt.detail.id}`, err);
  // });
    // Dial to the remote peer (the "listener")
    const ma = multiaddr(starAddr + "p2p/" + evt.detail.id);
    console.log(ma)
    // const listenerMa = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${idListener.toString()}`)
    const stream = await p2pNode.dialProtocol(ma, '/chat')
    console.log('Dialer dialed to listener on protocol: /chat/1.0.0')
    console.log('Type a message and see what happens')
  
    // Send stdin to the stream
    stdinToStream(stream)
    // Read the stream and output to console
    streamToConsole(stream)
  
  
});

// Listen for new connections to peers
p2pNode.connectionManager.addEventListener("peer:connect", (evt) => {
  const connection = evt.detail;
  console.log(`Connected to ${connection.remotePeer.toString()}`);
});

// Listen for peers disconnecting
p2pNode.connectionManager.addEventListener("peer:disconnect", (evt) => {
  const connection = evt.detail;
  console.log(`Disconnected from ${connection.remotePeer.toString()}`);
});

/* eslint-disable no-console */

import { pipe } from 'it-pipe'
import * as lp from 'it-length-prefixed'
import map from 'it-map'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export function stdinToStream(stream) {
  // Read utf-8 from stdin
  process.stdin.setEncoding('utf8')
  pipe(
    // Read from stdin (the source)
    process.stdin,
    // Turn strings into buffers
    (source) => map(source, (string) => uint8ArrayFromString(string)),
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  )
}

export function streamToConsole(stream) {
  pipe(
    // Read from the stream (the source)
    stream.source,
    // Decode length-prefixed data
    lp.decode(),
    // Turn buffers into strings
    (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
    // Sink function
    async function (source) {
      // For each chunk of data
      for await (const msg of source) {
        // Output the data as a utf8 string
        console.log('> ' + msg.toString().replace('\n', ''))
      }
    }
  )
}

await p2pNode.handle('/chat', async ({ stream }) => {
  // Send stdin to the stream
  stdinToStream(stream)
  // Read the stream and output to console
  streamToConsole(stream)
})

await p2pNode.start();
console.log(`libp2p id is ${p2pNode.peerId.toString()}`);
console.log("Listening on:");
p2pNode.getMultiaddrs().forEach((ma) => console.log(ma.toString()));
