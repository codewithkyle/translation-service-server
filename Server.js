const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const archiver = require('archiver');
const bodyParser = require('body-parser');
class Server {
    constructor() {
        this._app = express();
        this._app.listen(8181);
        this._app.use(express.static('public'));
        this.router();
    }
    router() {
        this._app.get('/', this.homepage.bind(this));
        this._app.post('/upload', upload.single('translation'), this.upload.bind(this));
        this._app.post('/convert', bodyParser.json(), this.convert.bind(this));
    }
    homepage(req, res) {
        res.status(200);
        res.sendFile(`${__dirname}/public/index.html`);
        return res;
    }
    convert(req, res) {
        if (!req.body) {
            res.status(400);
            res.send('Missing translations form data');
            return res;
        }
        this.converter(req.body)
            .then(() => {
            res.status(200);
            return res;
        })
            .catch(error => {
            res.status(500);
            res.send(error);
            return res;
        })
            .then(() => {
        });
        res.status(200);
        return res;
    }
    upload(req, res) {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }
        this.parseFile(req.file)
            .then(json => {
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
            .then(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log('Failed to remove temp file', req.file.path, err);
                }
            });
        });
    }
    converter(json) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const uuid = 'test';
                    const directoryPath = await this.createTempDirectory(uuid);
                    await this.createLocals(directoryPath, json);
                    await resolve(json);
                }
                catch (err) {
                    reject(err);
                }
            })();
        });
    }
    parseFile(file) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const json = await this.getJsonFromFile(file);
                    await resolve(json);
                }
                catch (err) {
                    reject(err);
                }
            })();
        });
    }
    createLocals(baseDirectoryPath, json) {
        return new Promise((resolve) => {
            const keys = Object.keys(json);
            const localsCreated = [];
            for (let i = 0; i < keys.length; i++) {
                fs.mkdir(`${baseDirectoryPath}/${keys[i]}`, (err) => {
                    if (err) {
                        console.log(`Failed to create directory for ${keys[i]}`);
                    }
                    localsCreated.push(keys[i]);
                    if (keys.length === localsCreated.length) {
                        resolve();
                    }
                });
            }
        });
    }
    createTempDirectory(filename) {
        return new Promise((resolve, reject) => {
            fs.mkdir(`temp/${filename}`, (err) => {
                if (err) {
                    reject('Failed to generate temp directory');
                }
                resolve(`temp/${filename}`);
            });
        });
    }
    getJsonFromFile(file) {
        return new Promise((resolve, reject) => {
            switch (file.mimetype) {
                case 'text/csv':
                    this.convertCSVtoJSON(file.path)
                        .then(json => resolve(json))
                        .catch(e => reject(e));
                    break;
                case 'application/json':
                    fs.readFile(file.path, (err, file) => {
                        if (err) {
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
    convertCSVtoJSON(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, (err, file) => {
                if (err) {
                    reject('Failed to open CSV file.');
                }
                const json = {};
                const csv = file.toString();
                const rows = csv.split(/\n/g);
                const locals = rows[0].split(/,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))/g);
                for (let i = 0; i < locals.length; i++) {
                    let cleanName = locals[i].replace(/^[\"]/, '');
                    cleanName = cleanName.replace(/[\"]$/, '');
                    cleanName = cleanName.replace(/\"\"/g, `\${ '"' }`);
                    locals[i] = cleanName;
                    json[cleanName] = {};
                }
                if (rows) {
                    for (let i = 1; i < rows.length; i++) {
                        const values = rows[i].split(/,(?!(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$))/g);
                        if (values) {
                            if (values.length === locals.length) {
                                for (let k = 0; k < locals.length; k++) {
                                    let cleanName = values[k];
                                    if (values[k].length) {
                                        cleanName = cleanName.replace(/^[\"]/, '');
                                        cleanName = cleanName.replace(/[\"]$/, '');
                                        cleanName = cleanName.replace(/\"\"/g, `\${ '"' }`);
                                        values[k] = cleanName;
                                    }
                                    json[locals[k]][values[0]] = cleanName;
                                }
                            }
                        }
                        else {
                            reject('Failed to parse CSV values.');
                        }
                    }
                    resolve(json);
                }
                else {
                    reject('Failed to parse CSV rows.');
                }
            });
        });
    }
}
new Server();
