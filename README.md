# Peer CLI

Swiss Army knife for the IPFS.

You can do the followings:

- [Peer CLI](#peer-cli)
  - [Features](#features)
    - [Upload File/Dir To The IPFS](#upload-filedir-to-the-ipfs)
    - [Show/Save File/Dir Contents from the IPFS](#showsave-filedir-contents-from-the-ipfs)
    - [List in the IPFS](#list-in-the-ipfs)
    - [Navigate in IPFS MFS](#navigate-in-ipfs-mfs)
    - [Peer to Peer Chat](#peer-to-peer-chat)

## Features

### Upload File/Dir To The IPFS

You can easily upload file or directory to the IPFS.

With fuzzy search, you can easily find the file you want to upload to the IPFS. Also, progress bar is shown while uploading.

![Peer-CLI Upload](media/upload.gif)

### Show/Save File/Dir Contents from the IPFS

You can easily show/save file or directory contents from the IPFS with given [CID](https://docs.ipfs.tech/concepts/content-addressing/#content-addressing-and-cids). Also, you can save the listed contents to your local file system.

![Peer-CLI Get](media/get.gif)

### List in the IPFS

You can easily list file or directory contents in the IPFS with given [CID](https://docs.ipfs.tech/concepts/content-addressing/#content-addressing-and-cids).

- If the given CID is a file, you can either save the file, or show the file contents.
- If the given CID is a directory, you can save the contents to your local file system, or navigate to the directory.

![Peer-CLI List](media/list.gif)

### Navigate in IPFS MFS

Because files in IPFS are content-addressed and immutable, they can be complicated to edit. Mutable File System (MFS) is a tool built into IPFS that lets you treat files like you would a regular name-based filesystem — you can add, remove, move, and edit MFS files and have all the work of updating links and hashes taken care of for you ([Source](https://docs.ipfs.tech/concepts/file-systems/#mutable-file-system-mfs)).

This feature lets you easily manipulate files in the IPFS MFS like you are using Unix shell! The commands are very similar, thus you will not have any difficulty using them.

![Peer-CLI MFS](media/mfs.gif)

### Peer to Peer Chat

Peer to peer chat is a feature that lets you chat with any peer that is visible through peer-cli. You can either discover peers through the peer discovery feature, or you can connect to a peer manually if you know the peer ID.

If you managed to connect to a peer, an authorization request will be sent to the peer. If the peer accepts the request, you two will be redirected to the chat room to say hello to each other (or whatever you want to say).

The feature uses [libp2p](https://libp2p.io/) to establish a connection between peers. libp2p plugin, `libp2p-webrtc-star` is used for discovering peers and establishing a connection through WebRTC. All messages are encrypted using [libp2p-noise](https://github.com/ChainSafe/js-libp2p-noise#readme) protocol. Discovery mechanism uses signalling server that we have deployed on a Heroku server. You can use your own signalling server by changing `starAddr` in `p2p.js`. You can find the example deployment of the signalling server [here](https://suda.pl/free-webrtc-star-heroku/)

![Peer-CLI Peer Chat](media/peer-chat.gif)
