import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let query = url.parse(req.url, true).query;
    let content = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
    content = content.replace('{message}', query.message);
    res.end(content);

}).listen(3000);