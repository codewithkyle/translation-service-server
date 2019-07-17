var file = null;
var translations = null;
var fileInput = document.body.querySelector('input#fileInput');
fileInput.addEventListener('change', function (e) {
    var target = e.currentTarget;
    uploadFile(target.files[0]);
});
function uploadFile(file) {
    var data = new FormData();
    data.append('translation', file);
    fetch(window.location.origin + "/upload", {
        headers: new Headers({
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        }),
        credentials: 'include',
        method: 'POST',
        body: data
    })
        .then(function (request) { return request.json(); })
        .then(function (response) {
        if (response) {
            translations = response;
        }
    })
        .catch(function (error) {
        console.error(error);
    });
}
var convertButton = document.body.querySelector('button');
convertButton.addEventListener('click', function (e) {
    if (!translations) {
        return;
    }
    fetch(window.location.origin + "/convert", {
        headers: new Headers({
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        }),
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify(translations)
    })
        .then(function (request) { return request.blob(); })
        .then(function (blob) {
        var url = window.URL.createObjectURL(blob);
        var temp = document.createElement('a');
        temp.setAttribute('download', "translations.zip");
        temp.href = url;
        temp.click();
    })
        .catch(function (error) {
        console.error(error);
    });
});
//# sourceMappingURL=main.js.map