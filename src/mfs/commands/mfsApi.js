import { ipfs, ui } from "../../main/main.js";
import { colorSpec } from "../../utils/utils.js";
import { concat as uint8ArrayConcat } from "uint8arrays/concat";
import { TextEncoder } from "util";

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

export {
  mfsLS,
  mfsStat,
  mfsMkdir,
  mfsRm,
  mfsCp,
  mfsMv,
  mfsTouch,
  mfsFlush,
  mfsRead,
  mfsWrite,
};
