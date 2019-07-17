
let translations:any = null; 

const convertButton:HTMLButtonElement = document.body.querySelector('button');
convertButton.addEventListener('click', (e:Event)=>{
    if(!translations)
    {
        return;
    }

    fetch(`${ window.location.origin }/convert`, {
        headers: new Headers({
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        }),
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify(translations)
    })
    .then(request => request.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const temp = document.createElement('a');
        temp.setAttribute('download', `translations.zip`);
        temp.href = url;
        temp.click();
    })
    .catch(error => {
        console.error(error);
    });
});

class UploadPrompt{

    public view : HTMLElement;
    private _fileInput : HTMLInputElement;
    private _fileInputLabel : HTMLElement;

    constructor()
    {
        this.view = document.body.querySelector('upload-prompt');
        this._fileInput = this.view.querySelector('input#fileInput');
        this._fileInputLabel = this.view.querySelector('label');

        this.init();
    }

    private handleFileUpload:EventListener = this.change.bind(this);
    private handleDragEnter:EventListener = this.dragEnter.bind(this);
    private handleDragLeave:EventListener = this.dragLeave.bind(this);
    private handleDrop:EventListener = this.drop.bind(this);

    private init() : void
    {
        this._fileInput.addEventListener('change', this.handleFileUpload);

        this._fileInputLabel.addEventListener('dragenter', this.handleDragEnter);
        this._fileInputLabel.addEventListener('dragleave', this.handleDragLeave);
        this._fileInputLabel.addEventListener('dragover', (e:Event)=>{ e.preventDefault(); });
        this._fileInputLabel.addEventListener('drop', this.handleDrop);
    }

    private drop(e:DragEvent) : void
    {
        e.preventDefault();
        e.stopImmediatePropagation();        

        if(e.dataTransfer.files.length)
        {
            this.uploadFile(e.dataTransfer.files[0]);
        }
    }

    private dragEnter() : void
    {
        this._fileInputLabel.classList.add('is-prompting');
    }

    private dragLeave() : void
    {
        this._fileInputLabel.classList.remove('is-prompting');
    }

    private change() : void
    {
        if(!this._fileInput.files.length)
        {
            return;
        }

        this.uploadFile(this._fileInput.files[0]);
    }

    private uploadFile(file:File) : void
    {
        const data = new FormData();
        data.append('translation', file);

        fetch(`${ window.location.origin }/upload`, {
            headers: new Headers({
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }),
            credentials: 'include',
            method: 'POST',
            body: data
        })
        .then(request => request.json())
        .then(response => {
            if(response)
            {
                translations = response;
            }
        })
        .catch(error => {
            console.error(error);
        });
    }
}

new UploadPrompt();