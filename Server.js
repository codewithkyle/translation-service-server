const express = require('express');
class Server {
    constructor() {
        this._app = express();
        this._app.listen(8181);
        this._app.get('/', (req, res) => {
            res.send('Hello World');
        });
        console.log('http://127.0.0.1:8181');
    }
}
new Server();
