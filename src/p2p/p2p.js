import { createLibp2p } from "libp2p";
import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import wrtc from "@koush/wrtc"; // for macos
import { tcp } from "@libp2p/tcp";

const wrtcStar = webRTCStar({ wrtc });
export const starAddr =
  "/dns4/pacific-shelf-40622.herokuapp.com/tcp/443/wss/p2p-webrtc-star";
export const p2pNode = await createLibp2p({
  addresses: {
    listen: [starAddr],
  },
  transports: [tcp(), webSockets(), wrtcStar.transport],
  connectionManager: {
    autoDial: false,
  },
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [wrtcStar.discovery],
});

export default p2pNode;
export const uniquePeers = {};
// Listen for new peers
p2pNode.addEventListener("peer:discovery", async (evt) => {
  try {
    const timeout = setTimeout(() => {
      delete uniquePeers[evt.detail.id];
    }, 10 * 1000);

    if (uniquePeers[evt.detail.id] === undefined) {
      uniquePeers[evt.detail.id] = {
        id: evt.detail.id.toString(),
        ma: evt.detail.multiaddrs.toString(),
        ct: timeout,
      };
    } else {
      uniquePeers[evt.detail.id].ct.refresh();
    }
  } catch (error) {
    console.log(error);
  }
});

// Listen for new connections to peers
// p2pNode.connectionManager.addEventListener("peer:connect", (evt) => {
//   const connection = evt.detail;
// });

// Listen for peers disconnecting
// p2pNode.connectionManager.addEventListener("peer:disconnect", (evt) => {
// const connection = evt.detail;
// });

export async function isStarted() {
  return p2pNode.isStarted();
}
export async function stopP2P() {
  await p2pNode.stop();
}
export async function startP2P() {
  await p2pNode.start();
}
