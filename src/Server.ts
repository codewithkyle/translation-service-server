const express = require('express');

class Server
{
    private _app:IExpress;

    constructor()
    {
        this._app = express();
        this._app.listen(8181);
        this._app.use(express.static('public'));
        this._app.get('/', (req:IExpressRequest, res:IExpressResponse) => {
            // console.log(req);
            // console.log(res);
            res.sendFile(`${ __dirname }/public/index.html`);
        });
        console.log('http://127.0.0.1:8181');
    }
}

new Server();