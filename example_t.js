node?.handle("/send-stream-request", ({ stream, connection }) => {
        console.log("Stream Request Received");

        pipe(stream, (source) =>
          (async function () {
            for await (const msg of source) {
              const fileDetailsArray = uint8ArrayToString(msg.subarray()).split(
                " "
              );
              setFileDetails((prev) => [
                ...prev,
                fileDetailsArray[0],
                fileDetailsArray[1],
                fileDetailsArray[2],
              ]);
            }
          })()
        ).then(() => {
          //@ts-ignore
          node
            ?.dialProtocol(connection.remotePeer, [
              "/send-stream-request/answer",
            ])
            .then((stream) => {
              console.log("Answer Send");

              //TODO: Check the conditions!

              pipe([uint8ArrayFromString("YES")], stream);
            });
        });
      });

      node?.handle("/send-stream-request/answer", ({ stream, connection }) => {
        console.log("Answer Received");

        pipe(stream, (source) =>
          (async function () {
            for await (const msg of source) {
              if (uint8ArrayToString(msg.subarray()) === "YES") {
                console.log("YES");

                node
                  ?.dialProtocol(connection.remotePeer, ["/send-file"])
                  .then((stream) => {

                    if (files[0]) {
                      console.log("sending file");

                      const file = new File([files[0]], files[0].name);

                      const blob = new Blob([file], { type: files[0].type });

                      // Create a file reader
                      const reader = new FileReader();
                      // Set the reader to load as a data URL
                      reader.readAsArrayBuffer(blob);
                      // When the reader has loaded, set the image source to the data URL
                      reader.onload = () => {
                        var arrayBuffer = reader.result;

                        //@ts-ignore
                        var bytes = new Uint8Array(arrayBuffer);
                        console.log(bytes.byteLength);

                        // Send the file to the remote peer
                        pipe([bytes], stream);
                      };
                    }else{
                      console.log("file is undefined")

                      const data = files.map((file) => {  
                        console.log(file)
                      })

                      console.log(data)
                    }
                  });
              } else {
                console.log("NO");
              }
            }
          })()
        );
      });

      node?.handle("/send-file", ({ stream }) => {
        console.log("got a new stream");

        pipe(stream, (source) =>
          (async function () {
            for await (const msg of source) {
              var array = new Uint8Array(msg.length);

              //@ts-ignore
              for (var i = 0; i < msg.bufs.length; i++) {
                //@ts-ignore
                if (i === 0) {
                  //@ts-ignore
                  array.set(msg.bufs[i]);
                } else {
                  //@ts-ignore
                  array.set(msg.bufs[i], msg.bufs[i - 1].length);
                }
              }

              console.log(array.length);

              var blob = new Blob([array], { type: fileDetails[2] });

              console.log(blob);

              const aElement = document.createElement("a");
              aElement.setAttribute("download", fileDetails[0]);
              const href = URL.createObjectURL(blob);
              aElement.href = href;
              aElement.setAttribute("target", "_blank");
              aElement.click();
              URL.revokeObjectURL(href);
            }
          })()
        );
      });
    };

node?.dialProtocol(result, ["/send-stream-request"]).then((stream) => {
        console.log("Stream Request Send");

        pipe(
          [
            uint8ArrayFromString(
              files[0].name + " " + files[0].size + " " + files[0].type
            ),
          ],
          stream
        );
      });