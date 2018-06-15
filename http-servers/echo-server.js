import http from 'http';

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    req.pipe(res);
}).listen(3000);