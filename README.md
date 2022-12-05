# Peer CLI

Swiss Army knife for the IPFS.

- [Peer CLI](#peer-cli)
  - [Install](#install)
  - [Features](#features)
    - [Upload File/Dir To The IPFS](#upload-filedir-to-the-ipfs)
    - [Show/Save File/Dir Contents from the IPFS](#showsave-filedir-contents-from-the-ipfs)
    - [List in the IPFS](#list-in-the-ipfs)
    - [Navigate in IPFS MFS](#navigate-in-ipfs-mfs)

## Install

```bash
npm install -g peer-cli
```

## Features

### Upload File/Dir To The IPFS

You can easily upload file or directory to the IPFS.

With fuzzy search, you can easily find the file you want to upload to the IPFS. Also, progress bar is shown while uploading.

![Peer-CLI Upload](media/upload.gif)

<br>

### Show/Save File/Dir Contents from the IPFS

You can easily show/save file or directory contents from the IPFS with given [CID](https://docs.ipfs.tech/concepts/content-addressing/#content-addressing-and-cids). Also, you can save the listed contents to your local file system.

![Peer-CLI Get](media/get.gif)

<br>

### List in the IPFS

You can easily list file or directory contents in the IPFS with given [CID](https://docs.ipfs.tech/concepts/content-addressing/#content-addressing-and-cids).

- If the given CID is a file, you can either save the file, or show the file contents.
- If the given CID is a directory, you can save the contents to your local file system, or navigate to the directory.

![Peer-CLI List](media/list.gif)

<br>

### Navigate in IPFS MFS

Because files in IPFS are content-addressed and immutable, they can be complicated to edit. Mutable File System (MFS) is a tool built into IPFS that lets you treat files like you would a regular name-based filesystem — you can add, remove, move, and edit MFS files and have all the work of updating links and hashes taken care of for you ([Source](https://docs.ipfs.tech/concepts/file-systems/#mutable-file-system-mfs)).

This feature lets you easily manipulate files in the IPFS MFS like you are using Unix shell! The commands are very similar, thus you will not have any difficulty using them.

Available commands are:

> (...) indicates that the command can take multiple arguments. (e.g. `ls` can take multiple paths)

| Command | Options                    | Explanation                             |
| ------- | -------------------------- | --------------------------------------- |
| ls      | optional: \[path, ...\]    | List directory contents                 |
| cd      | \[path\]                   | Change directory                        |
| pwd     |                           | Output the current working directory    |
| mkdir   | \[path, ...\]              | Make directory                          |
| rm      | \[path, ...\]              | Remove file or directory                |
| stat    | \[path, ...\]              | Get file or directory statistics        |
| flush   | \[path, ...\]              | Flush a given path's data to the disk   |
| read    | \[path, ...\]              | Read a file                             |
| cat     | \[path, ...\]              | Alias for read                          |
| touch   | \[path, ...\]              | Update the mtime of a file or directory |
| write   | \[path\]                   | Write to an MFS path                    |
| open    | \[path\]                   | Alias for write                         |
| cp      | \[path\] \[to\]            | Copy files from one location to another |
| mv      | \[path\] \[to\]            | Move files from one location to another |
| help    | optional: \[command, ...\] | Show help                               |
| man     | optional: \[command, ...\] | Alias for help                          |
| clear   |                            | Clear the screen                        |
| exit    |                            | Exit the MFS shell                      |

![Peer-CLI MFS](media/mfs.gif)
