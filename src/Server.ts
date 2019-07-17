import { PathLike } from "fs";

const express = require('express');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const archiver = require('archiver');
const bodyParser = require('body-parser');
const uuid = require('uuid/v4');

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
        this._app.post('/convert', bodyParser.json(),this.convert.bind(this));
    }

    private homepage(req:IExpressRequest, res:IExpressResponse) : IExpressResponse
    {
        res.status(200);
        res.sendFile(`${ __dirname }/public/index.html`);
        return res;
    }

    private convert(req:IExpressRequest, res:IExpressResponse) : IExpressResponse
    {
        if(!req.body)
        {
            res.status(400);
            res.send('Missing translations form data');
            return res;
        }

        this.converter(req.body)
        .then(directoryPath =>{
            fs.readFile(`${ directoryPath }.zip`, (err:string, data:any)=>{
                if(err)
                {
                    res.status(500);
                    res.send(err);
                    return res;
                }

                res.status(200);
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename=${ directoryPath }.zip`);
                res.setHeader('Content-Length', data.length);
                res.end(data, 'binary');
                return res;

            });
        })
        .catch(error => {
            res.status(500);
            res.send(error);
            return res;
        })
        .then(()=>{
            /** TODO: Remove temp zip file */
        });
        
        res.status(200);
        return res;
    }

    private upload(req:IExpressRequest, res:IExpressResponse) : IExpressResponse
    {
        if (!req.file)
        {
            return res.status(400).send('No files were uploaded.');
        }

        this.parseFile(req.file)
        .then(json =>{
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(json));
            return res;
        })
        .catch(error => {
            res.status(500);
            res.send(error);
            return res;
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

    private converter(json:any) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            (async ()=>{
                try{
                    const id = uuid();
                    const directoryPath:PathLike = await this.createTempDirectory(id);
                    await this.createLocals(directoryPath, json);
                    await this.generateFiles(directoryPath, json);
                    await this.zipFiles(directoryPath, id);
                    await resolve(directoryPath);
                }
                catch(err)
                {
                    reject(err);
                }
            })();
        });
    }

    private zipFiles(path:PathLike, id:string) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            (async ()=>{
                try
                {
                    await fs.promises.access(path);
                    const output = fs.createWriteStream(`temp/${ id }.zip`);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', ()=>{
                        resolve();
                    });

                    archive.pipe(output);
                    archive.directory(path, 'translations');
                    archive.finalize();
                }
                catch(error)
                {
                    reject(error);
                }
            })();
        });
    }

    private generateFiles(directoryPath:PathLike, json:any) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            const locals = Object.keys(json);

            for(let i = 0; i < locals.length; i++)
            {
                (async ()=>{
                    try
                    {
                        const path = `${ directoryPath }/${ locals[i] }`;
                        await fs.promises.access(path);
                        await this.createPhpFile(path, json[locals[i]]);
                        await this.createJsonFile(path, json[locals[i]]);
                        await resolve();
                    }
                    catch(error)
                    {
                        reject(error);
                    }
                })();
            }
        });
    }

    private createJsonFile(directory:PathLike, json:object) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            const translations = Object.entries(json);
            let count = 0;

            let file = '{\n';

            for(const [key, value] of translations)
            {
                count++;

                const cleanKey = key.replace(/\\"/g, '"');
                const cleanValue = value.replace(/\\"/g, '"');

                file += `\t${ JSON.stringify(cleanKey) }: ${ JSON.stringify(cleanValue) }`;

                if(count < translations.length)
                {
                    file += ',\n';
                }
                else
                {
                    file += '\n';
                }
            }

            file += '}\n';

            fs.writeFile(`${ directory }/site.json`, file, (err:string) => {
                if(err)
                {
                    reject(`Failed to create ${ directory }/site.json`);
                }

                resolve();
            });
        });
    }

    private createPhpFile(directory:PathLike, json:object) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            
            const translations = Object.entries(json);
            let count = 0;
            
            let file = '<?php\n\n';
            file += 'return [\n';

            for(const [key, value] of translations)
            {
                count++;

                file += '\t';

                const cleanKey = key.replace(/\\"/g, '"');
                const cleanValue = value.replace(/\\"/g, '"');

                if(cleanKey.match(/\'/g))
                {
                    file += `"${ cleanKey }"`;
                }
                else
                {
                    file += `'${ cleanKey }'`;
                }

                file += ' => ';

                if(cleanValue.match(/\'/g))
                {
                    file += `"${ cleanValue }"`;
                }
                else
                {
                    file += `'${ cleanValue }'`;
                }

                if(count < translations.length)
                {
                    file += ',\n';
                }
                else
                {
                    file += '\n';
                }
            }

            file += '];\n';

            fs.writeFile(`${ directory }/site.php`, file, (err:string) => {
                if(err)
                {
                    reject(`Failed to create ${ directory }/site.php`);
                }

                resolve();
            });
        });
    }

    private parseFile(file:IFile) : Promise<unknown>
    {
        return new Promise((resolve, reject)=>{
            switch(file.mimetype)
            {
                case 'text/csv':
                    this.convertCSVtoJSON(file.path)
                    .then(json => resolve(json))
                    .catch(e => reject(e));
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

    private createLocals(baseDirectoryPath:PathLike, json:any) : Promise<unknown>
    {
        return new Promise((resolve) => {
            const keys = Object.keys(json);
            const localsCreated = [];

            for(let i = 0; i < keys.length; i++)
            {
                fs.mkdir(`${ baseDirectoryPath }/${ keys[i] }`, (err:string) => {
                    if(err)
                    {
                        console.log(`Failed to create directory for ${ keys[i] }`);
                    }

                    localsCreated.push(keys[i]);

                    if(keys.length === localsCreated.length)
                    {
                        resolve();
                    }
                });
            }
        });
    }

    private createTempDirectory(filename:string) : Promise<PathLike|string>
    {
        return new Promise((resolve, reject) => {
            fs.mkdir(`temp/${ filename }`, (err:string) => {
                if(err)
                {
                    reject('Failed to generate temp directory');
                }

                resolve(`temp/${ filename }`);
            });
        });
    }

    private convertCSVtoJSON(path:string) : Promise<unknown>
    {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err:string, file:string) => {
                if(err)
                {
                    reject('Failed to open CSV file.');
                }

                const json:any = {};
                const csv = file.toString();
                const rows = csv.split(/\n/g);
                const locals = rows[0].split(/,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))/g);

                for(let i = 0; i < locals.length; i++)
                {
                    let cleanName = locals[i].replace(/^[\"]/, '');
                    cleanName = cleanName.replace(/[\"]$/, '');
                    cleanName = cleanName.replace(/\"\"/g, '\\"');
                    locals[i] = cleanName;
                    json[cleanName] = {};
                }

                if(rows)
                {
                    for(let i = 1; i < rows.length; i++)
                    {
                        const values = rows[i].split(/,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))/g);
                        
                        if(values)
                        {
                            if(values.length === locals.length)
                            {
                                for(let k = 0; k < locals.length; k++)
                                {
                                    let cleanName = values[k];
                                    if(values[k].length)
                                    {
                                        cleanName = cleanName.replace(/^[\"]/, '');
                                        cleanName = cleanName.replace(/[\"]$/, '');
                                        cleanName = cleanName.replace(/\"\"/g, '\\"');
                                        values[k] = cleanName;
                                    }
                                    
                                    json[locals[k]][values[0]] = cleanName;
                                }
                            }
                        }
                        else
                        {
                            reject('Failed to parse CSV values.');
                        }
                    }

                    resolve(json);
                }
                else
                {
                    reject('Failed to parse CSV rows.');
                }
            });
        });
    }
}

new Server();