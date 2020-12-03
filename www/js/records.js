/*eslint no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    window.doRecords = doRecords;
    window.recordsSearch = "";
});

// Display the records.
function doRecords() {
    var rec = window.utilGetJsonRecords();
    if (Object.keys(rec).length === 0) {
        return;
    }
    window.utilUpdateMetaTime(rec, "ctime", false);
    window.utilUpdateMetaTime(rec, "atime", true);
    window.utilUpdateRecords(rec, 0, false, true);

    var insert = document.getElementById('recordsInsert');
    insert.innerHTML = "";  // clear the DOM.

    // Create the search bar.
    var div = document.createElement("DIV");
    div.setAttribute("id", "main-records-search-div");

    var sch = document.createElement("INPUT");
    sch.setAttribute("type", "text");
    sch.setAttribute("id", "main-records-search");
    sch.setAttribute("onkeyup", "searchRecords()");
    sch.setAttribute("placeholder", "Case insensitive search for records..");
    sch.setAttribute("value", window.recordsSearch);
    div.appendChild(sch);

    var nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var clear = document.createElement("BUTTON");
    clear.setAttribute("id", "main-records-search-clear");
    clear.setAttribute("title", "clear the search expression");
    clear.setAttribute("type", "button");
    clear.setAttribute("onclick", "clearRecordsSearch()");
    clear.innerHTML = "Clear";
    div.appendChild(clear);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var add = document.createElement("BUTTON");
    add.setAttribute("type", "button");
    add.setAttribute("title", "add a new record");
    add.setAttribute("onclick", "addRecord()");
    add.innerHTML = "Add";
    div.appendChild(add);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var show = document.createElement("BUTTON");
    show.setAttribute("id", "main-records-show-hide");
    show.setAttribute("title", "show or hide password fields with the prefix 'pass'");
    show.setAttribute("type", "button");
    show.setAttribute("onclick", "toggleRecordsPasswords()");
    show.innerHTML = "Show";
    div.appendChild(show);

    // Add the total.
    var tval = document.createElement("SPAN");
    tval.setAttribute("id", "main-records-search-total");
    var total = 0;  // total records
    if ("records" in rec) {
        total = rec["records"].size
    }
    tval.innerHTML = "&nbsp;(" + total + ")";
    div.appendChild(tval);
    insert.appendChild(div);

    // Create the records entry.
    div = document.createElement("DIV");
    div.setAttribute("id", "main-records");

    // Display the records.
    displayRecords(rec, div);

    // Update the DOM.
    insert.appendChild(div);

    // Schedule search event if the search
    // string has a value.
    // This allows the system to "remember" the last search.
    if (window.recordsSearch) {
        setTimeout(searchRecords(), 200);
    }
}

// Display the records.
function displayRecords(rec, div) {
    // Records.
    if (!("records" in rec)) {
        return;
    }

    // Load the records to order by name and sort by name.
    var rkeys = []
    for (rkey in rec["records"]) {
        rkeys.push(rkey);
    }
    var srkeys = rkeys.sort(window.utilSortCaseInsensitiveCompare);

    // Now process the records in sorted order.
    // Record results in a table of values being created
    // in a div.
    for (var i=0; i < srkeys.length; i++) {
        var rid = window.utilZeroPad(i + 1, 5);
        var rkey = srkeys[i];
        displayRecord(rec, div, rid, rkey);
    }
}

function displayRecord(rec, div, rid, rkey) {
    var rdiv = document.createElement("DIV");
    rdiv.className = "main-record-div";

    // Fixed rkey is for the case where the rkey has
    // an embedded single quote.
    var frkey = rkey.replace("'", "\\'");

    // Create the buttons for this record.
    var deleteButton = document.createElement("BUTTON");
    deleteButton.setAttribute("type", "button");
    deleteButton.setAttribute("onclick", "deleteRecord('" + frkey + "')");
    deleteButton.innerHTML = "Delete";

    // Stack them.
    var br = document.createElement("BR");

    var editButton = document.createElement("BUTTON");
    editButton.setAttribute("type", "button");
    editButton.setAttribute("onclick", "editRecord('" + frkey + "', true)");
    editButton.innerHTML = "Edit";

    // Create the field table.
    var tbl = document.createElement("TABLE");
    var tbody = document.createElement("TBODY");

    // Collect the fld keys.
    var fkeys = [];
    for (fkey in rec["records"][rkey]) {
        fkeys.push(fkey);
    }

    // Sort the fld keys.
    var sfkeys = fkeys.sort(window.utilSortCaseInsensitiveCompare);

    // Define the record buttons.

    //  Report the fields in sorted order.
    var trow = document.createElement("TR");
    var td0 = document.createElement("TD");
    var td1 = document.createElement("TD");
    var td2 = document.createElement("TD");
    td0.innerHTML = "&nbsp";
    td1.innerHTML = rid;
    td2.setAttribute("rowspan", sfkeys.length + 2);

    // Add the Delete and Edit buttons in the third column.
    td2.appendChild(deleteButton);
    td2.appendChild(br);
    td2.appendChild(editButton);

    trow.appendChild(td0);
    trow.appendChild(td1);
    trow.appendChild(td2);
    tbody.appendChild(trow);

    trow = document.createElement("TR");
    td0 = document.createElement("TD");
    td1 = document.createElement("TD");
    td0.innerHTML = "id";
    td1.innerHTML = rkey;
    updateFieldAttrs(rec, td0, "__id__");
    updateFieldAttrs(rec, td1, "id");
    trow.appendChild(td0);
    trow.appendChild(td1);
    tbody.appendChild(trow);

    for (var j=0; j < sfkeys.length; j++) {
        var fkey = sfkeys[j];
        var fval = rec["records"][rkey][fkey];
        displayField(rec, tbody, fkey, fval);
    }
    tbl.appendChild(tbody);
    rdiv.appendChild(tbl);
    div.appendChild(rdiv);
}

function displayField(rec, tbody, fkey, fval) {
    var trow = document.createElement("TR");
    var td0 = document.createElement("TD");
    td0.innerHTML = fkey;

    var td1 = document.createElement("TD");

    // This logic makes all fields selectable unless
    // they have the "http:" or "https:" prefix in
    // which case they are linkable.
    var inp;
    var ufval = "";
    if (typeof fval == 'string' || fval instanceof String) {
        ufval = fval.toUpperCase();
    }
    if (ufval.startsWith("HTTP:") || ufval.startsWith("HTTPS:")) {
        inp = document.createElement("A");
        inp.setAttribute("href", fval);
        inp.setAttribute("target", "_blank");
        inp.innerHTML = fval;
    } else {
        inp = document.createElement("INPUT");
        inp.setAttribute("size", "120");
        inp.setAttribute("readonly", true);
        inp.setAttribute("onclick", "window.utilSelectTextByObject(this);");
        if (fkey.toUpperCase().startsWith("PASS")) {
            inp.className = "main-records-password-field";
            inp.setAttribute("type", "password");  // hide by default
        } else {
            inp.setAttribute("type", "text");
        }
        inp.value = fval;
    }
    td1.appendChild(inp);
    updateFieldAttrs(rec, td0, "__id__");
    updateFieldAttrs(rec, td1, fkey);
    trow.appendChild(td0);
    trow.appendChild(td1);
    tbody.appendChild(trow);
}

// Clear the search bar.
function clearRecordsSearch() {
    document.getElementById("main-records-search").value = "";
    window.recordsSearch = "";
    setTimeout(searchRecords(), 200);
}

// Toggle the password visibility.
function toggleRecordsPasswords() {
    var i;
    var obj1 = document.getElementById("main-records-show-hide");
    var obj2s = document.getElementsByClassName("main-records-password-field");
    if (obj1.innerHTML == "Show") {
        obj1.innerHTML = "Hide";
        for (i=0; i<obj2s.length; i++) {
            obj2s[i].setAttribute("type", "text");
        }
    } else {
        obj1.innerHTML = "Show";
        for (i=0; i<obj2s.length; i++) {
            obj2s[i].setAttribute("type", "password");
        }
    }
}

function updateFieldAttrs(rec, obj, fkey) {
    // Add in the "fields" attributes.
    if ("fields" in rec && fkey in rec["fields"]) {
        var frec = rec["fields"][fkey];
        if ("class" in frec) {
            obj.className = frec["class"];
        }
        if ("attrs" in frec) {
            for (var akey in frec["attrs"]) {
                obj.setAttribute(akey, frec["attrs"][akey]);
            }
        }
    }
}

function searchRecords() {
    var input = document.getElementById("main-records-search");
    var filter = input.value.toUpperCase();
    var divs = document.getElementsByClassName("main-record-div");
    let regex = new RegExp(filter);
    window.recordsSearch = input.value;

    var num = 0;
    for (var i = 0; i < divs.length; i++) {
        var div = divs[i];
        var tbl = div.getElementsByTagName("TABLE")[0];
        var trs = tbl.getElementsByTagName("TR");
        // Build up the search key from the data.
        var sch = "";
        for (var j=0; j<trs.length; j++) {
            var tr = trs[j];
            var tds = tr.getElementsByTagName("TD");
            var tkey = tds[0];
            var tval = tds[1];
            var key = tkey.textContent || tkey.innerText;
            var val = tval.textContent || tval.innerText;
            sch += key + "::" + val + ";;"
        }
        var found = sch.toUpperCase().match(regex);
        if (found) {
            div.style.display = "";
            num++;
        } else {
            div.style.display = "none";
        }
    }
    var obj = document.getElementById("main-records-search-total");
    obj.innerHTML = "&nbsp;(" + num + ")";
}

// Delete the record in place.
function deleteRecord(rkey) {
    var ok = confirm("Really delete " + rkey + "?");
    if (!ok) {
        return;
    }
    var rec = window.utilGetJsonRecords();
    if ("records" in rec) {
        if (rkey in rec["records"]) {
            delete rec["records"][rkey];
            window.utilUpdateRecords(rec, 0, true, true);
            doRecords();
        }
    }
}

// Goto the Add tab.
function addRecord() {
    // Click over to the correct tab.
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        var tab = tablinks[i];
        var name = tab.innerHTML.trim();
        if (name == "Add") {
            tab.click();
            break;
        }
    }
}

// Goto the Edit tab.
function editRecord(rkey, gototab) {
    if (gototab) {
        // Click over to the correct tab.
        var tablinks = document.getElementsByClassName("tablinks");
        for (var i = 0; i < tablinks.length; i++) {
            var tab = tablinks[i];
            var name = tab.innerHTML.trim();
            if (name == "Edit") {
                tab.click();
                break;
            }
        }
    }

    var rec = window.utilGetJsonRecords();
    if ("records" in rec && rkey in rec["records"]) {
        // Get the fields in sorted order.
        var record = rec["records"][rkey];
        window.editMakePanel(record, rkey);
    } else {
        alert("WARNING! record not found: '" + rkey + "'");
    }
}
