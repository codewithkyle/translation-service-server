const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
class Server {
    constructor() {
        this._app = express();
        this._app.listen(8181);
        this._app.use(express.static('public'));
        this.router();
    }
    router() {
        this._app.get('/', this.homepage);
        this._app.post('/upload', upload.single('translation'), this.upload);
    }
    homepage(req, res) {
        return res.status(200).sendFile(`${__dirname}/public/index.html`);
    }
    upload(req, res) {
        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }
        return res.status(200).send('Upload successful.');
    }
}
new Server();
