// Dropbox utilities.
window.addEventListener("load", function(evt) {
    window.dropboxUpload = dropboxUpload;
    window.dropboxDownload = dropboxDownload;
    window.dropboxListFiles = dropboxListFiles;
    window.dropboxClearList = dropboxClearList;
});

const PATH = "/qspm/";

// Upload to the server.
function dropboxUpload() {
    dropboxClearList();
    
    var obj1 = document.getElementById('ulToken');
    var obj2 = document.getElementById('ulFile');
    var obj3 = document.getElementById("cryptText");

    var text = obj3.value.trim();
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
            alert("SUCCESS! upload worked: " + fname);
        }
    ).catch((error) => {
        alert("WARNING! upload failed with code " + error);
    });
}

// Download to the server.
function dropboxDownload() {
    dropboxClearList();

    var obj1 = document.getElementById('ulToken');
    var obj2 = document.getElementById('ulFile');
    var obj3 = document.getElementById("cryptText");

    var url = "https://content.dropboxapi.com/2/files/download";
    var bearer = "Bearer " + obj1.value.trim();
    var fname = obj2.value.trim();
    var path = PATH + fname;
    var dbapi = {"path": path};
    var headers = {"Dropbox-API-Arg": JSON.stringify(dbapi),
                   "Authorization": bearer};

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
            obj3.value = data.trim();
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
    var obj1 = document.getElementById('ulToken');
    var obj2 = document.getElementById('ulListDiv');
    obj2.innerHTML = "";

    var url = "https://api.dropboxapi.com/2/files/list_folder";
    var bearer = "Bearer " + obj1.value.trim();
    var data = {"path":"/qspm"};
    var headers = {"Content-Type": "application/json",
                   "Authorization": bearer};

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
    var obj3 = document.getElementById('ulListDiv');
    obj3.innerHTML = "";
}
