"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import { exit } from "process";
import { setMaxListeners } from "events";
import * as IPFSNode from "ipfs-core";
import { clearScreen, colorSpec } from "../utils/utils.js";
import clc from "cli-color";
import { uploadOptionFuzzy } from "./options/upload.js";
import { getOption } from "./options/get.js";
import { listOption } from "./options/list.js";
import { mfsOption } from "../mfs/mfs.js";
import { chatNavigate } from "../p2p/chat.js";

setMaxListeners(1024);
process.removeAllListeners("warning");
inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));

export const ui = new inquirer.ui.BottomBar();
// export const ipfs = undefined;
export const ipfs = await IPFSNode.create({
  libp2p: {
    connectionManager: {
      autoDial: false,
    },
  },
});

// [`StreamClosed`, `uncaughtException`].forEach((eventType) => {
//   process.on(eventType, main.bind(null));
// });

// function exitProgram(eventType) {
//   console.log(colorSpec.infoMsg(`[${eventType}] Exiting program...`));
//   process.exit(0);
// }

// function exitProgram(eventType) {
//   console.log(colorSpec.infoMsg(`[${eventType}] Exiting program...`));

clearScreen();
async function main() {
  while (true) {
    await inquirer
      .prompt({
        type: "list",
        name: "job",
        prefix: clc.bold.red("❤"),
        message: "What do you want to do?",
        choices: [
          { value: "upload", name: "Upload file/dir to the IPFS" },
          { value: "get", name: "Show/Save file/dir content from the IPFS" },
          { value: "list", name: "List in the IPFS" },
          {
            value: "navigate",
            name: "Navigate in IPFS MFS",
          },
          {
            value: "chat",
            name: "Peer to peer chat",
          },
          {
            value: "transfer",
            name: "Peer to peer transfer",
          },
        ],
      })
      .then(async (answers) => {
        if (answers.job === "upload") {
          clearScreen();
          await uploadOptionFuzzy();
        } else if (answers.job === "get") {
          clearScreen();
          await getOption();
        } else if (answers.job === "list") {
          clearScreen();
          await listOption();
        } else if (answers.job === "navigate") {
          await mfsOption();
        }
        if (answers.job === "chat") {
          await chatNavigate();
        } else if (answers.job === "transfer") {
          ui.log.write(colorSpec.infoMsg("Coming soon..."));
        }
      })
      .catch((error) => {
        if (error.isTtyError) {
          console.log("Prompt couldn't be rendered in the current environment");
        } else {
          console.log("Something else went wrong");
          console.log(error);
        }
        exit(1);
      });
  }
}

await main();
