"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

var clc = require("cli-color");

export const clearScreen = async () => {
    process.stdout.write("\u001b[2J\u001b[0;0H");
}

export const colorSpec = {
    errorMsg: (x) => {
      return colorSpec.errorIcon + "  " + clc.red.bold(x) + "\n\n";
    },
    warnMsg: (x) => {
      return colorSpec.warnIcon + "  " + clc.yellow(x) + "\n\n";
    },
    infoMsg: (x) => {
      return colorSpec.infoIcon + "  " + clc.cyan(x) + "\n\n";
    },
    errorIcon: clc.red.bold("✖"),
    successIcon: clc.green.bold("✔"),
    warnIcon: clc.yellow("⚠"),
    infoIcon: clc.cyan("ℹ"),
    promptIcon: clc.blue("➜"),
    fileColor: clc.magenta,
    dirColor: clc.green,
    sentMessageColor: clc.cyan,
    receivedMessageColor: clc.magenta,
  };

export default {clearScreen}