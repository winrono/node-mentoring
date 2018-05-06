import { EventEmitter } from 'events';
import fs from 'fs';
import { promisify } from 'util';

const readdirAsync = promisify(fs.readdir);

//used by alternative version
//const statAsync = promisify(fs.stat);

export class DirWatcher extends EventEmitter {
    constructor() {
        super();
        this.processedFiles = [];
    }

    watch(path, delay) {

        //using setTimeout approach to make sure that dirwatcher is able to handle arbitrary number of CSV files without overlapping
        const action = async () => {

            const files = await readdirAsync(path);

            await Promise.all(files.map(async (filename) => {

                const fullPath = path + '/' + filename;
                if (!this.processedFiles.includes(filename)) {
                    this.processedFiles.push(filename);
                    this.emit('changed', fullPath);
                };

            }));

            setTimeout(action, delay);
        };

        action();
    }

    //alternative implementation if file should be processed after modification

    //    constructor() {
    //     super();
    //     this.pathMtimeMap = new Map();
    // }

    // watch(path, delay) {

    //     const action = async () => {

    //         const files = await readdirAsync(path);

    //         await Promise.all(files.map(async (filename) => {

    //             const fullPath = path + '/' + filename;
    //             const stats = await statAsync(fullPath);

    //             let isChanged = false;
    //             const previousMtime = this.pathMtimeMap.get(fullPath);
    //             //file considered as changed if modification time changed or it's not previously existed within Map
    //             if (!previousMtime || previousMtime != stats.mtimeMs) {
    //                 this.pathMtimeMap.set(fullPath, stats.mtimeMs);
    //                 isChanged = true;
    //             }

    //             if (isChanged) {
    //                 this.emit('changed', fullPath);
    //             }

    //         }));
    //         setTimeout(action, delay);
    //     };

    //     action();
    // }
}