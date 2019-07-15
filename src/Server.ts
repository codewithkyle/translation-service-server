const express = require('express');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

class Server
{
    private _app:IExpress;

    constructor()
    {
        this._app = express();
        this._app.listen(8181);
        this._app.use(express.static('public'));
        this.router();
    }

    private router() : void
    {
        this._app.get('/', this.homepage.bind(this));
        this._app.post('/upload', upload.single('translation'), this.upload.bind(this));
    }

    private homepage(req:IExpressRequest, res:IExpressResponse) : IExpressResponse
    {
        return res.status(200).sendFile(`${ __dirname }/public/index.html`);
    }

    private upload(req:IExpressRequest, res:IExpressResponse) : IExpressResponse
    {
        if (!req.file)
        {
            return res.status(400).send('No files were uploaded.');
        }

        this.parseFile(req.file)
        .then(()=>{
            return res.status(200).send('Upload successful.');
        })
        .catch(error => {
            return res.status(500).send(error);
        })
        .then(()=>{
            fs.unlink(req.file.path, (err:string)=>{
                if(err)
                {
                    console.log('Failed to remove temp file', req.file.path, err);
                }
            });
        });
    }

    private parseFile(file:IFile) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            (async ()=>{
                try{
                    const json = await this.getJsonFromFile(file);
                    await resolve();
                }
                catch(err)
                {
                    reject(err);
                }
            })();
        })
    }

    private getJsonFromFile(file:IFile) : Promise<any>
    {
        return new Promise((resolve, reject)=>{
            switch(file.mimetype)
            {
                case 'text/csv':
                    /** TODO: Convert CSV to JSON */
                    reject('CSV parser is unfinished. Please use JSON.');
                    break;
                case 'application/json':
                    fs.readFile(file.path, (err:string, file:string)=>{
                        if(err)
                        {
                            reject('Failed to open JSON file.');
                        }
                        resolve(JSON.parse(file));
                    });
                    break;
                default:
                    reject('Invalid file type. Upload a CSV or JSON file.');
                    break;
            }
        });
    }
}

new Server();