"use strict";
import inquirer from "inquirer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
var clc = require("cli-color");
inquirer.registerPrompt("command", require("inquirer-command-prompt"));
import fs, { realpath } from "fs";
import { env } from "node:process";
import { stdin } from "process";
import { concat as uint8ArrayConcat } from "uint8arrays/concat";
import { TextEncoder } from "util";
const tmp = require("tmp");
import { colorSpec } from "./utils.js";
import { ipfs, ui } from "./main.js";
import { CID } from "multiformats/cid";
var figlet = require("figlet");

const execSync = require("child_process").execSync;
tmp.setGracefulCleanup();

const mfsLS = async (currentPath) => {
  let allFiles = [];
  try {
    for await (const file of ipfs.files.ls(currentPath)) {
      allFiles.push(file);
    }
  } catch (error) {
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
      if (error.message.includes("paths must start with a leading slash")) {
        ui.log.write(colorSpec.errorMsg("No such file or directory"));
      } else {
        ui.log.write(colorSpec.errorMsg(error.message));
      }
    }
    return null;
  }
  return stat;
};

const mfsMkdir = async (mkdirPath) => {
  try {
    await ipfs.files.mkdir(mkdirPath, { parents: true });
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }
  return null;
};

const mfsRm = async (rmPaths) => {
  try {
    await ipfs.files.rm(rmPaths, { recursive: true });
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }
  return null;
};

const mfsCp = async (cpFrom, cpTo) => {
  try {
    await ipfs.files.cp(cpFrom, cpTo);
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }
  return null;
};

const mfsMv = async (mvFrom, mvTo) => {
  try {
    await ipfs.files.cp(mvFrom, mvTo);
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }
  return null;
};

const mfsTouch = async (touchPath) => {
  try {
    await ipfs.files.touch(touchPath);
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }
  return null;
};

const mfsFlush = async (flushPath) => {
  try {
    await ipfs.files.flush(flushPath);
  } catch (error) {
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
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
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
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
    if (error.message.includes("paths must start with a leading slash")) {
      ui.log.write(colorSpec.errorMsg("No such file or directory"));
    } else {
      ui.log.write(colorSpec.errorMsg(error.message));
    }
  }

  return null;
};

const MFSCommands = {
  LS: "ls",
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
  CLEAR: "clear",
  EXIT: "exit",
  HELP: "help",
  MAN: "man",
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
      return [MFSCommands.LS, ["."]];
    } else {
      return [MFSCommands.LS, commandArgs];
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
    if (commandArgs.length > 0) {
      return [MFSCommands.MKDIR, commandArgs];
    } else {
      ui.log.write(
        colorSpec.errorMsg("MKDIR command accepts at least one argument")
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
    if (commandArgs.length > 0) {
      return [MFSCommands.STAT, commandArgs];
    } else {
      ui.log.write(
        colorSpec.errorMsg("STAT command accepts at least one argument")
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
    if (commandArgs.length > 0) {
      return [MFSCommands.TOUCH, commandArgs];
    } else {
      ui.log.write(
        colorSpec.errorMsg("TOUCH command accepts at least one argument")
      );
      return null;
    }
  } else if (command == MFSCommands.FLUSH.toString()) {
    if (commandArgs.length > 0) {
      return [MFSCommands.FLUSH, commandArgs];
    } else {
      ui.log.write(
        colorSpec.errorMsg("FLUSH command accepts at least one argument")
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
      var fileContent = null;
      await inquirer
        .prompt([
          {
            type: "editor",
            name: "content",
            message: "Write the content of the file to the editor",
          },
        ])
        .then((answers) => {
          fileContent = answers.content;
        });
      return [MFSCommands.WRITE, [commandArgs[0], fileContent]];
    } else {
      ui.log.write(
        colorSpec.errorMsg("WRITE command accepts only one argument")
      );
      return null;
    }
  } else if (command == MFSCommands.EXIT.toString()) {
    if (commandArgs.length === 0) {
      return [MFSCommands.EXIT, null];
    } else {
      ui.log.write(
        colorSpec.errorMsg("EXIT command does not accept any arguments")
      );
      return null;
    }
  } else if (command == MFSCommands.CLEAR.toString()) {
    if (commandArgs.length === 0) {
      return [MFSCommands.CLEAR, null];
    } else {
      ui.log.write(
        colorSpec.errorMsg("CLEAR command does not accept any arguments")
      );
      return null;
    }
  } else if (
    command == MFSCommands.HELP.toString() ||
    command == MFSCommands.MAN.toString()
  ) {
    if (commandArgs.length === 0) {
      return [MFSCommands.HELP, null];
    } else {
      return [MFSCommands.HELP, commandArgs];
    }
  }
  ui.log.write(
    colorSpec.errorMsg("Unknown command. Type `help` for available commands.")
  );
  return null;
}

const clearScreen = () => {
  // Clear the screen,
  process.stdout.write("\u001b[2J\u001b[0;0H");
};

const manLS = `\
${clc.bold.cyan("ls")} (optional: [path, ...]) - List directory contents`;

const manCD = `\
${clc.bold.cyan("cd")} [path] - Change directory`;

const manPWD = `\
${clc.bold.cyan("pwd")} - output the current working directory`;

const manMKDIR = `\
${clc.bold.cyan("mkdir")} [path, ...] - Make directory`;

const manRM = `\
${clc.bold.cyan("rm")} [path, ...] - Remove file or directory`;

const manSTAT = `\
${clc.bold.cyan("stat")} [path, ...] - Get file or directory statistics`;

const manFLUSH = `\
${clc.bold.cyan("flush")} [path, ...] - Flush a given path's data to the disk`;

const manREAD = `\
${clc.bold.cyan("read")} [path] [path] - Read a file`;

const manCAT = `\
${clc.bold.cyan("cat")} [path] - Alias for read`;

const manTOUCH = `\
${clc.bold.cyan(
  "touch"
)} [path, ...] - Update the mtime of a file or directory`;

const manWRITE = `\
${clc.bold.cyan("write")} [path] - Write to an MFS path`;

const manOPEN = `\
${clc.bold.cyan("open")} [path] - Alias for write`;

const manCP = `\
${clc.bold.cyan("cp")} [path] [to] - Copy files from one location to another`;

const manMV = `\
${clc.bold.cyan("mv")} [path] [to] - Move files from one location to another`;

const manHELP = `\
${clc.bold.cyan("help")} (optional: [command, ...]) - Show help`;

const manMan = `\
${clc.bold.cyan("man")} (optional: [command, ...]) - Alias for help`;

const manCLEAR = `\
${clc.bold.cyan("clear")} - Clear the screen`;

const manEXIT = `\
${clc.bold.cyan("exit")} - Exit the MFS shell`;

const MFSCommandHelp = {
  ls: manLS,
  cd: manCD,
  pwd: manPWD,
  mkdir: manMKDIR,
  rm: manRM,
  stat: manSTAT,
  flush: manFLUSH,
  read: manREAD,
  cat: manCAT,
  touch: manTOUCH,
  write: manWRITE,
  open: manOPEN,
  cp: manCP,
  mv: manMV,
  cp: manCP,
  mv: manMV,
  help: manHELP,
  man: manMan,
  clear: manCLEAR,
  exit: manEXIT,
};

const helpMessage =
  clc.bold.cyan("MFS Commands\n") +
  Object.values(MFSCommandHelp).join("\n") +
  "\n\n";

export default async function mfsOption() {
  clearScreen();
  ui.log.write(
    figlet.textSync("IPFS MFS", {
      font: "Standard",
      width: 80,
      whitespaceBreak: true,
      horizontalLayout: "full",
      verticalLayout: "full",
    })
  );

  ui.log.write(
    clc.blueBright(
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

  const mfsPrompt = `ipfs-mfs `;
  var currentPath = "/";
  const rootStat = await mfsStat("/");
  var currentStat = rootStat.cid.toString();
  var prevPath = "/";
  var fileStat = await mfsStat("/");
  var doExit = false;
  while (!doExit) {
    const question = {
      type: "command",
      name: "inputPrompt",
      autoCompletion: Object.keys(MFSCommands),
      prefix: "●",
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
        const allFiles = await mfsLS(currentPath);
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

            const file = await mfsStat(realPath, false);
            if (file === null) {
              ui.log.write(
                colorSpec.errorMsg(`Directory ${realPath} does not exist`)
              );
            } else {
              const files = await mfsLS(realPath);
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
          args.forEach(async (dirName) => {
            if (args.startsWith("/")) {
              await mfsMkdir(`${dirName}`);
            } else {
              await mfsMkdir(`${currentPath}/${dirName}`);
            }
          });
        } else if (command === MFSCommands.RM) {
          await mfsRm(
            args.map((argElement) => {
              return relativeToAbsolute(
                argElement,
                currentPath,
                allFiles
              );
            })
          );
        } else if (command === MFSCommands.STAT) {
          for (const arg of args) {
            const p = relativeToAbsolute(arg, currentPath, allFiles);
            const statData = await mfsStat(p);
            ui.log.write(clc.bold.cyan(`Path: ${p}`));
            if (statData !== null) {
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
            await mfsFlush(
              relativeToAbsolute(arg, currentPath, allFiles)
            );
          }
        } else if (command === MFSCommands.READ) {
          const fileData = await mfsRead(
            relativeToAbsolute(args, currentPath, allFiles)
          );
          if (fileData !== null) {
            ui.log.write(fileData);
          }
          ui.log.write("");
        } else if (command == MFSCommands.TOUCH) {
          await mfsTouch(
            relativeToAbsolute(args, currentPath, allFiles)
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
              relativeToAbsolute(x, currentPath, allFiles)
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
              relativeToAbsolute(x, currentPath, allFiles)
            ),
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

const relativeToAbsolute = (
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
