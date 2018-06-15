import http from 'http';

http.createServer((req, res) => {
    res.writeHead(200);
    req.pipe(res);
}).listen(3000);