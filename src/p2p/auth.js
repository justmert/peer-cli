"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import { p2pNode } from "./p2p.js";
import { pipe } from "it-pipe";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { clearScreen, colorSpec } from "../utils/utils.js";
import { ui } from "../main/main.js";
import { globalRl, isVisible, makeUnvisible } from "./chat.js";
import { stdinToStream, streamToConsole } from "./stream.js";

export async function authAnswer(stream, connection) {
  if (globalRl) {
    globalRl.close();
  }
  clearScreen();
  pipe(stream, (source) =>
    (async function () {
      for await (const msg of source) {
        if (uint8ArrayToString(msg.subarray()) === true.toString()) {
          const streamChat = await p2pNode.dialProtocol(
            connection.remoteAddr,
            "/chat"
          );
          stdinToStream(streamChat, connection);
          streamToConsole(streamChat, connection);
        } else {
          ui.log.write(
            colorSpec.errorMsg("Sorry, the peer declined your request.")
          );
          process.exit(1);
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

export async function authRequest(stream, connection) {
  if (globalRl) {
    globalRl.close();
  }
  if ((await isVisible()) === false) {
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
      short: "",
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
  if (!accepted) {
    ui.log.write(colorSpec.warnMsg("You have declined the request."));
    await makeUnvisible();
    if (p2pNode.isStarted()) {
      const streamId = stream.id;
      stream.abort();
      stream.close();
      connection.removeStream(streamId);
      connection.close();
    }
    // process.exit(0);
  }
}
