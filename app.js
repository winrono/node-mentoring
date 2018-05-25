import config from './config/config.json';
import { User, Product } from './models';
import { DirWatcher, Importer } from './file-handling';

console.log(config.name);

const user = new User();
const product = new Product();

const dirWatcher = new DirWatcher();
dirWatcher.watch("./data", 5000);

const importer = new Importer();

dirWatcher.on('changed', (path) => {
    importer.import(path).then((json) => {
        console.log(json);
    }).catch((reason)=>{
        console.log(`Failed to process file with path ${path} due to following error: ${reason}`);
    });
});
