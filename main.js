"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import all from "it-all";
import fs from "fs";
import { exit } from "process";
import { setMaxListeners } from "events";
import mfsOption from "./mfs.js";
import * as IPFSNode from "ipfs-core";
import { chatNavigate } from "./p2pChat.js";
import { clearScreen, colorSpec } from "./utils.js";
import clc from "cli-color";
const { readdir, stat } = require("fs/promises");
const { join } = require("path");
var path = require("path");
import tar from "tar-stream";
const { Readable } = require("stream");
inquirer.registerPrompt("fuzzypath", require("inquirer-fuzzy-path"));
import { CID } from "multiformats/cid";

setMaxListeners(1024);
process.removeAllListeners("warning");

export const ui = new inquirer.ui.BottomBar();
export const ipfs = await IPFSNode.create({
  libp2p: {
    connectionManager: {
      autoDial: false,
    },
  },
});

async function main() {
  clearScreen();
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
            name: "Peer Chat",
          },
          {
            value: "transfer",
            name: "Peer Transfer",
          },
        ],
      })
      .then(async (answers) => {
        if (answers.job === "chat") {
          await chatNavigate();
        } else if (answers.job === "transfer") {
          await transferNavigate();
        } else if (answers.job === "upload") {
          clearScreen();
          await uploadOptionFuzzy();
        } else if (answers.job === "get") {
          clearScreen();
          await getOption();
        } else if (answers.job === "list") {
          await listOption();
        } else if (answers.job === "navigate") {
          await mfsOption();
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

async function uploadOption() {
  await inquirer
    .prompt({
      type: "input",
      name: "path",
      message:
        "Enter the path of the file to upload ( " +
        clc.blackBright("type `back!` to exit") +
        "): ",
      validate(value) {
        if (value === "back!") {
          return true;
        } else if (fs.existsSync(value)) {
          return true;
        } else {
          return "Please enter a valid path";
        }
      },
    })
    .then(async (answers) => {
      if (answers.path === "back!") {
        return;
      }
      await saveToIpfs(answers.path);
    });
}

async function uploadOptionFuzzy() {
  await inquirer
    .prompt([
      {
        type: "fuzzypath",
        name: "path",
        itemType: "any",
        rootPath: `${process.cwd()}`,
        message:
          "Enter the path of the file/dir to upload " +
          clc.blackBright("(type `back!` to exit): "),
        default: `${process.cwd()}`,
        suggestOnly: true,
        depthLimit: 1,
        validate(value) {
          if (value === "back!") {
            return true;
          } else if (fs.existsSync(value)) {
            return true;
          } else {
            return "Please enter a valid path";
          }
        },
      },
    ])
    .then(async (answers) => {
      if (answers.path === "back!") {
        return;
      }
      await saveToIpfs(answers.path);
    });
}

var totalStdoutColumns = process.stdout.columns || 100;
process.stdout.on("resize", function () {
  totalStdoutColumns = process.stdout.columns;
});

const dirSize = async (dir) => {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async (file) => {
    const fPath = join(dir, file.name);

    if (file.isDirectory()) {
      return await dirSize(fPath);
    }

    if (file.isFile()) {
      const { size } = await stat(fPath);
      return size;
    }

    return 0;
  });

  return (await Promise.all(paths))
    .flat(Infinity)
    .reduce((i, size) => i + size, 0);
};

var ipfsTotalByteUploaded = 0;
var totalProvidedSize = 0;
async function byteProcess(x, y) {
  ipfsTotalByteUploaded = ipfsTotalByteUploaded + x;
  let barPercent = Math.ceil(
    (ipfsTotalByteUploaded / totalProvidedSize) * totalStdoutColumns
  );
  let realPercent = Math.min(
    Math.ceil((ipfsTotalByteUploaded / totalProvidedSize) * 100),
    99
  );

  let prefix = `Uploading: ${realPercent.toString()}% `;
  let prefixLength = prefix.length;
  let bar = "█".repeat(
    Math.min(
      Math.max(barPercent - prefixLength - 3, 1),
      totalStdoutColumns - prefixLength - 4
    )
  );
  let bottomBar = colorSpec.infoMsg(`${prefix}${bar}`);
  ui.updateBottomBar(bottomBar);
}

const saveToIpfs = async (providedPath) => {
  ipfsTotalByteUploaded = 0;
  totalProvidedSize = 0;
  const fileStats = fs.lstatSync(providedPath);

  const addOptions = {
    pin: true,
    wrapWithDirectory: true,
    timeout: 1000 * 60 * 5,
    progress: byteProcess,
  };

  if (fileStats.isDirectory()) {
    await (async () => {
      totalProvidedSize = await dirSize(providedPath);
    })();
    const globSourceOptions = {
      recursive: true,
      hidden: true,
    };

    for await (const addedFile of ipfs.addAll(
      IPFSNode.globSource(providedPath, "**/*", globSourceOptions),
      addOptions
    )) {
      if (addedFile.path.trim() === "") {
        ui.log.write(
          colorSpec.infoMsg(
            `Root directory ${providedPath} added to IPFS with CID: ${addedFile.cid}`
          )
        );
      } else {
        ui.log.write(
          `${providedPath}/${addedFile.path} added with CID ${addedFile.cid}`
        );
      }
    }
  } else {
    totalProvidedSize = fileStats.size
    const fileObj = {
      path: providedPath,
      content: fs.createReadStream(providedPath),
      mtime: fileStats.mtime,
    };
    const addedFile = await ipfs.add(fileObj, addOptions);
    ui.log.write(
      colorSpec.infoMsg(`File ${providedPath} added with CID ${addedFile.cid}`)
    );
  }
  ui.updateBottomBar("");
  ui.log.write(
    clc.magenta(
      `Upload complete! Total Bytes Uploaded: ${ipfsTotalByteUploaded}\n`
    )
  );
};

const getFile = async (cid) => {
  var allBuffers = [];
  for await (const buf of ipfs.get(cid)) {
    allBuffers.push(buf);
  }
  return new Buffer.concat(allBuffers);
};

const catFile = async (ipfsPath) => {
  let allBuffers = [];
  for await (const chunk of ipfs.cat(ipfsPath)) {
    allBuffers.push(chunk);
  }
  return Buffer.concat(allBuffers).toString("utf8");
};

const listFiles = async (ipfsPath) => {
  const files = await all(ipfs.ls(ipfsPath));
  return files;
};

const getCidType = async (files) => {
  let cidType = undefined;
  if (files.length === 1) {
    if (files[0].name === files[0].path) cidType = "file";
    else cidType = "dir";
  } else if (files.length === 0) cidType = "empty";
  else cidType = "dir";
  return cidType;
};

function extractTar(buffer, outputPath) {
  return new Promise((resolve) => {
    let extract = tar.extract();

    extract.on("entry", (header, stream, next) => {
      let p = path.join(outputPath, header.name);
      let opts = { mode: header.mode };
      if (header.type === "directory") {
        fs.mkdirSync(p, opts, (err) => {
          if (err) throw err;
          next();
        });
      } else {
        stream.pipe(fs.createWriteStream(p, opts));
        next();
      }

      stream.resume();
      stream.on("end", function () {
        next(); // ready for next entry
      });
    });
    extract.on("finish", function () {
      // all entries read
      resolve();
    });
    Readable.from(buffer).pipe(extract);
  });
}

async function saveLocal(providedCid) {
  await inquirer
    .prompt({
      type: "input",
      name: "savePath",
      message:
        "Enter the path to save the file " +
        clc.blackBright(`(default is current path): `),
      default() {
        return process.cwd();
      },
      validate(value) {
        if (value === "back!") {
          return true;
        } else if (fs.existsSync(value)) {
          return true;
        } else {
          return "Please enter a valid path";
        }
      },
    })
    .then(async (answers) => {
      await getFile(providedCid).then(async (buffer) => {
        await extractTar(buffer, answers.savePath);
      });
    });
}
async function listActionOption(cidType, providedCid) {
  let fileAction = [];
  if (cidType === "dir") {
    fileAction = fileAction.concat([
      { value: "enter", name: "Enter directory" },
      { value: "save", name: "Save directory to local" },
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  } else if (cidType === "file") {
    fileAction = fileAction.concat([
      { value: "save", name: "Save file to local path" },
      { value: "show", name: "Show file contents" },
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  } else if (cidType === "empty") {
    fileAction = fileAction.concat([
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  }
  var returnStatus = undefined;
  await inquirer
    .prompt({
      type: "list",
      name: "fileAction",
      message: "What to do?",
      choices: fileAction,
    })
    .then(async (answers) => {
      if (answers.fileAction === "save") {
        await saveLocal(providedCid);
      } else if (answers.fileAction === "show") {
        const fileContent = await catFile(providedCid);
        ui.log.write(fileContent);
      }
      returnStatus = answers.fileAction;
    });
  return returnStatus;
}

const listOption = async () => {
  await inquirer
    .prompt({
      type: "input",
      name: "ipfsPath",
      message:
        "Enter the CID of file/directory " +
        clc.blackBright("(type `back!` to go back): "),
      validate(value) {
        if (value === "back!") {
          return true;
        } else if (
          value === undefined ||
          value === null ||
          value.trim() === ""
        ) {
          return "Can not be empty!";
        } else {
          try {
            CID.parse(value);
          } catch (error) {
            return "Please enter a valid CID";
          }
          return true;
        }
      },
    })
    .then(async (answers) => {
      if (answers.ipfsPath === "back!") {
        return;
      }
      var providedCid = answers.ipfsPath;
      var lastPath = providedCid;
      while (providedCid) {
        const files = await listFiles(providedCid);
        const cidType = await getCidType(files);
        const status = await listActionOption(cidType, providedCid);

        if (status === "enter") {
          let pathChoices = [];
          files.forEach((file) => {
            pathChoices.push({
              name: `${file.type} - ${file.name} (${file.cid})`,
              value: file.cid.toString(),
            });
          });
          await inquirer
            .prompt({
              type: "list",
              name: "provided",
              message: "Directory contents: ",
              choices: pathChoices,
            })
            .then(async (answers) => {
              lastPath = providedCid;
              providedCid = answers.provided;
            });
        } else if (status === "back") {
          if (lastPath === providedCid) {
            return;
          }
          providedCid = lastPath;
        } else if (status === "exit") {
          return;
        }
      }
    });
};

const getOption = async () => {
  await inquirer
    .prompt({
      type: "input",
      name: "ipfsPath",
      message:
        "Enter the CID of file/directory " +
        clc.blackBright("(type `back!` to go back): "),
      validate(value) {
        if (value === "back!") {
          return true;
        } else if (
          value === undefined ||
          value === null ||
          value.trim() === ""
        ) {
          return "Can not be empty!";
        } else {
          try {
            CID.parse(value);
          } catch (error) {
            return "Please enter a valid CID";
          }
          return true;
        }
      },
    })
    .then(async (answers) => {
      if (answers.ipfsPath === "back!") {
        return;
      }
      const providedCid = answers.ipfsPath;
      const files = await listFiles(providedCid);
      const cidType = await getCidType(files);

      ui.log.write("\n");
      files.forEach((file) => {
        if (file.type === "dir") {
          ui.log.write(
            `${colorSpec.dirColor(file.type)} - ${file.name} ${clc.blackBright(
              "(" + file.cid + ")"
            )}`
          );
        } else {
          ui.log.write(
            `${colorSpec.fileColor(file.type)} - ${file.name} ${clc.blackBright(
              "(" + file.cid + ")"
            )}`
          );
        }
      });
      ui.log.write("\n");

      let fileAction = [];
      if (cidType === "dir") {
        fileAction = fileAction.concat([
          { value: "save", name: "Save directory to local" },
          { value: "exit", name: "Go to main options" },
        ]);
      } else if (cidType === "file") {
        fileAction = fileAction.concat([
          { value: "save", name: "Save file to local path" },
          { value: "show", name: "Show file contents" },
          { value: "exit", name: "Go to main options" },
        ]);
      } else if (cidType === "empty") {
        fileAction = fileAction.concat([
          { value: "exit", name: "Go to main options" },
        ]);
      }
      await inquirer
        .prompt({
          type: "list",
          name: "fileAction",
          message: "What to do?",
          choices: fileAction,
        })
        .then(async (answers) => {
          if (answers.fileAction === "save") {
            await saveLocal(providedCid);
          } else if (answers.fileAction === "show") {
            const fileContent = await catFile(providedCid);
            ui.log.write(fileContent);
          }
        });
    });
};

await main();
