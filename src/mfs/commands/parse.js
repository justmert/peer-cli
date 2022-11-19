import inquirer from 'inquirer';
import { ui } from '../../main/main.js';
import { colorSpec } from '../../utils/utils.js';
import { MFSCommands } from './commands.js';


export async function parseArguments(userProvidedCommand) {
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
  