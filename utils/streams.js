import minimist from 'minimist';
import through from 'through2';
import fs from 'fs';
import csv from 'csvtojson';
import { promisify } from 'util';
import path from 'path';
import https from 'https';

const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);

const args = minimist(process.argv.slice(2), {
    alias: {
        h: 'help',
        a: 'action',
        f: 'file',
        p: 'path'
    }
});

function csvToJson(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const stats = fs.statSync(filePath);
            if (!stats.isDirectory() && path.extname(filePath) === ".csv") {
                csv().fromFile(filePath).then((json) => {
                    resolve(JSON.stringify(json));
                }).catch((reason) => {
                    reject(`Failed to process file due to reason: ${reason}`);
                });
            } else {
                reject(`Provided path ${filePath} is directory or doesn't have .csv extension`);
            }
        } catch (error) {
            reject(error);
        }
    });
}

export class Streams {
    constructor() {
        const action = this[args.action];
        const firstArg = Object.keys(args)[1];
        //if firstArg is undefined then options were not provided
        if (firstArg === undefined || firstArg == "help" || firstArg == "h") {
            console.log(`Called with "${firstArg}" as first argument, further execution skipped`);
        } else if (action) {
            if (args.action == "cssBundler") {
                action(args.path);
            } else {
                action(args.file);
            }
        } else {
            const errorMessage = `Action "${args.action}" not found!`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
    reverse() {
        process.stdin.pipe(process.stdout);
    }
    transform() {
        var tr = through(function (chunk, enc, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
        });
        process.stdin.pipe(tr).pipe(process.stdout);
    }
    outputFile(filePath) {
        const rs = fs.createReadStream(filePath);
        rs.pipe(process.stdout);
    }
    convertFromFile(filePath) {
        csvToJson(filePath).then((output) => {
            process.stdout.write(output);
        }).catch((reason) => {
            process.stdout.write(`Rejected with reason: ${reason}`);
        });
    }
    convertToFile(filePath) {
        csvToJson(filePath).then((output) => {
            const parsed = path.parse(filePath);
            const newPath = `${parsed.dir}/${parsed.name}.json`;
            const ws = fs.createWriteStream(newPath);
            ws.write(output);
        }).catch((reason) => {
            process.stdout.write(`Rejected with reason: ${reason}`);
        });
    }
    async cssBundler(cssPath) {
        const files = await readdirAsync(cssPath);
        //adding content of file from url https://epa.ms/nodejs18-hw3-css
        files.push("../data/epam.css");
        const destionationFilename = 'bundle.css';
        const results = await Promise.all(files.map(async (filename) => {

            const fullPath = cssPath + '/' + filename;
            const stats = await statAsync(fullPath);
            const extension = path.extname(fullPath);
            //skipping directories, non-css files, bundle.css itself
            if (!stats.isDirectory() && extension === ".css" && !fullPath.includes(destionationFilename)) {
                return await readFileAsync(fullPath, 'utf8');
            } else {
                return "";
            }
        }));
        let bundledCss = results.join("");
        fs.writeFile(`${cssPath}/${destionationFilename}`, bundledCss, (err) => {
            if (err) throw err;
        });
    }
}