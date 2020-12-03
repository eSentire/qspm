// Password utilities.
/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    window.passwordSize = passwordSize;
    window.passwordClear = passwordClear;
    window.passwordShowHide = passwordShowHide;
    window.passwordGenerate = passwordGenerate;
    window.passwordCreateFieldset = passwordCreateFieldset;
});

// Password size.
function passwordSize(input, szid, sstore) {
    var obj = document.getElementById(szid);
    obj.innerHTML = "(" + input.value.length + ")";
    if (sstore) {
        sessionStorage.setItem(sstore, input.value);
    }
}

// Clear password.
function passwordClear(id, szid, sstore) {
    var obj = document.getElementById(id);
    obj.value = '';
    obj.focus();
    obj.setSelectionRange(obj.value.length,obj.value.length);
    obj.click();
    if (szid) {
        passwordSize(obj, szid, sstore);
    }
}

// Generate a pseudo-random password.
// The password length is somewhere between 16 and 31.
function passwordGenerate(id, szid, sstore) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-!.";
    var size = alphabet.length;
    var result = '';

    // Add a touch more randomness.
    var num_rounds = Math.floor(Math.random() * (100 - 0));
    for (let j=0; j < num_rounds; j++) {
        var length = Math.floor(Math.random() * (31 - 15)) + 15;
        let array;
        if ('Uint8Array' in self && 'crypto' in self) {
            array = new Uint8Array(length);
            self.crypto.getRandomValues(array);
        } else {
            array = new Array(length);
            for (let i = 0; i < length; i++) {
                array[i] = Math.floor(Math.random() * 62);
            }
        }
        result = '';  // reset each round
        for (let i=0; i < length; i++) {
            result += alphabet.charAt(array[i] % size);
        }
    }
    var obj = document.getElementById(id);
    obj.value = result;
    if (szid) {
        passwordSize(obj, szid, sstore);
    }
}

// Show or hide a password.
function passwordShowHide(me, id) {
    var obj = document.getElementById(id);
    if (obj.type == "text") {
        obj.type = "password";
        me.innerHTML = "Show";
    } else {
        obj.type = "text";
        me.innerHTML = "Hide";
    }
}

// Generate a password fieldset.
// Used by add and edit.
// show - if true show the plaintext password, if false hide it
// sstore - the session store key name for tab persistence
function passwordCreateFieldset(prefix, title, show, sstore) {
    var fieldset = document.createElement("FIELDSET");

    var legend = document.createElement("LEGEND");
    legend.innerHTML = title;
    fieldset.appendChild(legend);

    var button;
    var pid = prefix + "Id";
    var sid = prefix + "Size";

    var input = document.createElement("INPUT");
    input.setAttribute("id", pid);
    if (show) {
        input.setAttribute("type", "text");
    } else {
        input.setAttribute("type", "password");
    }
    input.setAttribute("onkeyup", "window.passwordSize(this,'" + sid + "','" + sstore + "')");
    input.setAttribute("size", "40");
    if (sstore) {
        // If a session storage key was specified,
        // use it to initialize the input.
        let data = sessionStorage.getItem(sstore);
        input.setAttribute("value", data);
    }
    fieldset.appendChild(input);

    var nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "window.passwordShowHide(this,'" + pid + "')");
    if (show) {
        button.innerHTML = "Hide";
    } else {
        button.innerHTML = "Show";
    }
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "window.utilSelectTextById('" + pid + "')");
    button.innerHTML = "Select";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "window.passwordClear('" + pid + "','" + sid + "','" + sstore + "')");
    button.innerHTML = "Clear";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "window.passwordGenerate('" + pid + "','" + sid + "', '" + sstore + "')");
    button.setAttribute("title", "generate a [15..30] character, pseudo-random password");
    button.innerHTML = "Generate";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    var span = document.createElement("SPAN");
    span.setAttribute("id", sid);
    fieldset.appendChild(span);

    return fieldset;
}
