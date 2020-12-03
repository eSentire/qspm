// Password utilities.
window.addEventListener("load", function(evt) {
    window.passwordSize = passwordSize;
    window.passwordClear = passwordClear;
    window.passwordShowHide = passwordShowHide;
    window.passwordGenerate = passwordGenerate;
    window.passwordCreateFieldset = passwordCreateFieldset;
});

// Clear password.
function passwordClear(id, szid) {
    var obj = document.getElementById(id);
    obj.value = '';
    obj.focus();
    obj.setSelectionRange(obj.value.length,obj.value.length);
    obj.click();
    if (szid) {
        var obj1 = document.getElementById(szid);
        obj1.innerHTML = "";
    }
}

// Password size.
function passwordSize(me, szid) {
    var obj = document.getElementById(szid);
    obj.innerHTML = "(" + me.value.length + ")";
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

// Generate a pseudo-random password.
// The password length is somewhere between 16 and 31.
function passwordGenerate(id, szid) {
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
        var obj1 = document.getElementById(szid);
        obj1.innerHTML = "(" + result.length + ")";
    }
}

// Generate a password fieldset.
// Used by add and edit.
// show - if true show the plaintext password, if false hide it
function passwordCreateFieldset(prefix, title, show) {
    var fieldset = document.createElement("FIELDSET");

    var legend = document.createElement("LEGEND");
    legend.innerHTML = title;
    fieldset.appendChild(legend);

    var button;
    var pid = prefix + "Id";
    var sid = prefix + "Size";

    //var label = document.createElement("LABEL");
    //label.innerHTML = "Password:"
    //fieldset.appendChild(label);

    //var nbsp = document.createElement("SPAN");
    //nbsp.innerHTML = "&nbsp;";
    //fieldset.appendChild(nbsp);

    var input = document.createElement("INPUT");
    input.setAttribute("id", pid);
    if (show) {
        input.setAttribute("type", "text");
    } else {
        input.setAttribute("type", "password");
    }
    input.setAttribute("onkeyup", "window.passwordSize(this,'" + sid + "')");
    input.setAttribute("size", "40");
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
    button.setAttribute("onclick", "window.passwordClear('" + pid + "','" + sid + "')");
    button.innerHTML = "Clear";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "window.passwordGenerate('" + pid + "','" + sid + "')");
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
