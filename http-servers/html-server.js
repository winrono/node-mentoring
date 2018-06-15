import http from 'http';
import fs from 'fs';
import path from 'path';

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    //using readFileSync as described in homework
    // const content = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
    // res.end(content);
    const rs = fs.createReadStream(path.resolve(__dirname, './index.html'));
    rs.pipe(res);

}).listen(3000);