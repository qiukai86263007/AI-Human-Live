import path from "node:path";
import archiver from "archiver";
import { AppEnv, waitAppEnvReady } from "../env";
import fs from "node:fs";
import { StrUtil, TimeUtil } from "../../lib/util";
import Apps from "../app";
import { Readable } from "node:stream";

const nodePath = path;

const root = () => {
    return path.join(AppEnv.userData, "data");
};

const absolutePath = (path: string) => {
    return `ABS://${path}`;
};

const fullPath = async (path: string) => {
    await waitAppEnvReady();
    if (path.startsWith("ABS://")) {
        return path.replace(/^ABS:\/\//, "");
    }
    return nodePath.join(root(), path);
};

const exists = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    return new Promise((resolve, reject) => {
        fs.stat(fp, (err, stat) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

const isDirectory = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (!fs.existsSync(fp)) {
        return false;
    }
    return fs.statSync(fp).isDirectory();
};

const mkdir = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (!fs.existsSync(fp)) {
        fs.mkdirSync(fp, { recursive: true });
    }
};
const zipFolder = async (path: string, option?: { isFullPath?: boolean }) => {
    // path默认为fullpath
        option = Object.assign(
            {
                isFullPath: false,
            },
            option
        );
        let fp = path;
        if (!option.isFullPath) {
            fp = await fullPath(path);
        }

        // 确保路径存在
        if (!fs.existsSync(fp)) {
            throw new Error(`Path does not exist: ${fp}`);
        }

        // 确保路径是目录
        if (!fs.statSync(fp).isDirectory()) {
            throw new Error(`Path is not a directory: ${fp}`);
        }
        const folderName = path.match(/[^\\]+(?=\\$)/)[0];
        // 生成输出文件路径
        const outputFilePath = `${fp}/../${folderName}.zip`;
        const output = fs.createWriteStream(outputFilePath);

        const archive = archiver("zip", {
            zlib: { level: 9 }, // 层级越高 压缩越小，压缩速度越慢
        });
        // console.log('archive',archive)

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on("close", function () {
            console.log('压缩大小'+archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed."
            );
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on("end", function () {
            console.log("Data has been drained");
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on("error", function (err) {
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        console.log("folderName", folderName);
        archive.directory(path, folderName);

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        await archive.finalize();
        console.log("zipSuccess");
        return outputFilePath;
};
const list = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (!fs.existsSync(fp)) {
        return [];
    }
    const files = fs.readdirSync(fp);
    return files.map((file) => {
        const stat = fs.statSync(nodePath.join(fp, file));
        let f = {
            name: file,
            pathname: nodePath.join(fp, file),
            isDirectory: stat.isDirectory(),
            size: stat.size,
            lastModified: stat.mtimeMs,
        };
        return f;
    });
};

const listAll = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (!fs.existsSync(fp)) {
        return [];
    }
    const listDirectory = (path: string, basePath: string = "") => {
        let files = [];
        const list = fs.readdirSync(path);
        for (let file of list) {
            const stat = fs.statSync(nodePath.join(path, file));
            let fPath = nodePath.join(basePath, file);
            fPath = fPath.replace(/\\/g, "/");
            let f = {
                name: file,
                path: fPath,
                isDirectory: stat.isDirectory(),
                size: stat.size,
                lastModified: stat.mtimeMs,
            };
            if (f.isDirectory) {
                files = files.concat(
                    listDirectory(nodePath.join(path, file), f.path)
                );
                continue;
            }
            files.push(f);
        }
        return files;
    };
    return listDirectory(fp);
};

const write = async (
    path: string,
    data: any,
    option?: { isFullPath?: boolean }
) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    const fullPathDir = nodePath.dirname(fp);
    if (!fs.existsSync(fullPathDir)) {
        fs.mkdirSync(fullPathDir, { recursive: true });
    }
    if (typeof data === "string") {
        data = {
            content: data,
        };
    }
    const f = fs.openSync(fp, "w");
    fs.writeSync(f, data.content);
    fs.closeSync(f);
};

const writeBuffer = async (
    path: string,
    data: any,
    option?: { isFullPath?: boolean }
) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    const fullPathDir = nodePath.dirname(fp);
    if (!fs.existsSync(fullPathDir)) {
        fs.mkdirSync(fullPathDir, { recursive: true });
    }
    const f = fs.openSync(fp, "w");
    fs.writeSync(f, data);
    fs.closeSync(f);
};

const read = async (
    path: string,
    option?: {
        isFullPath?: boolean;
        encoding?: string;
    }
) => {
    option = Object.assign(
        {
            isFullPath: false,
            encoding: "utf8",
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (!fs.existsSync(fp)) {
        return null;
    }
    const f = fs.openSync(fp, "r");
    const content = fs.readFileSync(f, {
        encoding: option.encoding as BufferEncoding,
    });
    fs.closeSync(f);
    return content;
};

const readBuffer = async (
    path: string,
    option?: { isFullPath?: boolean }
): Promise<Buffer> => {
    console.log("我开始readBuffer了", path);
    // option = Object.assign({
    //     isFullPath: false,
    // }, option)
    let fp = path;
    // if (!option.isFullPath) {
    //     console.log('!option.isFullPath')
    //     try {
    //         fp = await fullPath(path);
    //     } catch (error) {
    //         console.error('获取完整路径失败:', error);
    //     }
    // }
    fp = nodePath.resolve(fp); // 此时为正确的路径 C:\Users\Alan\ 但一旦在fs内执行就被改变了
    const removeFilePrefix = (path: string): string => {
        // 使用正则表达式匹配 'file:\' 及其前面的部分，并替换为空字符串
        const regex = /^.*?file:\\/;
        const cleanedPath = path.replace(regex, "");
        return cleanedPath;
    };
    fp = removeFilePrefix(fp);
    console.log("现在的路径为", fp);
    // try {
    //     await fs.promises.access(fp, fs.constants.F_OK);
    // } catch (err) {
    //     console.error('文件不存在或无法访问:', fp);
    // }

    // if (!fs.existsSync(fp)) {
    //     console.log('文件不存在', fp)
    //     return null
    // }

    // fp = String.raw`C:\Users\Alan\AppData\Roaming\aigcpanel\data\audio\c838da5b-e890-4b0c-950c-ffbe62fc9799\5038d2f6-8244-4c00-a086-584d5c9fffe8.wav`
    /*
        前面加上file:\ 会导致在file:\会被替换为当前执行位置所在的路径 如果只去掉file: 会变成D:\C:....
    */
    // fp = String.raw`file:\C:\Users\Alan\AppData\Roaming\aigcpanel\data\audio\c838da5b-e890-4b0c-950c-ffbe62fc9799\5038d2f6-8244-4c00-a086-584d5c9fffe8.wav`
    return fs.promises.readFile(fp);
    // return new Promise((resolve, reject) => {
    //     fs.readFile(fp, (err, data) => {
    //         if (err) {
    //             reject(err)
    //             return
    //         }
    //         resolve(data)
    //     })
    // })
};

const deletes = async (path: string, option?: { isFullPath?: boolean }) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (
        !(await exists(fp, {
            isFullPath: true,
        }))
    ) {
        return;
    }
    return new Promise((resolve, reject) => {
        fs.stat(fp, (err, stat) => {
            if (err) {
                reject(err);
                return;
            }
            if (stat.isDirectory()) {
                fs.rmdir(fp, { recursive: true }, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(undefined);
                });
            } else {
                fs.unlink(fp, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(undefined);
                });
            }
        });
    });
};
const rename = async (
    pathOld: string,
    pathNew: string,
    option?: {
        isFullPath?: boolean;
        overwrite?: boolean;
    }
) => {
    option = Object.assign(
        {
            isFullPath: false,
            overwrite: false,
        },
        option
    );
    let fullPathOld = pathOld;
    let fullPathNew = pathNew;
    if (!option.isFullPath) {
        fullPathOld = await fullPath(pathOld);
        fullPathNew = await fullPath(pathNew);
    }
    if (!fs.existsSync(fullPathOld)) {
        throw new Error(`FileNotFound:${fullPathOld}`);
    }
    if (fs.existsSync(fullPathNew)) {
        if (!option.overwrite) {
            throw new Error(`FileAlreadyExists:${fullPathNew}`);
        }
        fs.unlinkSync(fullPathNew);
    }
    const dir = nodePath.dirname(fullPathNew);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(fullPathOld, fullPathNew);
};

const copy = async (
    pathOld: string,
    pathNew: string,
    option?: { isFullPath?: boolean }
) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fullPathOld = pathOld;
    let fullPathNew = pathNew;
    if (!option.isFullPath) {
        fullPathOld = await fullPath(pathOld);
        fullPathNew = await fullPath(pathNew);
    }
    if (!fs.existsSync(fullPathOld)) {
        throw new Error(`FileNotFound:${fullPathOld}`);
    }
    if (fs.existsSync(fullPathNew)) {
        throw new Error(`FileAlreadyExists:${fullPathNew}`);
    }
    // console.log('copy', fullPathOld, fullPathNew)
    const dir = nodePath.dirname(fullPathNew);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(fullPathOld, fullPathNew);
};

const tempRoot = async () => {
    await waitAppEnvReady();
    const tempDir = path.join(AppEnv.userData, "temp");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
};

const temp = async (ext: string = "tmp", prefix: string = "file") => {
    const root = await tempRoot();
    const p = [prefix, TimeUtil.timestampInMs(), StrUtil.randomString(32)].join(
        "_"
    );
    return path.join(root, `${p}.${ext}`);
};

const tempDir = async (prefix: string = "dir") => {
    const root = await tempRoot();
    const p = [prefix, TimeUtil.timestampInMs(), StrUtil.randomString(32)].join(
        "_"
    );
    const dir = path.join(root, p);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

const watchText = async (
    path: string,
    callback: (data: {}) => void,
    option?: {
        isFullPath?: boolean;
        limit?: number;
    }
): Promise<{
    stop: Function;
}> => {
    if (!path) {
        throw new Error("path is empty");
    }
    option = Object.assign(
        {
            isFullPath: false,
            limit: 0,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    let watcher = null;
    let fd = null;
    let isFirstReading = true;
    let firstReadingLines = [];
    const watchFileExists = () => {
        if (fs.existsSync(fp)) {
            watcher = null;
            watchFileContent();
            return;
        }
        watcher = setTimeout(() => {
            watchFileExists();
        }, 1000);
    };
    const watchFileContent = () => {
        const CHUNK_SIZE = 16 * 1024;
        const fd = fs.openSync(fp, "r");
        let position = 0;
        let lineNumber = 0;
        let content = "";
        const parseContentLine = () => {
            while (true) {
                const index = content.indexOf("\n");
                if (index < 0) {
                    break;
                }
                const line = content.substring(0, index);
                content = content.substring(index + 1);
                const lineItem = {
                    num: lineNumber++,
                    text: line,
                };
                if (option.limit > 0 && isFirstReading) {
                    // 限制显示模式并且是第一次读取，暂时先不回调
                    firstReadingLines.push(lineItem);
                    while (firstReadingLines.length >= option.limit) {
                        firstReadingLines.shift();
                    }
                } else {
                    callback(lineItem);
                }
                // console.log('watchText.line', line, content)
            }
        };
        const readChunk = () => {
            const buf = new Buffer(CHUNK_SIZE);
            const bytesRead = fs.readSync(fd, buf, 0, CHUNK_SIZE, position);
            position += bytesRead;
            content += buf.toString("utf8", 0, bytesRead);
            parseContentLine();
            if (bytesRead < CHUNK_SIZE) {
                isFirstReading = false;
                if (firstReadingLines.length > 0) {
                    firstReadingLines.forEach((lineItem) => {
                        callback(lineItem);
                    });
                    firstReadingLines = [];
                }
                watcher = setTimeout(readChunk, 1000);
            } else {
                readChunk();
            }
        };
        readChunk();
    };
    watchFileExists();
    const stop = () => {
        // console.log('watchText stop', fp)
        if (fd) {
            fs.closeSync(fd);
        }
        if (watcher) {
            clearTimeout(watcher);
        }
    };
    // console.log('watchText', fp)
    return {
        stop,
    };
};

let appendTextPathCached = null;
let appendTextStreamCached = null;

const appendText = async (
    path: string,
    data: any,
    option?: { isFullPath?: boolean }
) => {
    option = Object.assign(
        {
            isFullPath: false,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    if (path !== appendTextPathCached) {
        appendTextPathCached = path;
        if (appendTextStreamCached) {
            appendTextStreamCached.end();
            appendTextStreamCached = null;
        }
        const fullPathDir = nodePath.dirname(fp);
        if (!fs.existsSync(fullPathDir)) {
            fs.mkdirSync(fullPathDir, { recursive: true });
        }
        appendTextStreamCached = fs.createWriteStream(fp, { flags: "a" });
    }
    appendTextStreamCached.write(data);
};

const download = async (
    url: string,
    path: string,
    option?: {
        isFullPath?: boolean;
        progress?: (percent: number, total: number) => void;
    }
) => {
    option = Object.assign(
        {
            isFullPath: false,
            progress: null,
        },
        option
    );
    let fp = path;
    if (!option.isFullPath) {
        fp = await fullPath(path);
    }
    const fullPathDir = nodePath.dirname(fp);
    if (!fs.existsSync(fullPathDir)) {
        fs.mkdirSync(fullPathDir, { recursive: true });
    }
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": Apps.getUserAgent(),
        },
    });
    if (!res.ok) {
        throw new Error(`DownloadError:${url}`);
    }

    const contentLength = res.headers.get("content-length");
    const totalSize = contentLength ? parseInt(contentLength, 10) : null;
    let downloaded = 0;

    // @ts-ignore
    const readableStream = Readable.fromWeb(res.body);
    const fileStream = fs.createWriteStream(fp);
    return new Promise((resolve, reject) => {
        readableStream
            .on("data", (chunk) => {
                // console.log('download.data', chunk.length)
                downloaded += chunk.length;
                if (totalSize) {
                    option.progress &&
                        option.progress(downloaded / totalSize, totalSize);
                }
                fileStream.write(chunk);
            })
            .on("end", () => {
                // console.log('download.end')
                fileStream.end();
                resolve(undefined);
            })
            .on("error", (err) => {
                // console.log('download.error', err)
                fileStream.close();
                reject(err);
            });
    });
};

export default {
    fullPath,
    absolutePath,
    exists,
    isDirectory,
    mkdir,
    zipFolder,
    list,
    listAll,
    write,
    writeBuffer,
    read,
    readBuffer,
    deletes,
    rename,
    copy,
    temp,
    tempDir,
    watchText,
    appendText,
    download,
};
