import csv from 'csvtojson';
import fs from 'fs';
import readline from 'readline';
import os from 'os';

export class Importer {
    import(path) {
        return new Promise((resolve, reject) => {
            csv().fromFile(path).then((json) => {
                resolve(json);
            }).catch((reason) => {
                reject(reason);
            });      
        });
    }
    //async implementation without library usage
    importAsync(path) {
        return new Promise((resolve, reject) => {

            let objects = [];
            let columns;

            let rs = fs.createReadStream(path);
            rs.on('error', (reason) => {
                reject(reason);
            });

            const reader = readline.createInterface(rs);

            reader.on('line', (line) => {
                const values = line.split(',');
                //if columns is undefined then first line is processing 
                if (!columns) {
                    columns = values;
                } else {
                    objects.push(this.createObject(columns, values));
                }
            });

            reader.on('close', () => {
                resolve(JSON.stringify(objects));
            });

        });
    }
    //csvtojson doesn't provide sync ways to convert csv to json
    //so I decided to not use yet another library and provided simple implementation instead
    importSync(path) {
        //using os.EOL as it's cross-platform (\n on POSIX, \r\n on Windows)
        const lines = fs.readFileSync(path, 'utf8').split(os.EOL).filter(Boolean);
        let columns = [];
        let objects = [];

        lines.reduce((previous, current, index) => {
            const values = current.split(',');
            //line with 0th index contains columns
            if (index === 0) {
                columns = values;
            } else {
                previous.push(this.createObject(columns, values));
            }
            return previous;
        }, objects);
        return JSON.stringify(objects);
    }

    createObject(columns, values) {
        const obj = {};
        columns.reduce((previous, current, index) => {
            previous[current] = values[index];
            return previous;
        }, obj);
        return obj;
    }
}
