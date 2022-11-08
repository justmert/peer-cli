"use strict";
import inquirer from "inquirer";
import * as IPFS from "ipfs-core";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
var clc = require("cli-color");
var ui = undefined;
var ipfs = undefined;
import fs from "fs";
import { env } from "node:process";
import { stdin } from "process";
import { concat as uint8ArrayConcat } from "uint8arrays/concat";
import { TextEncoder } from "util";
const tmp = require("tmp");
import { colorSpec } from "./main.js";
// import * as isIPFS from 'is-ipfs'

const execSync = require("child_process").execSync;
tmp.setGracefulCleanup();

const mfsLS = async (currentPath) => {
  let allFiles = [];
  try {
    for await (const file of ipfs.files.ls(currentPath)) {
      allFiles.push(file);
    }
  } catch (error) {
    // ui.log.write(colorSpec.errorMsg(error.message));
    return null;
  }
  return allFiles;
};

const mfsStat = async (statPath, verbose = true) => {
  let stat = undefined;
  try {
    stat = await ipfs.files.stat(statPath);
  } catch (error) {
    if (verbose) {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
    return null;
  }
  return stat;
};

const mfsMkdir = async (mkdirPath) => {
  try {
    await ipfs.files.mkdir(mkdirPath, { parents: true });
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsRm = async (rmPaths) => {
  try {
    await ipfs.files.rm(rmPaths, { recursive: true });
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsCp = async (cpFrom, cpTo) => {
  try {
    await ipfs.files.cp(cpFrom, cpTo);
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsTouch = async (touchPath) => {
  try {
    await ipfs.files.touch(touchPath);
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsFlush = async (flushPath) => {
  try {
    await ipfs.files.flush(flushPath);
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsRead = async (readPath) => {
  const chunks = [];
  try {
    for await (const chunk of ipfs.files.read(readPath)) {
      chunks.push(chunk);
    }
    return new TextDecoder().decode(uint8ArrayConcat(chunks));
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }
  return null;
};

const mfsWrite = async (writePath, writeContent) => {
  try {
    await ipfs.files.write(writePath, new TextEncoder().encode(writeContent), {
      create: true,
      parents: true,
      truncate: true,
    });
  } catch (error) {
    ui.log.write(colorSpec.errorMsg(error.message));
  }

  return null;
};

const MFSCommands = {
  LS: "ls",
  HELP: "help",
  CD: "cd",
  PWD: "pwd",
  CAT: "cat",
  CHMOD: "chmod",
  CP: "cp",
  RM: "rm",
  MKDIR: "mkdir",
  STAT: "stat",
  TOUCH: "touch",
  READ: "read",
  CAT: "cat", // alias for read
  WRITE: "write",
  OPEN: "open", // alias for write
  MV: "mv",
  FLUSH: "flush",
};
async function parseArguments(userProvidedCommand) {
  const userProvidedSplitted = userProvidedCommand
    .split(" ")
    .map((x) => x.trim())
    .filter((x) => x !== "");
  if (userProvidedSplitted.length === 0) {
    return null;
  }
  const command = userProvidedSplitted.shift();
  const commandArgs = userProvidedSplitted;

  if (command === MFSCommands.LS.toString()) {
    if (commandArgs.length === 0) {
      return [MFSCommands.LS, null];
    } else {
      ui.log.write(
        colorSpec.errorMsg("LS command does not accept any arguments")
      );
      return null;
    }
  } else if (command === MFSCommands.CD.toString()) {
    if (commandArgs.length === 1) {
      return [MFSCommands.CD, commandArgs[0]];
    } else if (commandArgs.length === 0) {
      return [MFSCommands.CD, "/"];
    } else {
      ui.log.write(colorSpec.errorMsg("CD command accepts only one argument"));
      return null;
    }
  } else if (command === MFSCommands.PWD.toString()) {
    if (commandArgs.length === 0) {
      return [MFSCommands.PWD, null];
    } else {
      ui.log.write(
        colorSpec.errorMsg("PWD command does not accept any arguments")
      );
      return null;
    }
  } else if (command === MFSCommands.MKDIR.toString()) {
    if (commandArgs.length === 1) {
      return [MFSCommands.MKDIR, commandArgs[0]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("MKDIR command accepts only one argument")
      );
      return null;
    }
  } else if (command === MFSCommands.RM.toString()) {
    if (commandArgs.length > 0) {
      return [MFSCommands.RM, commandArgs];
    } else {
      ui.log.write(
        colorSpec.errorMsg("RM command accepts at least one argument")
      );
      return null;
    }
  } else if (command === MFSCommands.STAT.toString()) {
    if (commandArgs.length === 1) {
      return [MFSCommands.STAT, commandArgs[0]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("STAT command accepts only one argument")
      );
      return null;
    }
  } else if (command === MFSCommands.CP.toString()) {
    if (commandArgs.length > 1) {
      const toDir = commandArgs.pop();
      return [MFSCommands.CP, [commandArgs, toDir]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("CP command accepts at least two arguments")
      );
      return null;
    }
  } else if (command === MFSCommands.MV.toString()) {
    if (commandArgs.length > 1) {
      const toDir = commandArgs.pop();
      return [MFSCommands.MV, [commandArgs, toDir]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("MV command accepts at least two arguments")
      );
      return null;
    }
  } else if (command == MFSCommands.TOUCH.toString()) {
    if (commandArgs.length === 1) {
      return [MFSCommands.TOUCH, commandArgs[0]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("TOUCH command accepts only one argument")
      );
      return null;
    }
  } else if (command == MFSCommands.FLUSH.toString()) {
    if (commandArgs.length === 1) {
      return [MFSCommands.FLUSH, commandArgs[0]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("FLUSH command accepts only one argument")
      );
      return null;
    }
  } else if (command == MFSCommands.CHMOD.toString()) {
    if (commandArgs.length === 2) {
      return [MFSCommands.CHMOD, [commandArgs[0], commandArgs[1]]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("CHMOD command accepts only two arguments")
      );
      return null;
    }
  } else if (
    command == MFSCommands.READ.toString() ||
    command == MFSCommands.CAT.toString()
  ) {
    if (commandArgs.length === 1) {
      return [MFSCommands.READ, commandArgs[0]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("READ command accepts only one argument")
      );
      return null;
    }
  } else if (
    command == MFSCommands.WRITE.toString() ||
    command == MFSCommands.OPEN.toString()
  ) {
    if (commandArgs.length === 1) {
      let fileContent = undefined;
      let editorVar = env.EDITOR;
      if (editorVar === undefined || editorVar === null || editorVar === "") {
        ui.log.write(
          colorSpec.warnMsg(
            "No editor found. Please set the EDITOR environment variable."
          )
        );

        editorVar = "nano";
        ui.log.write(colorSpec.infoMsg("Opening in Nano..."));
      }
      const tmpobj = tmp.fileSync();

      // If we don't need the file anymore we could manually call the removeCallback
      // But that is not necessary if we didn't pass the keep option because the library
      // will clean after itself.
      stdin.pause();
      ui.log.pause();
      const fileOpenCommand = `${editorVar} ${tmpobj.name}`;
      execSync(fileOpenCommand, { stdio: "inherit" });
      var buffer = fs.readFileSync(tmpobj.name);
      fileContent = buffer.toString();
      tmpobj.removeCallback();
      stdin.resume();
      ui.log.resume();
      return [MFSCommands.WRITE, [commandArgs[0], fileContent]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("WRITE command accepts only one argument")
      );
      return null;
    }
  }

  ui.log.write(colorSpec.errorMsg("Unknown command"));
  return null;
}

const clearScreen = () => {
  // Clear the screen,
  process.stdout.write("\u001b[2J\u001b[0;0H");
};

export default async function navigateOption(localUI, localIpfs) {
  ui = localUI;
  ipfs = localIpfs;
  clearScreen();

  ui.log.write(
    "========== Welcome to IPFS Mutable File System (MFS) =========="
  );
  ui.log.write(colorSpec.infoMsg("Type `help` to see available commands"));
  const mfsPrompt = `ipfs-mfs `;
  var currentPath = "/";
  const rootStat = await mfsStat("/");
  var currentStat = rootStat.cid.toString();
  var prevPath = "/";
  var fileStat = await mfsStat("/");

  while (true) {
    const question = {
      type: "input",
      name: "inputPrompt",
      message: `${mfsPrompt} ${clc.blackBright(currentStat)} (${currentPath}) ${
        colorSpec.promptIcon
      } `,
    };
    await inquirer.prompt(question).then(async (answers) => {
      const inputPrompt = answers.inputPrompt.trim();
      const userCommand = await parseArguments(inputPrompt);
      if (userCommand !== null) {
        const [command, args] = userCommand;
        const allFiles = await mfsLS(currentPath);
        let fileNames = [];
        if (allFiles) {
          fileNames = allFiles.map((x) => x.name);
        }
        if (fileStat !== null) {
          currentStat = fileStat.cid.toString();
        } else {
          currentPath = prevPath;
          prevPath = currentPath;
          return;
        }

        if (command === MFSCommands.LS) {
          allFiles.forEach((file) => {
            if (file.type === "directory") {
              ui.log.write(
                `${colorSpec.dirColor(file.type)} - ${clc.bold(file.name)} (${
                  file.cid
                })`
              );
            } else {
              ui.log.write(
                `${colorSpec.fileColor(file.type)} - ${clc.bold(file.name)} (${
                  file.cid
                })`
              );
            }
          });
          if (allFiles.length > 0) {
            ui.log.write("");
          }
        } else if (command === MFSCommands.CD) {
          let tempPath = undefined;
          if (fileNames.includes(args)) {
            if (args === "/") {
              tempPath = currentPath;
              currentPath = "/";
            } else if (currentPath === "/") {
              tempPath = currentPath;
              currentPath = currentPath + args;
            } else {
              tempPath = currentPath;
              currentPath = `${currentPath}/${args}`;
            }
          } else if (args === "..") {
            tempPath = currentPath;
            currentPath = currentPath.split("/").slice(0, -1).join("/");

            if (currentPath === "") {
              currentPath = "/";
            }
          } else {
            tempPath = currentPath;
            currentPath = args;
          }
          const tempStat = await mfsStat(currentPath, false);
          if (tempStat === null) {
            currentPath = tempPath;
            ui.log.write(colorSpec.errorMsg("No such directory"));
          } else {
            fileStat = tempStat;
          }
        } else if (command === MFSCommands.PWD) {
          ui.log.write(currentPath);
        } else if (command === MFSCommands.MKDIR) {
          if (args.startsWith("/")) {
            await mfsMkdir(`${args}`);
          } else {
            await mfsMkdir(`${currentPath}/${args}`);
          }
        } else if (command === MFSCommands.RM) {
          await mfsRm(
            args.map((argElement) => {
              return relativeToAbsoluteExistPath(
                argElement,
                currentPath,
                allFiles
              );
            })
          );
        } else if (command === MFSCommands.STAT) {
          const statData = await mfsStat(
            relativeToAbsoluteExistPath(args, currentPath, allFiles)
          );
          if (statData !== null) {
            statData.cid = statData.cid.toString();
            if (statData.mtime !== undefined) {
              statData.mtime = JSON.stringify(statData.mtime);
            }
            Object.keys(statData).forEach((key) => {
              ui.log.write(`${clc.cyan.bold(key)}: ${statData[key]}`);
            });
          }
          ui.log.write("");
        } else if (command === MFSCommands.FLUSH) {
          await mfsFlush(args);
        } else if (command === MFSCommands.READ) {
          const fileData = await mfsRead(
            relativeToAbsoluteExistPath(args, currentPath, allFiles)
          );
          if (fileData !== null) {
            ui.log.write(fileData);
          }
          ui.log.write("");
        } else if (command == MFSCommands.TOUCH) {
          await mfsTouch(
            relativeToAbsoluteExistPath(args, currentPath, allFiles)
          );
        } else if (command === MFSCommands.WRITE) {
          const [filePath, fileData] = args;
          let absolutePath = filePath;
          if (filePath.startsWith("/")) {
            absolutePath = filePath;
          } else {
            absolutePath = `${currentPath}/${filePath}`;
          }
          await mfsWrite(absolutePath, fileData);
        } else if (command === MFSCommands.CP) {
          const [fromPaths, toPath] = args;
          let absolutePath = toPath;
          if (toPath.startsWith("/")) {
            absolutePath = toPath;
          } else {
            absolutePath = `${currentPath}/${toPath}`;
          }
          await mfsCp(
            fromPaths.map((x) =>
              relativeToAbsoluteExistPath(x, currentPath, allFiles)
            ),
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
          await mfsMv(
            fromPaths.map((x) =>
              relativeToAbsoluteExistPath(x, currentPath, allFiles)
            ),
            absolutePath
          );
        }
      }
    });
  }
}

const relativeToAbsoluteExistPath = (
  requestedPath,
  currentPath,
  listedFiles
) => {
  let toPathCorrected = undefined;
  if (listedFiles.map((x) => x.name).includes(requestedPath)) {
    if (currentPath === "/") {
      toPathCorrected = `/${requestedPath}`;
    } else {
      toPathCorrected = `${currentPath}/${requestedPath}`;
    }
  } else {
    toPathCorrected = requestedPath;
  }
  return toPathCorrected;
};
