
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
    sch.setAttribute("onpaste", "searchRecords()");
    sch.setAttribute("placeholder", "Case insensitive id search for records..");
    sch.value = window.recordsSearch;
    div.appendChild(sch);

    var nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var clear = document.createElement("BUTTON");
    clear.setAttribute("id", "main-records-search-clear");
    clear.setAttribute("type", "button");
    clear.setAttribute("onclick", "clearRecordsSearch()");
    clear.title = "Clear the search expression.";
    clear.innerHTML = "Clear";
    div.appendChild(clear);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var add = document.createElement("BUTTON");
    add.setAttribute("type", "button");
    add.setAttribute("onclick", "addRecord()");
    add.title = "Add a new record.";
    add.innerHTML = "Add";
    div.appendChild(add);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    div.appendChild(nbsp);

    var show = document.createElement("BUTTON");
    show.setAttribute("id", "main-records-show-hide");
    show.setAttribute("type", "button");
    show.setAttribute("onclick", "toggleRecordsPasswords()");
    show.title = "Show or hide password fields with the prefix 'pass'.";
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
    setTimeout(searchRecords(), 200);
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
    var br1 = document.createElement("BR");
    var br2 = document.createElement("BR");

    var editButton = document.createElement("BUTTON");
    editButton.setAttribute("type", "button");
    editButton.setAttribute("onclick", "editRecord('" + frkey + "', true)");
    editButton.innerHTML = "Edit";

    // The local show/hide is only for convenience.
    // It works by "clicking" the top level Show/Hide button.
    var showButton = document.createElement("BUTTON");
    showButton.setAttribute("type", "button");
    showButton.setAttribute("onclick", "toggleRecordsPasswords()");
    showButton.classList.add("main-records-show-hide-button");
    showButton.title = "Show or hide password fields with the prefix 'pass'.";
    showButton.innerHTML = "Show";

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
    td2.appendChild(br1);
    td2.appendChild(editButton);
    td2.appendChild(br2);
    td2.appendChild(showButton);

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
    var noteHeight = sessionStorage.getItem("noteHeight");
    if (typeof fval == 'string' || fval instanceof String) {
        ufval = fval.toUpperCase();
    }
    if (ufval.startsWith("HTTP:") || ufval.startsWith("HTTPS:")) {
        inp = document.createElement("A");
        inp.setAttribute("href", fval);
        inp.setAttribute("target", "_blank");
        inp.innerHTML = fval;
    } else {
        if (fkey.toUpperCase().startsWith("PASS")) {
            // Handle passwords - fields are always hidden.
            inp = document.createElement("INPUT");
            inp.setAttribute("type", "password");  // hide by default
            inp.className = "main-records-password-field";
        } else if (fkey.toUpperCase().startsWith("NOTE")) {
            // Handle text areas.
            inp = document.createElement("TEXTAREA");
            inp.setAttribute("rows", noteHeight);
            inp.className = "main-records-textarea-field";
        } else {
            inp = document.createElement("INPUT");
            inp.setAttribute("type", "text");
            inp.className = "main-records-text-field";
        }
        inp.setAttribute("readonly", true);
        inp.setAttribute("onclick", "window.utilSelectTextByObject(this);");
        inp.setAttribute("style", "width:99%; display:block; border:none");
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
    var obj3s = document.getElementsByClassName("main-records-show-hide-button");
    var atype = "?";
    var title = "?";
    if (obj1.innerHTML == "Show") {
        title = "Hide";
        atype = "text";
    } else {
        title = "Show";
        atype = "password";
    }

    // Update the objects.
    obj1.innerHTML = title;  // the top level button
    for (i=0; i<obj2s.length; i++) {
        obj2s[i].setAttribute("type", atype);  // each field
    }
    for (i=0; i<obj3s.length; i++) {
        obj3s[i].innerHTML = title;  // each record show button
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
