// Dropbox utilities.
/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    document.getElementById('ulDropboxUpload').addEventListener('click', dropboxUpload);
    document.getElementById('ulDropboxDownload').addEventListener('click', dropboxDownload);
    document.getElementById('ulDropboxView').addEventListener('click', dropboxListFiles);
    document.getElementById('ulDropboxClear').addEventListener('click', dropboxClearList);
});

const PATH = "/qspm/";

// Upload to the server.
function dropboxUpload() {
    dropboxClearList();

    var obj1 = document.getElementById('ulDropboxToken');
    var obj2 = document.getElementById('ulDropboxFile');

    var text = window.utilGetCryptText().trim();
    if (!text.startsWith(window.utilGetEncryptedPrefix())) {
        alert("WARNING! can only upload encrypted strings");
        return;
    }

    var url = "https://content.dropboxapi.com/2/files/upload";
    var bearer = "Bearer " + obj1.value.trim();
    var fname = obj2.value.trim();
    var path = PATH + fname;
    var dbapi = {
        "path": path,
        "mode": "overwrite",
        "autorename": true,
        "mute": false,
        "strict_conflict": false
    };
    var headers = {"Content-Type": "application/octet-stream",  // text/plain fails
                   "Dropbox-API-Arg": JSON.stringify(dbapi),
                   "Authorization": bearer};

    // Check.
    if (!bearer) {
        alert("WARNING! DropBox token was not specified");
        return;
    }
    if (!fname) {
        alert("WARNING! upload file was not specified");
        return;
    }

    // Fetch.
    fetch(url, {
        method : "POST",
        headers: headers,
        body: text
    }).then(
        response => {
            if (response.ok) {
                return response.json(); // .text(), .json(), etc.
            } else {
                throw new Error("" + response.status + ": " + response.statusText);
            }
        }
    ).then(
        data => {
            alert("SUCCESS! upload worked: " + fname + " (" + data.length + ")");
        }
    ).catch((error) => {
        alert("WARNING! upload failed with code " + error);
    });
}

// Download to the server.
function dropboxDownload() {
    dropboxClearList();

    var obj1 = document.getElementById('ulDropboxToken');
    var obj2 = document.getElementById('ulDropboxFile');

    var url = "https://content.dropboxapi.com/2/files/download";
    var bearer = "Bearer " + obj1.value.trim();
    var fname = obj2.value.trim();
    var path = PATH + fname;
    var dbapi = {"path": path};
    var headers = {"Dropbox-API-Arg": JSON.stringify(dbapi),
                   "Authorization": bearer};

    // Check.
    if (!bearer) {
        alert("WARNING! DropBox token was not specified");
        return;
    }
    if (!fname) {
        alert("WARNING! upload file was not specified");
        return;
    }

    // Fetch.
    fetch(url, {
        method : "POST",
        headers: headers
    }).then(
        response => {
            if (response.ok) {
                return response.text(); // .text(), .json(), etc.
            } else {
                throw new Error("" + response.status + ": " + response.statusText);
            }
        }
    ).then(
        data => {
            window.utilSetCryptText(data.trim());
            setTimeout(function() {
                alert("SUCCESS! download worked: " + fname);
            }, 0.30);
        }
    ).catch((error) => {
        alert("WARNING! upload failed with code " + error);
    });
}

// View the available files.
function dropboxListFiles() {
    var obj1 = document.getElementById('ulDropboxToken');
    var obj2 = document.getElementById('ulDropboxFileListDiv');
    obj2.innerHTML = "";

    var url = "https://api.dropboxapi.com/2/files/list_folder";
    var bearer = "Bearer " + obj1.value.trim();
    var data = {"path":"/qspm"};
    var headers = {"Content-Type": "application/json",
                   "Authorization": bearer};

    // Check.
    if (!bearer) {
        alert("WARNING! DropBox token was not specified");
        return;
    }

    // Fetch.
    fetch(url, {
        method : "POST",
        headers: headers,
        body: JSON.stringify(data)
    }).then(
        response => {
            if (response.ok) {
                return response.json(); // .text(), .json(), etc.
            } else {
                throw new Error("" + response.status + ": " + response.statusText);
            }
        }
    ).then(
        data => {
            var ol = document.createElement("OL");
            var entries = data["entries"];
            for (var i=0; i<entries.length; i++) {
                var fname = entries[i]["path_display"];
                fname = fname.substring(PATH.length);  // strip off the prefix
                console.log("file: " + fname);
                var li = document.createElement("LI");
                li.innerHTML = fname;
                ol.appendChild(li);
            }
            obj2.appendChild(ol);
        }
    ).catch((error) => {
        alert("WARNING! list failed with code " + error);
        obj2.innerHTML = "0 files";
    });
}

// Clear view files.
function dropboxClearList() {
    var obj3 = document.getElementById('ulDropboxFileListDiv');
    obj3.innerHTML = "";
}
