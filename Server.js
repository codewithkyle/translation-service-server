const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
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
    }
    homepage(req, res) {
        return res.status(200).sendFile(`${__dirname}/public/index.html`);
    }
    upload(req, res) {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }
        this.parseFile(req.file)
            .then(() => {
            return res.status(200).send('Upload successful.');
        })
            .catch(error => {
            return res.status(500).send(error);
        })
            .then(() => {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log('Failed to remove temp file', req.file.path, err);
                }
            });
        });
    }
    parseFile(file) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const json = await this.getJsonFromFile(file);
                    console.log(json);
                    await resolve();
                }
                catch (err) {
                    reject(err);
                }
            })();
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
