const express = require('express');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

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
        
        this._app.post('/upload', upload.single('translation'), (req:IExpressRequest, res:IExpressResponse) => {
            if (!req.file)
            {
                return res.status(400).send('No files were uploaded.');
            }

            return res.status(200).send('Upload successful.');
        });
    }
}

new Server();