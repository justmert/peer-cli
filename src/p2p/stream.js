"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { p2pNode, stopP2P } from "./p2p.js";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { clearScreen, colorSpec } from "../utils/utils.js";
import figlet from "figlet";
import { ui } from "../main/main.js";
import clc from "cli-color";

export const welcomeScreen = async () => {
  await clearScreen();
  ui.log.write(
    clc.cyan(
      figlet.textSync("CHAT STARTED", {
        font: ["Standard"],
        horizontalLayout: "controlled smushing",
        verticalLayout: "controlled smushing",
      })
    )
  );
};

var streamExited = false;
export async function stdinToStream(stream, connection) {
  // Read utf-8 from stdin
  await welcomeScreen();
  process.stdin.setEncoding("utf8");
  process.stdout.write(colorSpec.sentMessageColor(`(You) ${p2pNode.peerId}# `));
  //   var doExit = false;
  pipe(
    // Read from stdin (the source)
    process.stdin,

    (source) => {
      return (async function* () {
        for await (const msg of source) {
          if (streamExited) {
            process.exit(0);
            try {
              const streamId = stream.id;
              stream.close();
              stream.abort();
              stream.reset();
              connection.removeStream(streamId);

              connection.close();
            } catch (error) {}
            process.stdin.unpipe();
            process.stdout.unpipe();
            stopP2P();
            //   process.stdin.resume()
            // eventEmitter.emit("StreamClosed");
            throw new Error("StreamClosed");
          }
          process.stdout.write(
            colorSpec.sentMessageColor(`(You) ${p2pNode.peerId}# `)
          );
          if (msg.trim().toLowerCase() === "exit!") {
            // close process and stream break exit from the functiion
            ui.log.write(colorSpec.warnMsg("Stream closed by you!"));
            streamExited = true;
            yield uint8ArrayFromString("exit!");
          } else {
            yield msg;
          }
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

export async function streamToConsole(stream, connection) {
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
        if (msg.trim().toLowerCase() === "exit!") {
          // close process and stream break exit from the functiion
          try {
            const streamId = stream.id;
            stream.close();
            stream.abort();
            stream.reset();
            connection.removeStream(streamId);
            connection.close();
          } catch (error) {}
          ui.log.write(colorSpec.errorMsg("Stream closed by other peer!"));
          process.exit(1);
          streamExited = true;
          process.stdin.unpipe();
          process.stdout.unpipe();

          await stopP2P();
          //   process.stdin.resume()
          //   eventEmitter.emit("StreamClosed");
          throw new Error("StreamClosed");
        } else {
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
    }
  );
}
