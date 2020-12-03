// Raw tab services.
window.addEventListener("load", function(evt) {
    document.getElementById('ulUpload').addEventListener('click', upload);
    document.getElementById('ulDownload').addEventListener('click', download);
    document.getElementById('ulDownloadFile').addEventListener('click', downloadFile);
    document.getElementById('ulDownloadUrl').addEventListener('click', downloadUrl);
    document.getElementById('ulView').addEventListener('click', listFiles);
    document.getElementById('ulClear').addEventListener('click', listFilesClear);
    document.getElementById('encryptButton').addEventListener('click', doEncrypt);
    document.getElementById('decryptButton').addEventListener('click', doDecrypt);
    document.getElementById('cryptFormat').addEventListener('click', formatText);
    document.getElementById('cryptCompress').addEventListener('click', compressText);
    document.getElementById('cryptClear').addEventListener('click', clearText);
    document.getElementById('cryptExample').addEventListener('click', exampleText);
    document.getElementById('cryptTextSize').addEventListener('click', doTextSize);
    doTextSize();
    document.getElementById("defaultTab").click();
    window.doDecrypt = doDecrypt;
    window.doEncrypt = doEncrypt;
    window.doUlOptions = doUlOptions;
    initRaw();
});

// Initialize. Basically just add in the password fieldset.
function initRaw() {
    var pfs = document.getElementById('rawPasswordId');
    if (!pfs) {
        // Don't re-create it if it is already there.
        var div = document.getElementById('rawPasswordFieldset');
        var fieldset = window.passwordCreateFieldset('rawPassword', 'Master Password', false);
        div.innerHTML = "";  // clear the DOM.
        div.appendChild(fieldset)
    }
}

// Upload/download options.
function doUlOptions() {
    var obj1 = document.getElementById('ulOptionsSelect');
    var obj2 = document.getElementById('rawUlDivDropBox');
    var obj3 = document.getElementById('rawUlDivFile');
    var obj4 = document.getElementById('rawUlDivUrl');
    if (obj1.value == "dropbox") {
        obj2.setAttribute("style", "display:inline");
        obj3.setAttribute("style", "display:none");
        obj4.setAttribute("style", "display:none");
    } else if (obj1.value == "file") {
        obj2.setAttribute("style", "display:none");
        obj3.setAttribute("style", "display:inline");
        obj4.setAttribute("style", "display:none");
    } else if (obj1.value == "url") {
        obj2.setAttribute("style", "display:none");
        obj3.setAttribute("style", "display:none");
        obj4.setAttribute("style", "display:inline");
    } else {
        obj2.setAttribute("style", "display:none");
        obj3.setAttribute("style", "display:none");
        obj4.setAttribute("style", "display:none");
    }
}

// Clear view files.
function listFilesClear() {
    window.dropboxClearList();
}

// View files.
function listFiles() {
    var token = document.getElementById('ulToken').value.trim();
    if (!token) {
        alert("WARNING! DropBox token was not specified");
        return;
    }
    window.dropboxListFiles();
}

// Upload to the server.
function upload() {
    var token = document.getElementById('ulToken').value.trim();
    var fname = document.getElementById('ulFile').value.trim();
    if (!token) {
        alert("WARNING! DropBox token was not specified");
        return;
    }
    if (!fname) {
        alert("WARNING! upload file was not specified");
        return;
    }
    window.dropboxUpload();
}

// Download to the server.
function download() {
    var token = document.getElementById('ulToken').value.trim();
    var fname = document.getElementById('ulFile').value.trim();
    if (!token) {
        alert("WARNING! DropBox token was not specified");
        return;
    }
    if (!fname) {
        alert("WARNING! download file was not specified, click on 'List Files' to see the files that are available");
        return;
    }
    window.dropboxDownload();
}

// Download a file.
function downloadFile() {
    var div = document.getElementById("ulFileListDiv");
    var fname = document.getElementById('ulFile').value.trim();
    var input = document.createElement("INPUT");
    div.innerHTML = "";
    input.setAttribute("id", "download-text-file-selector");
    input.setAttribute("style", "visibility:hidden");
    input.setAttribute("type", "file");
    input.setAttribute("accept", ".txt");
    input.addEventListener('change', (event) => {
        const fileList = event.target.files;
        if (fileList.length == 1) {
            var file = fileList[0];
            div.innerHTML = file.name;  // display the last downloaded file
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                const result = event.target.result;
                var obj = document.getElementById("cryptText");
                obj.value = result;
            });
            reader.readAsText(file);
        }
    });
    div.appendChild(input);
    input.click();
}

// Download data from a URL.
function downloadUrl() {
    var div = document.getElementById("ulUrlListDiv");
    var url = document.getElementById('ulUrl').value.trim();
    var input = document.createElement("INPUT");
    if (!url) {
        alert("WARNING! URL was not specified");
        return;
    }
    fetch(url, {})
        .then(response => {
            if (response.ok) {
                response.text();
            } else {
                throw new Error("" + response.status + ": " + response.statusText);
            }
        })
        .then(text => {
            var obj = document.getElementById("cryptText");
            if (text) {
                obj.value = text;
            } else {
                alert("WARNING! no data found");
            }
        })
        .catch(err => {
            alert("WARNING! URL download failed from " + url + " - " + err);
        });
}

// Encrypt.
function doEncrypt() {
    var obj1 = document.getElementById("rawPasswordId");
    var obj2 = document.getElementById("cryptText");
    var pass = obj1.value.trim();
    var text = obj2.value.trim();
    if (!pass) {
        alert("WARNING! no password specified");
        return;
    }
    if (!text) {
        alert("WARNING! no text specified");
        return;
    }
    var result = window.wasm.fct_encrypt(window.wasm.algorithm, pass, text);
    if (result.startsWith("error:encrypt:")) {
        var len = Math.min(result.length, 32);
        alert("WARNING! encrypt: (" + result.length + ") '" + result.substring(0, len) + "'..." );
        return;
    }
    obj2.value = result;
    doTextSize();
}

// Decrypt.
function doDecrypt() {
    var obj1 = document.getElementById("rawPasswordId");
    var obj2 = document.getElementById("cryptText");
    var pass = obj1.value.trim();
    var text = obj2.value.trim();
    if (!pass) {
        alert("WARNING! no password specified");
        return;
    }
    if (!text) {
        alert("WARNING! no text specified");
        return;
    }
    var result = window.wasm.fct_decrypt(window.wasm.algorithm, pass, text);
    if (result.startsWith("error:decrypt:")) {
        var len = Math.min(result.length, 32);
        alert("WARNING! decrypt: (" + result.length + ") '" + result.substring(0, len) + "'...");
        return;
    }
    obj2.value = result;
    doTextSize();
}

// Clear the text.
function clearText() {
    var obj = document.getElementById("cryptText");
    obj.value = "";
    doTextSize();
}

// Format the text if it is decrypted.
function formatText() {
    var obj = document.getElementById("cryptText");
    var text = obj.value.trim();
    if (text.startsWith("-----")) {
        alert("WARNING! cannot format encrypted data");
    }
    var rec = JSON.parse(text);
    text = JSON.stringify(rec, null, 4);
    obj.value = text;
    doTextSize();
}

// Compress the text if it is decrypted.
function compressText() {
    var obj = document.getElementById("cryptText");
    var text = obj.value.trim();
    if (text.startsWith("-----")) {
        alert("WARNING! cannot compress encrypted data");
    }
    var rec = JSON.parse(text);
    text = JSON.stringify(rec);
    obj.value = text;
    doTextSize();
}

// Set the example text.
function exampleText() {
    var obj = document.getElementById("cryptText");
    var rec = {
        "meta": {
            "atime": "",
            "ctime": "",
            "mtime": "",
            "version": "0.1.0"
        },
        "fields": {
            "__id__": {
                "attrs": {"style": "text-align:center"}
            },
            "value" : {
                "attrs": {"style": "text-align:right"},
                "class": "number"
            },
            "status" : {
                "attrs": {"style": "text-align:center"}
            }
        },
        "records": {
            "Amazon": {
                "url": "https://www.amazon.com",
                "username": "pbrain22@protonmail.com",
                "password": "hr5Hn9pqm3u.VqMiALfdN-"
            },
            "AWS": {
                "url": "https://aws.amazon.com",
                "username": "pbrain22@protonmail.com",
                "password": "hr5Hn9pqm3u.VqMiALfdN-"
            },
            "DropBox": {
                "app": "qspm",
                "client": "oieGRvCXCvfaAg7",
                "password": "gWXLFz5dSeaK2isrm6W",
                "url": "https://www.dropbox.com/developers",
                "url-dev": "https://www.dropbox.com/developers/apps/info/oieGRvCXCvfaAg7#settings",
                "url-down": "https://content.dropboxapi.com/2/files/download",
                "url-list": "https://content.dropboxapi.com/2/files/list_folder",
                "url-up": "https://content.dropboxapi.com/2/files/upload",
                "username": "pbrain22@gmail.com",
                "notes": "use settings to generate new tokens"
            },
            "Facebook": {
                "url": "https://www.evernote.com",
                "username": "pbrain22@gmail.com",
                "password": "1FHwquPVNhmCyTD!UNTvR4m-g"
            },
            "GitHub": {
                "url": "https://github.com",
                "username": "pbrain22",
                "password": "C6kFz28MnbQlraqeJnsQlME2"
            },
            "Google pbrain22@gmail.com": {
                "url": "https://www.google.com",
                "username": "pbrain22@gmail.com",
                "password": "bcpqJgJ4yf7z0XQPLq1tqr",
                "security-question": "what is a photon? gauge-boson"
            },
            "Master": {
                "password": "example",
                "notes": "this is the master password"
            },
            "Netflix": {
                "url": "http://netflix.com",
                "username": "pbrain22@gmail.com",
                "password": "5IyKQEmdfo83ecGQSZmEfBU"
            },
            "Protonmail email pbrain22@protonmail.com": {
                "url": "https://mail.protonmail.com/inbox",
                "username": "pbrain22",
                "password": "eFawGXg3VDi.qyCCIkpnMdPFT3yf"
            },
            "StackExchange (StackOverflow)": {
                "url": "http://stackoverflow.com",
                "username": "pbrain22@gmail.com",
                "password": "s_SuVyADaqrqIY4sxIPfr1"
            },
            "Work": {
                "username": "pbrain@acme.com",
                "password": "XKn0x-i-AQxjmOARVHxecpoX2!"
            }
        }
    };
    obj.value = JSON.stringify(rec, null, 4);
    doTextSize();
}

function doTextSize() {
    var obj1 = document.getElementById("cryptText");
    var obj2 = document.getElementById("cryptTextSizeValue");
    if (!!obj1.value) {
        obj2.innerHTML = "(" + obj1.value.length + ")";
    } else {
        obj2.innerHTML = "(0)";
    }
}
