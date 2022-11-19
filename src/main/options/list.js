"use strict";
import inquirer from "inquirer";
import { ui } from "../main.js";
import clc from "cli-color";
import { CID } from "multiformats/cid";
import { listFiles, getCidType, catFile } from "../core.js ";
import { saveLocal } from "./get.js";

export const listOption = async () => {
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
        const status = await listAction(cidType, providedCid);

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

async function listAction(cidType, providedCid) {
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
