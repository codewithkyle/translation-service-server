let file = null;
let translations:any = null;

const fileInput:HTMLInputElement = document.body.querySelector('input#fileInput');
fileInput.addEventListener('change', (e:Event)=>{
    const target = <HTMLInputElement>e.currentTarget;
    uploadFile(target.files[0]);
});

function uploadFile(file:File)
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