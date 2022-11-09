import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webRTCDirect } from "@libp2p/webrtc-direct";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import wrtc from "@koush/wrtc"; // for macos
import { tcp } from "@libp2p/tcp";
import { multiaddr } from "@multiformats/multiaddr";
import { p2pNode, starAddr, uniquePeers } from "./p2p.js";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import inquirer from "inquirer";
import { clearScreen, colorSpec } from "./utils.js";
import { ui } from "./main.js";
import clc from "cli-color";

export async function chatNavigate() {
  clearScreen();
  const question = [
    {
      type: "list",
      name: "chatType",
      message: "What to do?",
      choices: [
        { value: "discover", name: "Discover and connect other peers" },
        { value: "connect", name: "Connect a peer with given Peer ID" },
      ],
    },
  ];
  await inquirer.prompt(question).then(async (answers) => {
    if (answers.chatType == "discover") {
      await discoverPeers();
    } else if (answers.chatType == "connect") {
      await connectPeer();
    }
  });
}

async function discoverPeers() {
  // ui.log.write(colorSpec.warnMsg(`Your Peer ID: ${p2pNode.peerId}`));
  //   ui.log.write(colorSpec.warnMsg("Discovering peers. Please wait..."));
  // console.log(uniquePeers)
  //   console.log(uniquePeers);
  let finishDiscover = false;
  while (!finishDiscover) {
    if (Object.keys(uniquePeers).length > 0) {
      const question = [
        {
          type: "list",
          name: "peer",
          message: "Select a peer to connect",
          choices: [
            { value: "refresh", name: "Refresh" },
            { value: "back", name: "Back" },
          ].concat(
            Object.keys(uniquePeers).map((peer) => {
              return { value: uniquePeers[peer], name: peer };
            })
          ),
        },
      ];
      await inquirer.prompt(question).then(async (answers) => {
        if (answers.peer == "refresh") {
          finishDiscover = false;
        } else {
          finishDiscover = true;
          if (answers.peer == "back") {
            return;
          } else {
            await connectPeer(answers.peer);
          }
        }
        // console.log(answers.peer)
        // await connectPeer(answers.peer);
      });
    } else {
      const question = [
        {
          type: "list",
          name: "peer",
          message: "No peers found. What to do?",
          choices: [
            { value: "refresh", name: "Refresh" },
            { value: "back", name: "Back" },
          ],
        },
      ];
      await inquirer.prompt(question).then(async (answers) => {
        if (answers.peer == "refresh") {
          finishDiscover = false;
        } else {
          finishDiscover = true;
          if (answers.peer == "back") {
            return;
          }
        }
      });
    }
  }
}


async function connectPeer(peer = null) {
  try {
    let peerMaStr = null;
    let peerId = null;
    if (peer == null) {
      // peer ma is not given
      const question = [
        {
          type: "input",
          name: "peerId",
          message: "Enter Peer ID: ",
        },
      ];
      await inquirer.prompt(question).then(async (answers) => {
        peerId = answers.peerId;
      });
      peerMaStr = `${starAddr}/p2p/${peerId}`;
    } else {
      // peer ma is given
      peerMaStr = peer.ma;
      peerId = peer.id;
    }

    ui.log.write(colorSpec.infoMsg(`Dialing to ${peerId}`));
    console.log(multiaddr(peerMaStr));
    console.log(typeof multiaddr(peerMaStr));

    await dialAuth(multiaddr(peerMaStr));
  } catch (error) {
    console.log(error);
  }
}

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
            const stream = await p2pNode.dialProtocol(connection.remotePeer, '/chat')
            // Send stdin to the stream
            stdinToStream(stream)
            // Read the stream and output to console
            streamToConsole(stream)

            
        } else {
          console.log("other peer didnt accepted!");
        }
      }
    })()
  );
}

async function authRequest(stream, connection) {
  clearScreen();
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
//   inquirer.
//   pipe(stream, (source) => (async function () {})()).then(async () => {
//     p2pNode
//       .dialProtocol(connection.remotePeer, ["/auth/answer"])
//       .then((stream) => {
//         console.log("Answer Send! -----------");
//         pipe([uint8ArrayFromString("YES")], stream);
//       });
//   });

// async function dialChat(peerMa){

// }

function stdinToStream(stream) {
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

function streamToConsole(stream) {
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
        ui.log.write(
          colorSpec.receivedMessageColor(msg.toString().replace("\n", ""))
        );
      }
    }
  );
}
