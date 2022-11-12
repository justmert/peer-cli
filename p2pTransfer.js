"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { webRTCStar } from "@libp2p/webrtc-star";
import { noise } from "@chainsafe/libp2p-noise";
import { webRTCDirect } from "@libp2p/webrtc-direct";
import { webSockets } from "@libp2p/websockets";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import wrtc from "@koush/wrtc"; // for macos
import { tcp } from "@libp2p/tcp";
import { multiaddr } from "@multiformats/multiaddr";
import { p2pNode, starAddr, startP2P, stopP2P, uniquePeers } from "./p2p.js";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import inquirer from "inquirer";
import { clearScreen, colorSpec } from "./utils.js";
import { ui } from "./main.js";
import clc from "cli-color";

const readline = require("readline");
var globalRl = null;
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  globalRl = rl;
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

var _visable = false;
export async function chatNavigate() {
  makeUnvisible();
  if (!p2pNode.isStarted()) {
    startP2P();
  }
  while (true) {
    clearScreen();
    ui.log.write(colorSpec.infoMsg("Your Peer ID: " + p2pNode.peerId));
    const question = [
      {
        type: "list",
        name: "chatType",
        message: "What to do?",

        choices: [
          {
            value: "visible",
            name: "Make yourself connectable to other peers",
          },
          { value: "discover", name: "Discover and connect other peers" },
          { value: "connect", name: "Connect a peer with given Peer ID" },
          { value: "back", name: "Return back to main prompt" },
        ],
      },
    ];
    await inquirer.prompt(question).then(async (answers) => {
      if (answers.chatType == "discover") {
        await discoverPeers();
      } else if (answers.chatType == "connect") {
        await connectPeer();
      } else if (answers.chatType == "visible") {
        await makeVisible();
        await askQuestion("Wait here! Peers are connection you.");
        await makeUnvisible();
      } else if (answers.chatType == "back") {
        if (p2pNode.isStarted()) {
          stopP2P();
          makeUnvisible();
        }
        return;
      }
    });
  }
}

async function isVisable() {
  return _visable;
}
async function makeVisible() {
  _visable = true;
}

async function makeUnvisible() {
  _visable = false;
}

async function discoverPeers() {
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
      peerMaStr = peer.ma;
      peerId = peer.id;
    }

    ui.log.write(colorSpec.infoMsg(`Dialing to ${peerId}`));
    await dialAuth(multiaddr(peerMaStr));
  } catch (error) {}
}

await p2pNode.handle("/auth/request", async ({ stream, connection }) => {
  try {
    await authRequest(stream, connection);
  } catch (error) {}
});

await p2pNode.handle("/auth/answer", async ({ stream, connection }) => {
  try {
    await authAnswer(stream, connection);
  } catch (error) {}
});

await p2pNode.handle("/chat", async ({ stream, connection }) => {
  // Send stdin to the stream
  stdinToStream(stream, connection);
  // Read the stream and output to console
  streamToConsole(stream, connection);
});

async function dialAuth(peerMaStr) {
  await p2pNode.dialProtocol(multiaddr(peerMaStr), "/auth/request");
}

async function dialChat(peerMaStr) {
  await p2pNode.dialProtocol(peerMaStr, "/chat");
}

function authAnswer(stream, connection) {
  pipe(stream, (source) =>
    (async function () {
      for await (const msg of source) {
        if (uint8ArrayToString(msg.subarray()) === true.toString()) {
          ui.log.write(colorSpec.infoMsg("CHAT STARTED"));
          await dialChat(connection.remoteAddr);
        } else {
          const streamId = stream.id;
          stream.abort();
          stream.close();
          connection.removeStream(streamId);
          connection.close();
          return;
        }
      }
    })()
  );
}

async function authRequest(stream, connection) {
  if (globalRl) {
    globalRl.close();
  }
  if ((await isVisable()) === false) {
    const streamId = stream.id;
    stream.abort();
    stream.close();
    connection.removeStream(streamId);
    connection.close();
    return;
  }
  clearScreen();
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
    const streamId = stream.id;
    stream.abort();
    stream.close();
    connection.removeStream(streamId);
    connection.close();
  });
  if (!accepted) {
    await makeUnvisible();
    if (p2pNode.isStarted()) {
      await stopP2P();
    }
  }
}

async function stdinToStream(stream, connection) {
  // Read utf-8 from stdin
  process.stdin.setEncoding("utf8");
  process.stdout.write(colorSpec.sentMessageColor(`(You) ${p2pNode.peerId}# `));
  pipe(
    // Read from stdin (the source)
    process.stdin,

    (source) => {
      return (async function* () {
        for await (const msg of source) {
          process.stdout.write(
            colorSpec.sentMessageColor(`(You) ${p2pNode.peerId}# `)
          );
          yield msg;
        }
      })();
    },
    // Turn strings into buffers
    (source) => map(source, (string) => uint8ArrayFromString(string)),
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  );
}

function streamToConsole(stream, connection) {
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
        process.stdout.write("\n");
        process.stdout.moveCursor(0, -1); // up one line
        process.stdout.clearLine(1);

        process.stdout.write(
          colorSpec.receivedMessageColor(
            `(Other Peer) ${connection.remotePeer}# `
          ) +
            msg.toString().replace("\n", "") +
            "\n"
        );
        process.stdout.write(
          colorSpec.sentMessageColor(`(You) ${p2pNode.peerId}# `)
        );
      }
    }
  );
}
