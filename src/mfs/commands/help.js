import { createRequire } from "module";
const require = createRequire(import.meta.url);
var clc = require("cli-color");

const manLS = `\
${clc.bold.cyan("ls")} (optional: [path, ...]) - List directory contents`;

const manCD = `\
${clc.bold.cyan("cd")} [path] - Change directory`;

const manPWD = `\
${clc.bold.cyan("pwd")} - Output the current working directory`;

const manMKDIR = `\
${clc.bold.cyan("mkdir")} [path, ...] - Make directory`;

const manRM = `\
${clc.bold.cyan("rm")} [path, ...] - Remove file or directory`;

const manSTAT = `\
${clc.bold.cyan("stat")} [path, ...] - Get file or directory statistics`;

const manFLUSH = `\
${clc.bold.cyan("flush")} [path, ...] - Flush a given path's data to the disk`;

const manREAD = `\
${clc.bold.cyan("read")} [path] - Read a file`;

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

export const MFSCommandHelp = {
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

export const helpMessage =
  clc.bold.cyan("MFS Commands\n") +
  Object.values(MFSCommandHelp).join("\n") +
  "\n\n";
