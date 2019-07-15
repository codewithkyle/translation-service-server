var file = null;
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
            'X-Requested-With': 'XMLHttpRequest'
        }),
        method: 'POST',
        body: data
    })
        .then(function (request) { return request.text(); })
        .then(function (response) {
        console.log(response);
    });
}
//# sourceMappingURL=main.js.map