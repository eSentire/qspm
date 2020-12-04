// General utilities.
/*eslint no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    window.utilGetJsonRecords = utilGetJsonRecords;
    window.utilUpdateRecords = utilUpdateRecords;
    window.utilUpdateMetaTime = utilUpdateMetaTime;
    window.utilZeroPad = utilZeroPad;
    window.utilSelectTextByObject = utilSelectTextByObject;
    window.utilSelectTextById = utilSelectTextById;
    window.utilSortCaseInsensitiveCompare = utilSortCaseInsensitiveCompare;
    window.utilGetEncryptedPrefix = utilGetEncryptedPrefix;
    window.utilSetCryptText = utilSetCryptText;
    window.utilGetCryptText = utilGetCryptText;
    window.utilSetCryptTextSize = utilSetCryptTextSize;
    window.utilAssignSessionStoreValue = utilAssignSessionStoreValue;
});

// Update a session store value.
function utilSetSessionKey(oid, ssid) {
    var obj = document.getElementById(oid);
    if (obj) {
        sessionStorage.setItem(ssid, obj.value);
    } else {
        alert("WARNING! internal error: utilSetSessionKey: " + oid + " not found");
    }
}

// Set session value.
function utilAssignSessionStoreValue(oid, ssid) {
    var text = sessionStorage.getItem(ssid);
    if (text) {
        var obj = document.getElementById(oid);
        if (obj) {
            obj.value = text
        } else {
            alert("WARNING! internal error: utilAssignSessionStoreValue: element not defined: " + oid + " for " + ssid);
        }
    }
}

// Button onclick to set an input value.
function utilButtonSetValue(oid, text, ssid) {
    var obj = document.getElementById(oid);
    if (obj) {
        obj.value = text;
        sessionStorage.setItem(ssid, text);
    } else {
        alert("WARNING! internal error: utilButtonSetValue: " + oid + " not found");
    }
}

// Button onclick to clear an input value.
function utilButtonClearValue(oid, ssid) {
    utilButtonSetValue(oid, '', ssid);
}

// Set the crypt text.
// This is a single entry point that allows session
// storage to be used.
function utilSetCryptText(text) {
    var obj = document.getElementById('cryptText');
    obj.value = text;
    sessionStorage.setItem('ssidCryptText', text);
    utilSetCryptTextSize();
}

function utilSetCryptTextSize() {
    var text = window.utilGetCryptText()
    var sobj = document.getElementById("cryptTextSizeValue");
    if (!text) {
        sobj.innerHTML = "(0)";
    } else {
        sobj.innerHTML = "(" + text.length + ")";
    }
}

// Get the crypt text.
function utilGetCryptText() {
    return document.getElementById('cryptText').value;
}

// Get the encrypted prefix.
function utilGetEncryptedPrefix() {
    return window.wasm.fct_header_prefix(window.wasm.algorithm);
}

// Get the JSON records.
function utilGetJsonRecords() {
    var text = window.utilGetCryptText().trim();
    if (text.startsWith(window.utilGetEncryptedPrefix())) {
        // Decrypt and then re-encrypt.
        window.doDecrypt();
        text = window.utilGetCryptText();
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
    var text = window.utilGetCryptText().trim();
    if (updateTimes) {
        utilUpdateMetaTime(rec, "ctime", false);
        utilUpdateMetaTime(rec, "atime", true);
        utilUpdateMetaTime(rec, "mtime", modified);
    }
    if (text.startsWith(window.utilGetEncryptedPrefix())) {
        // Decrypt and then re-encrypt.
        window.doDecrypt();
        text = JSON.stringify(rec, null, indent);
        window.utilSetCryptText(text);
        window.doEncrypt();
    } else {
        window.utilSetCryptText(text);
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
    var s = n.toString();
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
