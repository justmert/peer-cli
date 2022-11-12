import { createLibp2p } from "libp2p";
import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webRTCDirect } from "@libp2p/webrtc-direct";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import wrtc from "@koush/wrtc"; // for macos
import { tcp } from "@libp2p/tcp";
import { multiaddr } from "@multiformats/multiaddr";
import inquirer from "inquirer";
import { clearScreen, colorSpec } from "./utils.js";
import clc from "cli-color";

const wrtcStar = webRTCStar({ wrtc });
const starAddr =
  "/dns4/pacific-shelf-40622.herokuapp.com/tcp/443/wss/p2p-webrtc-star/";
export const p2pNode = await createLibp2p({
  addresses: {
    // Add the signaling server address, along with our PeerId to our multiaddrs list
    // libp2p will automatically attempt to dial to the signaling server so that it can
    // receive inbound connections from other peers
    listen: [starAddr],
  },
  transports: [tcp(), webSockets(), wrtcStar.transport],
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [wrtcStar.discovery],
});


const x = new Set()
// Listen for new peers
p2pNode.addEventListener("peer:discovery", async (evt) => {
  // Dial to the remote peer (the "listener")
  // const peerMaStr = `${starAddr}/p2p/${evt.detail.id}`
  // const peerMa = multiaddr(peerMaStr);
  // uniquePeerSet.add(evt.detail.id);
  console.log(evt.detail.id.toString());

  // const listenerMa = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${idListener.toString()}`)

  // const stream = await p2pNode.dialProtocol(ma, '/chat')
  // console.log('Dialer dialed to listener on protocol: /chat/1.0.0')
  // console.log('Type a message and see what happens')

  // // Send stdin to the stream
  // stdinToStream(stream)
  // // Read the stream and output to console
  // streamToConsole(stream)
  const ma = starAddr + "p2p/" + evt.detail.id
  console.log(ma);
  if (!x.has(ma)){
      x.add(ma)
      await dialAuth(ma)    
  }

  // const listenerMa = multiaddr(`/ip4/127.0.0.1/tcp/10333/p2p/${idListener.toString()}`)
//   const stream = await p2pNode.dialProtocol(ma, "/chat");
//   console.log("Dialer dialed to listener on protocol: /chat/1.0.0");
//   console.log("Type a message and see what happens");

//   // Send stdin to the stream
//   stdinToStream(stream);
//   // Read the stream and output to console
//   streamToConsole(stream);
});

/* eslint-disable no-console */

import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";




await p2pNode.handle("/auth/request", async ({ stream, connection }) => {
    authRequest(stream, connection);
  });
  
  await p2pNode.handle("/auth/answer", async ({ stream, connection }) => {
    authAnswer(stream, connection);
  });
  
  await p2pNode.handle("/chat", async ({ stream }) => {
      // Send stdin to the stream
      stdinToStream(stream);
      // Read the stream and output to console
      streamToConsole(stream);
    });
    
  
    async function dialAuth(peerMaStr) {
        await p2pNode.dialProtocol(multiaddr(peerMaStr), "/auth/request");
      }

      function authAnswer(stream, connection) {
        console.log("\nauthanswer ^^^^^^^^^^^^^^");
        //   console.log(stream);
        //   console.log(connection);
      
        pipe(stream, (source) =>
          (async function () {
            for await (const msg of source) {
              console.log("---------sss");
              console.log(uint8ArrayToString(msg.subarray()));
              if (uint8ArrayToString(msg.subarray()) === true.toString()) {
                  console.log('-----------------------------ww')
              //   clearScreen();
                console.log(colorSpec.infoMsg("CHAT STARTED"));
                const stream = await p2pNode.dialProtocol(
                  connection.remotePeer,
                  "/chat"
                );
                //   inquirer.prompt().ui.close();
                // Send stdin to the stream
                stdinToStream(stream);
                // Read the stream and output to console
                streamToConsole(stream);
              } else {
                console.log("other peer didnt accepted!");
              }
            }
          })()
        );
      }
        
  async function authRequest(stream, connection) {
    clearScreen();
    dialed = true
    console.log("\nauthrequest entered! <<<<<<<<<<<<<<<");
    // console.log(stream);
    // console.log(connection);
    let accepted = false;
    const question = [
      {
        type: "confirm",
        name: "request",
        message: colorSpec.infoMsg(
          `Hey! ${connection.remotePeer} wants to connect you. Do you accept?`
        ),
        default() {
          return false;
        },
      },
    ];
    await inquirer.prompt(question).then(async (answers) => {
      accepted = answers.request;
    });
    pipe(stream, () => {
      p2pNode
        .dialProtocol(connection.remotePeer, "/auth/answer")
        .then((stream) => {
          pipe([uint8ArrayFromString(accepted.toString())], stream);
        });
    });
  }

export function stdinToStream(stream) {
  // Read utf-8 from stdin
  process.stdin.setEncoding("utf8");
  pipe(
    // Read from stdin (the source)
    process.stdin,
    // Turn strings into buffers
    (source) => map(source, (string) => uint8ArrayFromString(string)),
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  );
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
        console.log("> " + msg.toString().replace("\n", ""));
      }
    }
  );
}

var dialed = false
// Listen for new peers
p2pNode.addEventListener("peer:discovery", (evt) => {
  const peer = evt.detail;
  console.log(`Found peer ${peer.id.toString()}`);

//   console.log('peer ma:')
// console.log(peer.multiaddrs)
//   console.log(p2pNode.connectionManager.acceptIncomingConnection(multiaddr(peer.multiaddrs.toString())))

    if (dialed === false){
        // dial them when we discover them
        p2pNode.dial(evt.detail.id).catch((err) => {
          console.log(`Could not dial ${evt.detail.id}`, err);
        });

    }
});

// // Listen for new connections to peers
// p2pNode.connectionManager.addEventListener("peer:connect", (evt) => {
//   const connection = evt.detail;
//   console.log(`Connected to ${connection.remotePeer.toString()}`);
// });

// // Listen for peers disconnecting
// p2pNode.connectionManager.addEventListener("peer:disconnect", (evt) => {
//   const connection = evt.detail;
//   console.log(`Disconnected from ${connection.remotePeer.toString()}`);
// });

await p2pNode.start();

console.log(p2pNode.peerId);
