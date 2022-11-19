"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import { colorSpec } from "../../utils/utils.js";
import { ui } from "../main.js";
import fs from "fs";
import clc from "cli-color";
var path = require("path");
import tar from "tar-stream";
const { Readable } = require("stream");
import { CID } from "multiformats/cid";
import { listFiles, getCidType, catFile } from "../core.js ";
import { getFile } from "../core.js";

export async function saveLocal(providedCid) {
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

export const getOption = async () => {
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

