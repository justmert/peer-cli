import { authAnswer, authRequest } from "./auth.js";
import { stdinToStream, streamToConsole } from "./stream.js";
import p2pNode from "./p2p.js";

await p2pNode.handle("/auth/request", async ({ stream, connection }) => {
  try {
    await authRequest(stream, connection);
  } catch (error) {
    console.log(error);
  }
});

await p2pNode.handle("/auth/answer", async ({ stream, connection }) => {
  try {
    await authAnswer(stream, connection);
  } catch (error) {
    console.log(error);
  }
});

await p2pNode.handle("/chat", async ({ stream, connection }) => {
  // Send stdin to the stream
  stdinToStream(stream, connection);
  // Read the stream and output to console
  streamToConsole(stream, connection);
});
