// General utilities.
window.addEventListener("load", function(evt) {
    window.utilGetJsonRecords = utilGetJsonRecords;
    window.utilUpdateRecords = utilUpdateRecords;
    window.utilUpdateMetaTime = utilUpdateMetaTime;
    window.utilZeroPad = utilZeroPad;
    window.utilSelectTextByObject = utilSelectTextByObject;
    window.utilSelectTextById = utilSelectTextById;
    window.utilSortCaseInsensitiveCompare = utilSortCaseInsensitiveCompare;
    window.utilGetEncryptedPrefix = utilGetEncryptedPrefix;
});


// Get the encrypted prefix.
function utilGetEncryptedPrefix() {
    return window.wasm.fct_header_prefix(window.wasm.algorithm);
}

// Get the JSON records.
function utilGetJsonRecords() {
    var obj = document.getElementById('cryptText');
    var text = obj.value.trim();
    if (text.startsWith(window.utilGetEncryptedPrefix())) {
        // Decrypt and then re-encrypt.
        window.doDecrypt();
        obj = document.getElementById('cryptText');
        text = obj.value;
        if (text.startsWith(window.utilGetEncryptedPrefix())) {
            // decrypt failed
            return {};  // most likely an invalid password
        }
        window.doEncrypt();
    }
    var rec;
    try {
        rec = JSON.parse(text);
    } catch(e) {
        alert("WARNING! failed to parse JSON: " + e);
        return {};
    }
    return rec;
}

// Update the textarea data based on the internal
// record data.
function utilUpdateRecords(rec, indent, modified, updateTimes) {
    var obj1 = document.getElementById('cryptText');
    var text = obj1.value.trim();
    if (updateTimes) {
        utilUpdateMetaTime(rec, "ctime", false);
        utilUpdateMetaTime(rec, "atime", true);
        utilUpdateMetaTime(rec, "mtime", modified);
    }
    if (text.startsWith(window.utilGetEncryptedPrefix())) {
        // Decrypt and then re-encrypt.
        window.doDecrypt();
        obj1 = document.getElementById('cryptText');
        obj1.value = JSON.stringify(rec, null, indent);
        window.doEncrypt();
    } else {
        obj1.value = JSON.stringify(rec, null, indent);
    }
}

// Usage:
//   utilUpdateMetaTime(rec, "atime", true);
//   utilUpdateMetaTime(rec, "ctime", false);
//   utilUpdateMetaTime(rec, "mtime", true);
function utilUpdateMetaTime(rec, key, overwrite) {
    if ("meta" in rec && key in rec["meta"]) {
        if (overwrite) {
            rec["meta"][key] = utcnow();
            return true;
        } else if (!rec["meta"][key]) {
            rec["meta"][key] = utcnow();
            return true;
        }
    }
    return false;
}

function utcnow() {
    var date = new Date();
    return date.toISOString();
}

// Zero pad a number.
function utilZeroPad(n, len) {
    s = n.toString();
    if (s.length < len) {
        s = ('000000000000' + s).slice(-len);
    }
    return s;
}

// Select text by name.
function utilSelectTextById(id) {
    var obj = document.getElementById(id);
    utilSelectTextByObject(obj);
}

// Select text by object.
function utilSelectTextByObject(obj) {
    obj.select();
    document.execCommand('copy');
    setTimeout( function() {window.getSelection().removeAllRanges();}, 0.20);
}

// Case insensitive sort compare.
function utilSortCaseInsensitiveCompare(a, b) {
    // The standard says that the function must return:
    // < 0   if a < b
    // == 0  if a == b
    // > 0   if a > b
    if (a.toUpperCase() < b.toUpperCase()) {
        return -1;
    }
    if (a.toUpperCase() > b.toUpperCase()) {
        return 1;
    }
    return 0;
}
