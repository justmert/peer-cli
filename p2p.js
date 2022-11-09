import { createLibp2p } from "libp2p";
import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webRTCDirect } from "@libp2p/webrtc-direct";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import wrtc from "@koush/wrtc"; // for macos
import { tcp } from "@libp2p/tcp";
import { multiaddr } from '@multiformats/multiaddr'
import {  ui } from "./main.js";
import { colorSpec } from "./utils.js";

const wrtcStar = webRTCStar({ wrtc });
export const starAddr =
  "/dns4/pacific-shelf-40622.herokuapp.com/tcp/443/wss/p2p-webrtc-star";
export const p2pNode = await createLibp2p({
  addresses: {
    // Add the signaling server address, along with our PeerId to our multiaddrs list
    // libp2p will automatically attempt to dial to the signaling server so that it can
    // receive inbound connections from other peers
    listen: [
      starAddr,
    ],
  },
  transports: [
    tcp(),
    webSockets(),
    wrtcStar.transport,
  ],
  connectionManager: {
    autoDial: false,
  },
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [
    wrtcStar.discovery],
});

export default p2pNode;




// const uniquePeerSet = new Set();
export const uniquePeers = {};
// Listen for new peers
p2pNode.addEventListener("peer:discovery", async (evt) => {
  // console.log(uniquePeers)
    
    // Dial to the remote peer (the "listener")
    // const peerMaStr = `${starAddr}/p2p/${evt.detail.id}`
    // const peerMa = multiaddr(peerMaStr);
    // uniquePeerSet.add(evt.detail.id);
    try {
      const timeout = setTimeout(() => {
        delete uniquePeers[evt.detail.id];
      }, 8 * 1000);
      
      if (uniquePeers[evt.detail.id] === undefined){
        uniquePeers[evt.detail.id] = {
            id: evt.detail.id.toString(),
            ma: evt.detail.multiaddrs.toString(),
            ct: timeout
        };
    
      // console.log('peer found: ',evt.detail.id);  
      // console.log(uniquePeers[evt.detail.id]);
      }
      else {
        // console.log("Peer already exists: " + evt.detail.id);
        // console.log(uniquePeers[evt.detail.id])
        uniquePeers[evt.detail.id].ct.refresh();
      }
      
    } catch (error) {
      console.log(error)
    }
    

    // const listenerMa = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${idListener.toString()}`)
    
    // const stream = await p2pNode.dialProtocol(ma, '/chat')
    // console.log('Dialer dialed to listener on protocol: /chat/1.0.0')
    // console.log('Type a message and see what happens')
  
    // // Send stdin to the stream
    // stdinToStream(stream)
    // // Read the stream and output to console
    // streamToConsole(stream)
});


// Listen for new connections to peers
p2pNode.connectionManager.addEventListener("peer:connect", (evt) => {
  const connection = evt.detail;
  // console.log(`Connected to ${connection.remotePeer.toString()}`);
});

// Listen for peers disconnecting
p2pNode.connectionManager.addEventListener("peer:disconnect", (evt) => {
  const connection = evt.detail;
  // console.log(`Disconnected from ${connection.remotePeer.toString()}`);
});

export async function startP2P() {
  await p2pNode.start();
  // ui.log.write(colorSpec.infoMsg("Peer ID:"));
}
