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
        new Promise((resolve, reject) => {
            (async () => {
                try {
                    const json = await this.getJsonFromFile(req.file);
                    await resolve();
                }
                catch (err) {
                    reject(err);
                }
            })();
        })
            .then(() => {
            return res.status(200).send('Upload successful.');
        })
            .catch(error => {
            return res.status(500).send(error);
        });
    }
    getJsonFromFile(file) {
        return new Promise((resolve, reject) => {
            switch (file.mimetype) {
                case 'text/csv':
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
}
new Server();
