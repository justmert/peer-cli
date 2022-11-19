import { ipfs } from "./main.js";
import all from "it-all";

export const getFile = async (cid) => {
  var allBuffers = [];
  for await (const buf of ipfs.get(cid)) {
    allBuffers.push(buf);
  }
  return new Buffer.concat(allBuffers);
};

export const catFile = async (ipfsPath) => {
  let allBuffers = [];
  for await (const chunk of ipfs.cat(ipfsPath)) {
    allBuffers.push(chunk);
  }
  return Buffer.concat(allBuffers).toString("utf8");
};

export const listFiles = async (ipfsPath) => {
  const files = await all(ipfs.ls(ipfsPath));
  return files;
};

export const getCidType = async (files) => {
  let cidType = undefined;
  if (files.length === 1) {
    if (files[0].name === files[0].path) cidType = "file";
    else cidType = "dir";
  } else if (files.length === 0) cidType = "empty";
  else cidType = "dir";
  return cidType;
};
