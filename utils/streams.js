import minimist from "minimist";
import through from "through2";
import fs from "fs";
import csv from "csvtojson";
import { promisify } from "util";
import path from "path";
import https from "https";

const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);

const actionsDescriptions = new Map([
  ["reverse", "reverses string data from process.stdin to process.stdout"],
  ["transform", "converts data from process.stdin to upper-cased data on process.stdout"],
  ["outputFile", "pipes the given file provided by --file option to process.stdout"],
  ["convertFromFile", "converts file provided by --file option from csv to json and output data to process.stdout"],
  ["convertToFile", "converts file provided by --file option from csv to json and output data to a result file with the same name but json extension"],
  ["cssBundler", "bundles css from provided --path option and appends content of EPAM specific css to the end of the file"]]);

const args = minimist(process.argv.slice(2), {
  alias: {
    h: "help",
    a: "action",
    f: "file",
    p: "path"
  }
});

const action = module.exports[args.action];
const firstArg = Object.keys(args)[1];
//if firstArg is undefined then options were not provided
if (firstArg === undefined || firstArg == "help" || firstArg == "h") {
    console.log('Please provide --action parameter to execute one of following actions:')
    actionsDescriptions.forEach((value, key) => {
        console.log(`Action '${key}' ${value}`);
    })
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

function csvToJson(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isDirectory() && path.extname(filePath) === ".csv") {
        csv()
          .fromFile(filePath)
          .then(json => {
            resolve(JSON.stringify(json));
          })
          .catch(reason => {
            reject(`Failed to process file due to reason: ${reason}`);
          });
      } else {
        reject(
          `Provided path ${filePath} is directory or doesn't have .csv extension`
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function reverse() {
  process.stdin.pipe(process.stdout);
}

export function transform() {
  var tr = through(function(chunk, enc, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  });
  process.stdin.pipe(tr).pipe(process.stdout);
}

export function outputFile(filePath) {
        const rs = fs.createReadStream(filePath);
        rs.on('error', (err) => {
            console.error(err);
        });
        rs.pipe(process.stdout);
}

export function convertFromFile(filePath) {
  csvToJson(filePath)
    .then(output => {
      process.stdout.write(output);
    })
    .catch(reason => {
      process.stdout.write(`Rejected with reason: ${reason}`);
    });
}

export function convertToFile(filePath) {
  csvToJson(filePath)
    .then(output => {
      const parsed = path.parse(filePath);
      const newPath = `${parsed.dir}/${parsed.name}.json`;
      const ws = fs.createWriteStream(newPath);
      ws.write(output);
    })
    .catch(reason => {
      process.stdout.write(`Rejected with reason: ${reason}`);
    });
}

export async function cssBundler(cssPath) {
  const files = await readdirAsync(cssPath);
  //adding content of file from url https://epa.ms/nodejs18-hw3-css
  files.push("../data/epam.css");
  const destionationFilename = "bundle.css";
  const results = await Promise.all(
    files.map(async filename => {
      const fullPath = cssPath + "/" + filename;
      const stats = await statAsync(fullPath);
      const extension = path.extname(fullPath);
      //skipping directories, non-css files, bundle.css itself
      if (
        !stats.isDirectory() &&
        extension === ".css" &&
        !fullPath.includes(destionationFilename)
      ) {
        return await readFileAsync(fullPath, "utf8");
      } else {
        return "";
      }
    })
  );
  let bundledCss = results.join("");
  fs.writeFile(`${cssPath}/${destionationFilename}`, bundledCss, err => {
    if (err) throw err;
  });
}
