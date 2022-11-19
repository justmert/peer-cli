"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import { multiaddr } from "@multiformats/multiaddr";
import {
  isStarted,
  p2pNode,
  starAddr,
  startP2P,
  stopP2P,
  uniquePeers,
} from "./p2p.js";
import { clearScreen, colorSpec } from "../utils/utils.js";
import { ui } from "../main/main.js";
import "./protocols.js";
import clc from "cli-color";
import figlet from "figlet";

export const welcomeScreen = async () => {
  await clearScreen();
  ui.log.write(
    clc.cyan(
      figlet.textSync("P2P CHAT", {
        font: "Nancyj",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );
};

export var globalRl = null;
function askQuestion(query) {
  const readline = require("readline");
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

var _visible = false;
export async function isVisible() {
  return _visible;
}
export async function makeVisible() {
  _visible = true;
}
export async function makeUnvisible() {
  _visible = false;
}

const waitUntilP2pStopped = () => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (isStarted() == false) {
        clearInterval(interval);
        resolve(null);
      }
    }, 1000);
  });
};

export async function chatNavigate() {
  if (!p2pNode.isStarted()) {
    startP2P();
  }
  clearScreen();
  await welcomeScreen();
  var doExit = false;
  while (!doExit) {
    makeUnvisible();
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
          { value: "connect", name: "Connect a peer with a Peer ID" },
          { value: "back", name: "Return back to main prompt" },
        ],
      },
    ];
    await inquirer.prompt(question).then(async (answers) => {
      await makeUnvisible();
      if (answers.chatType == "discover") {
        await discoverPeers();
      } else if (answers.chatType == "connect") {
        const rv = await connectPeer();
        if (rv) {
          await askQuestion(
            clc.blueBright("Wait here! ") +
              clc.cyan("Connection is sent. Awaiting approval...") +
              clc.blackBright(" (If you want to exit, press any key)")
          );
        }
      } else if (answers.chatType == "visible") {
        await makeVisible();
        await askQuestion(
          clc.blueBright("Wait here! ") +
            clc.cyan("Peers are looking for you...") +
            clc.blackBright(" (If you want to exit, press any key)")
        );
      } else if (answers.chatType == "back") {
        if (p2pNode.isStarted()) {
          stopP2P();
        }
        doExit = true;
        return;
      }
    });
  }
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
            const rv = await connectPeer(answers.peer);
            if (rv) {
              await askQuestion(
                clc.blueBright("Wait here! ") +
                  clc.cyan("Connection is sent. Awaiting approval...") +
                  clc.blackBright(" (If you want to exit, press any key)")
              );
            }
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
    let peerMa = null;
    let peerId = null;
    if (peer == null) {
      const question = [
        {
          type: "input",
          name: "peerId",
          message:
            "Enter Peer ID " + clc.blackBright("(type `back!` to go back): "),
          validate(value) {
            if (value === "back!") {
              return true;
            }
            try {
              multiaddr(`${starAddr}/p2p/${value}`);
            } catch (error) {
              return "Please enter a valid Peer ID";
            }
            return true;
          },
        },
      ];
      await inquirer.prompt(question).then(async (answers) => {
        if (answers.peerId === "back!") {
          peerId = null;
          return;
        }
        peerId = answers.peerId;
      });

      peerMa = `${starAddr}/p2p/${peerId}`;
    } else {
      peerMa = peer.ma;
      peerId = peer.id;
    }

    if (peerId == null) {
      return false;
    }
    ui.log.write(colorSpec.infoMsg(`Dialing to ${peerId}`));
    await dialAuth(multiaddr(peerMa));
    return true;
  } catch (error) {
    if (error.message.includes("stream ended")) {
      ui.log.write(
        colorSpec.errorMsg("Connection failed! Other peer is offline.")
      );
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
    return false;
  }
}

async function dialAuth(peerMaStr) {
  await p2pNode.dialProtocol(peerMaStr, "/auth/request");
}
