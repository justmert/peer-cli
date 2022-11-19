"use strict";
import inquirer from "inquirer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
var clc = require("cli-color");
var figlet = require("figlet");
import { clearScreen, colorSpec } from "../utils/utils.js";
import { CID } from "multiformats/cid";
import { helpMessage, MFSCommandHelp } from "./commands/help.js";
import { MFSCommands } from "./commands/commands.js";
import * as mfs from "./commands/mfsApi.js";
import { ui } from "../main/main.js";
import { parseArguments } from "./commands/parse.js";
inquirer.registerPrompt("command", require("inquirer-command-prompt"));

export const welcomeScreen = async () => {
  await clearScreen();
  ui.log.write(
    clc.cyan(
      figlet.textSync("IPFS CLI", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );

  ui.log.write(
    clc.blackBright(
      "Mutable File System (MFS) is a tool built into IPFS that lets\n\
you treat files like you would a regular name-based filesystem.\n\
You can add, remove, move, and edit MFS files and have all\n\
the work of updating links and hashes taken care of for you.\n"
    )
  );

  ui.log.write(colorSpec.infoMsg("Type `help` to see available commands"));

  ui.log.write(
    colorSpec.infoMsg("Type `help [command]` to see how to use a command")
  );
};

const relativeToAbsolute = (reqPath, curPath, lFiles) => {
  let validPath = undefined;
  if (lFiles.map((x) => x.name).includes(reqPath)) {
    if (curPath === "/") {
      validPath = `/${reqPath}`;
    } else {
      validPath = `${curPath}/${reqPath}`;
    }
  } else {
    validPath = reqPath;
  }
  return validPath;
};

export async function mfsOption() {
  await welcomeScreen();

  const mfsPrompt = `ipfs-mfs `;
  const defaultIpfsPath = "/";
  var currentPath = defaultIpfsPath;
  const rootStat = await mfs.mfsStat(defaultIpfsPath);
  var currentStat = rootStat.cid.toString();
  var prevPath = defaultIpfsPath;
  var fileStat = await mfs.mfsStat(defaultIpfsPath);
  var doExit = false;
  while (!doExit) {
    const question = {
      type: "command",
      name: "inputPrompt",
      autoCompletion: Object.keys(MFSCommands),
      prefix: "● ",
      message: `${clc.blue.bold(mfsPrompt)} ${clc.blackBright(
        currentStat
      )} (${currentPath}) ${colorSpec.promptIcon} `,
    };
    await inquirer.prompt(question).then(async (answers) => {
      const inputPrompt = answers.inputPrompt.trim();
      const userCommand = await parseArguments(inputPrompt);
      if (userCommand !== null) {
        const [command, args] = userCommand;
        let fileNames = [];
        const allFiles = await mfs.mfsLS(currentPath);
        if (allFiles) {
          fileNames = allFiles.map((x) => x.name);
        }

        if (command === MFSCommands.LS) {
          for (const arg of args) {
            let realPath = null;
            if (fileNames.includes(arg)) {
              if (arg === "/") {
                realPath = "/";
              } else if (currentPath === "/") {
                realPath = currentPath + arg;
              } else {
                realPath = `${currentPath}/${args}`;
              }
            } else if (arg === "..") {
              realPath = currentPath.split("/").slice(0, -1).join("/");

              if (realPath === "") {
                realPath = "/";
              }
            } else if (arg === ".") {
              realPath = currentPath;
            } else {
              try {
                const parsed = CID.parse(arg);
                realPath = "/ipfs/" + arg;
              } catch (error) {
                realPath = args;
              }
            }

            const file = await mfs.mfsStat(realPath, false);
            if (file === null) {
              ui.log.write(
                colorSpec.errorMsg(`Directory ${realPath} does not exist`)
              );
            } else {
              const files = await mfs.mfsLS(realPath);
              files.forEach(async (file) => {
                if (file.type === "directory") {
                  ui.log.write(
                    `${colorSpec.dirColor(file.type)} - ${clc.bold(
                      file.name
                    )} (${file.cid})`
                  );
                } else {
                  ui.log.write(
                    `${colorSpec.fileColor(file.type)} - ${clc.bold(
                      file.name
                    )} (${file.cid})`
                  );
                }
              });
              if (files.length > 0) {
                ui.log.write("");
              }
            }
          }
        } else if (command === MFSCommands.CD) {
          let tempPath = undefined;
          if (fileNames.includes(args)) {
            tempPath = currentPath;
            if (args === "/") {
              currentPath = "/";
            } else if (currentPath === "/") {
              currentPath = currentPath + args;
            } else {
              currentPath = `${currentPath}/${args}`;
            }
          } else if (args === "..") {
            tempPath = currentPath;
            currentPath = currentPath.split("/").slice(0, -1).join("/");

            if (currentPath === "") {
              currentPath = "/";
            }
          } else if (args === ".") {
            tempPath = currentPath;
            currentPath = currentPath;
          } else {
            tempPath = currentPath;
            try {
              const parsed = CID.parse(args);
              currentPath = "/ipfs/" + args;
            } catch (error) {
              currentPath = args;
            }
          }
          const tempStat = await mfs.mfsStat(currentPath, false);
          if (tempStat === null) {
            currentPath = tempPath;
            ui.log.write(colorSpec.errorMsg("No such directory"));
          } else {
            fileStat = tempStat;
          }
        } else if (command === MFSCommands.PWD) {
          ui.log.write(currentPath + clc.blackBright(` (${currentStat})`));
        } else if (command === MFSCommands.MKDIR) {
          args.forEach(async (dirName) => {
            if (dirName.startsWith("/")) {
              await mfs.mfsMkdir(`${dirName}`);
            } else {
              await mfs.mfsMkdir(`${currentPath}/${dirName}`);
            }
          });
        } else if (command === MFSCommands.RM) {
          await mfs.mfsRm(
            args.map((argElement) => {
              return relativeToAbsolute(argElement, currentPath, allFiles);
            })
          );
        } else if (command === MFSCommands.STAT) {
          for (const arg of args) {
            const p = relativeToAbsolute(arg, currentPath, allFiles);
            const statData = await mfs.mfsStat(p);
            if (statData !== null) {
              ui.log.write(clc.bold.cyan(`Path: ${p}`));
              statData.cid = statData.cid.toString();
              if (statData.mtime !== undefined) {
                statData.mtime = JSON.stringify(statData.mtime);
              }
              Object.keys(statData).forEach((key) => {
                ui.log.write(`${clc.cyan.bold(key)}: ${statData[key]}`);
              });
              ui.log.write("");
            }
          }
        } else if (command === MFSCommands.FLUSH) {
          for (const arg of args) {
            await mfs.mfsFlush(relativeToAbsolute(arg, currentPath, allFiles));
          }
        } else if (command === MFSCommands.READ) {
          const fileData = await mfs.mfsRead(
            relativeToAbsolute(args, currentPath, allFiles)
          );
          if (fileData !== null) {
            ui.log.write(fileData);
          }
          ui.log.write("");
        } else if (command == MFSCommands.TOUCH) {
          for (const arg of args) {
            await mfs.mfsTouch(relativeToAbsolute(arg, currentPath, allFiles));
          }
        } else if (command === MFSCommands.WRITE) {
          const [filePath, fileData] = args;
          let absolutePath = filePath;
          if (filePath.startsWith("/")) {
            absolutePath = filePath;
          } else {
            absolutePath = `${currentPath}/${filePath}`;
          }
          await mfs.mfsWrite(absolutePath, fileData);
        } else if (command === MFSCommands.CP) {
          const [fromPaths, toPath] = args;
          let absolutePath = toPath;
          if (toPath.startsWith("/")) {
            absolutePath = toPath;
          } else {
            absolutePath = `${currentPath}/${toPath}`;
          }
          await mfs.mfsCp(
            fromPaths.map((x) => relativeToAbsolute(x, currentPath, allFiles)),
            absolutePath
          );
        } else if (command === MFSCommands.MV) {
          const [fromPaths, toPath] = args;
          let absolutePath = toPath;
          if (toPath.startsWith("/")) {
            absolutePath = toPath;
          } else {
            absolutePath = `${currentPath}/${toPath}`;
          }
          await mfs.mfsMv(
            fromPaths.map((x) => relativeToAbsolute(x, currentPath, allFiles)),
            absolutePath
          );
        } else if (command === MFSCommands.HELP) {
          if (args === null) {
            ui.log.write(helpMessage);
          } else {
            for (const arg of args) {
              ui.log.write(
                MFSCommandHelp[arg.toLowerCase()] === undefined
                  ? colorSpec.errorMsg(`${arg} is not a valid command`)
                  : MFSCommandHelp[arg.toLowerCase()] + "\n\n"
              );
            }
          }
        } else if (command === MFSCommands.EXIT) {
          doExit = true;
        } else if (command === MFSCommands.CLEAR) {
          clearScreen();
        }

        if (fileStat !== null) {
          currentStat = fileStat.cid.toString();
        } else {
          currentPath = prevPath;
          prevPath = currentPath;
          return;
        }
      }
    });
  }
}
