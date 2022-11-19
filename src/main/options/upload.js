"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import { colorSpec } from "../../utils/utils.js";
import { ipfs, ui } from "../main.js";
import fs from "fs";
import * as IPFSNode from "ipfs-core";
import clc from "cli-color";
const { readdir, stat } = require("fs/promises");
const { join } = require("path");

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
    totalProvidedSize = fileStats.size;
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

export async function uploadOption() {
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

export async function uploadOptionFuzzy() {
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
