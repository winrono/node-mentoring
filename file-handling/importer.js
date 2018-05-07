import csv from 'csvtojson';
import fs from 'fs';

export class Importer {
    import(path) {
        return new Promise((resolve, reject) => {
            csv().fromFile(path).on('end_parsed', (json) => {
                resolve(json);
            });
        });
    }
    //csvtojson doesn't provide sync ways to convert csv to json
    //so I decided to not use yet another library and provided simple implementation instead
    importSync(path) {
        //processing only non-empty lines
        const lines = fs.readFileSync(path, 'utf8').split('\r\n').filter(Boolean);
        const columns = lines[0].split(',');
        let objects = [];

        //skip first line as it's header
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj = {};
            columns.forEach((column, index) => {
                obj[column] = values[index];
            });
            objects.push(obj);
        }
        return JSON.stringify(objects);
    }
}