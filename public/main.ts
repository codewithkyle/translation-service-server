let file = null;

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
            'X-Requested-With': 'XMLHttpRequest'
        }),
        method: 'POST',
        body: data
    })
    .then(request => request.text())
    .then(response => {
        console.log(response);
    });
}