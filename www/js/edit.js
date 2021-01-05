// Edit tab services.
/*eslint no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    window.doEdit = doEdit;
    window.editMakePanel = editMakePanel;
});

function doEdit() {
    editSearch();
}

function editSearch() {
    // Set up record search.
    var div = document.getElementById('editInsert');
    div.innerHTML = "";  // clear the DOM.

    var sch = document.createElement("INPUT");
    sch.setAttribute("type", "text");
    sch.setAttribute("id", "main-edit-search");
    sch.setAttribute("size", "100");
    sch.setAttribute("onkeyup", "editSearchRecords()");
    sch.setAttribute("onpaste", "editSearchRecords()");
    sch.setAttribute("placeholder", "Case insensitive search for the record to edit..");
    sch.value = "";
    div.appendChild(sch);

    var div1 = document.createElement("DIV");
    div1.setAttribute("id", "main-edit-search-div");
    div.appendChild(div1);
    setTimeout(editSearchRecords(), 0.200);
}

function editSearchRecords() {
    var input = document.getElementById("main-edit-search");
    var filter = input.value.toUpperCase();
    var div = document.getElementById("main-edit-search-div");
    let regex = new RegExp(filter);
    div.innerHTML = "";  // clear the DOM.
    var rec = window.utilGetJsonRecords();
    if ("records" in rec) {
        var par = document.createElement("P");
        div.appendChild(par);

        // Load the records to order by name and sort by name.
        var rkey;
        var rkeys = []
        for (rkey in rec["records"]) {
            rkeys.push(rkey);
        }
        var srkeys = rkeys.sort(window.utilSortCaseInsensitiveCompare);

        // Use an ordered list.
        var ol = document.createElement("OL");

        // Display each record as a button.
        for (var i=0; i < srkeys.length; i++) {
            rkey = srkeys[i];
            if (rkey.toUpperCase().match(regex)) {
                // Fixed rkey is for the case where the rkey has
                // an embedded single quote.
                var frkey = rkey.replace("'", "\\'");

                // Create the button.
                var button = document.createElement("BUTTON");
                button.setAttribute("type", "button");
                button.setAttribute("onclick", "editRecord('" + frkey + "', false)");
                button.innerHTML = rkey;

                // Update the list.
                var li = document.createElement("LI");
                li.appendChild(button);
                ol.appendChild(li);
            }
        }
        div.appendChild(ol);
    }
}

function editMakePanel(record, rkey) {
    var keys = []
    for (key in record) {
        keys.push(key);
    }
    var skeys = keys.sort(function(a,b) {
        if (a.toUpperCase() < b.toUpperCase()) {
            return -1;
        }
        if (a.toUpperCase() > b.toUpperCase()) {
            return 1;
        }
        return 0;
    });

    var div = document.getElementById('editInsert');
    div.innerHTML = "";  // clear the DOM.

    var fieldset = document.createElement("FIELDSET");
    var legend = document.createElement("LEGEND");
    legend.innerHTML = "Edit Record";
    fieldset.appendChild(legend)

    //var h4 = document.createElement("H4");
    //h4.innerHTML = rkey;
    //div.appendChild(h4);

    // Create the field edit table.
    var table = document.createElement("TABLE");
    var thead = document.createElement("THEAD");
    var tr = document.createElement("TR");

    var th = document.createElement("TH");
    th.innerHTML = "Field"
    th.classList.add("edit-table-column-header");
    tr.appendChild(th);

    th = document.createElement("TH");
    th.innerHTML = "Value"
    th.classList.add("edit-table-column-header");
    tr.appendChild(th);

    th = document.createElement("TH");
    th.innerHTML = "Options"
    th.classList.add("edit-table-column-header");
    tr.appendChild(th);

    thead.appendChild(tr);
    table.appendChild(thead);

    var tbody = document.createElement("TBODY");
    tbody.setAttribute("id", "main-record-edit-table-body");
    table.appendChild(tbody);

    // First row in the table is the id.
    tr = document.createElement("TR");

    var td = document.createElement("TD");
    td.innerHTML = "Unique Record Name (id)"
    td.title = "Used for record search. Can be anything.";
    tr.appendChild(td);

    td = document.createElement("TD");
    var inp = document.createElement("INPUT");
    inp.setAttribute("type", "text");
    inp.setAttribute("style", "width:640px");
    inp.classList.add("edit-table-column");
    inp.value = rkey;
    inp.title = "Changing this will create a new record.";
    td.appendChild(inp);
    tr.appendChild(td);

    td = document.createElement("TD");
    td.innerHTML = "&nbsp;";
    tr.appendChild(td);
    tbody.appendChild(tr);

    for (var i=0; i<skeys.length; i++) {
        var key = skeys[i];
        var val = record[key];
        editAppendTableRow(tbody, rkey, key, val);
    }
    fieldset.appendChild(table);

    // Create the action buttons.
    // Fixed rkey is for the case where the rkey has
    // an embedded single quote.
    var frkey = rkey.replace("'", "\\'");
    var button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "editAppendTableRowAction('" + frkey + "')");
    button.title = "Add a new row.";
    button.innerHTML = "Append Row";
    fieldset.appendChild(button);

    var span = document.createElement("SPAN");
    span.innerHTML = "&nbsp;";
    fieldset.appendChild(span);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "editSaveRecord('" + frkey + "')");
    button.title = "Save the changes.";
    button.innerHTML = "Save";
    fieldset.appendChild(button);

    span = document.createElement("SPAN");
    span.innerHTML = "&nbsp;";
    fieldset.appendChild(span);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "editDeleteRecord('" + frkey + "')");
    button.title = "Delete this record, a confirmation dialogue box will confirm.";
    button.innerHTML = "Delete";
    fieldset.appendChild(button);

    span = document.createElement("SPAN");
    span.innerHTML = "&nbsp;";
    fieldset.appendChild(span);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("onclick", "doEdit()");
    button.title = "Quit the edit operation, no changes are made.";
    button.innerHTML = "Quit";
    fieldset.appendChild(button);

    var par = document.createElement("P");
    par.setAttribute("style", "font-size:80%;font-style:italic");
    par.innerHTML = "NOTE: If the unique record name is changed, a new record is created when the 'Save' operation is run. The old record is not changed.";
    fieldset.appendChild(par);

    // Create the local password generator.
    var fieldset1 = window.passwordCreateFieldset('editPassword',
                                                  'Generate Password',
                                                  true,
                                                  '');

    // Create the top level elements.
    div.appendChild(fieldset);
    div.appendChild(document.createElement("P"));
    div.appendChild(fieldset1);
}

function editAppendTableRowAction(rkey) {
    var tbody = document.getElementById("main-record-edit-table-body");
    editAppendTableRow(tbody, rkey, "key", "value");
}

function editAppendTableRow(tbody, rkey, key, val) {
    // rkey - is the unique record key
    var tr = document.createElement("TR");
    var td;
    var inp;
    var textarea = key.toUpperCase().startsWith("NOTE");
    console.log("edit-key:" + key)
    console.log("edit-rkey:" + rkey)

    td = document.createElement("TD");
    inp = document.createElement("INPUT");
    inp.setAttribute("type", "text");
    inp.setAttribute("size", "36");
    inp.classList.add("edit-table-column");
    inp.value = key;
    td.appendChild(inp);
    tr.appendChild(td);

    td = document.createElement("TD");
    if (textarea) {
        inp = document.createElement("TEXTAREA");
        inp.setAttribute("rows", "3");
    }
    else {
        inp = document.createElement("INPUT");
    }
    inp.setAttribute("type", "text");
    inp.setAttribute("style", "width:640px");
    inp.classList.add("edit-table-column");
    inp.value = val;
    td.appendChild(inp);
    tr.appendChild(td);

    // Fixed rkey is for the case where the rkey has
    // an embedded single quote.
    var frkey = rkey.replace("'", "\\'");

    td = document.createElement("TD");
    inp = document.createElement("BUTTON");
    inp.setAttribute("type", "button");
    inp.setAttribute("onclick", "editDeleteRow('" + frkey + "', '" + key + "')");
    inp.innerHTML = "Delete";
    td.appendChild(inp);
    tr.appendChild(td);

    tbody.appendChild(tr);
}

function editDeleteRow(rkey, key) {
    var rec = window.utilGetJsonRecords();
    if ("records" in rec) {
        if (rkey in rec["records"]) {
            var record = rec["records"][rkey];
            if (key in record) {
                delete rec["records"][rkey][key];
                window.utilUpdateRecords(rec, 0, false, false);
                editMakePanel(record, rkey)
            }
        }
    }
}

function editSaveRecord(rkey) {
    var tbody = document.getElementById("main-record-edit-table-body");
    var trows = tbody.getElementsByTagName("TR");
    var rec = window.utilGetJsonRecords();

    var name = '';
    var nrec = {};
    for (var i=0; i<trows.length; i++) {
        var tr = trows[i];
        var tds = tr.getElementsByTagName("TD");
        var val = tds[1].getElementsByTagName("INPUT")[0].value.trim();
        if (i==0) {
            if (val) {
                name = val;
            }
        } else {
            var key = tds[0].getElementsByTagName("INPUT")[0].value.trim();
            if (!key) {
                continue;
            }
            if (key) {
                nrec[key] = val;
            }
        }
    }
    if (!name) {
        alert("WARNING! empty id field, will ignore");
        return;
    }

    if (!("records" in rec)) {
        rec["records"] = {};
    }
    rec["records"][name] = nrec;

    // TODO: get the table data.
    window.utilUpdateRecords(rec, 0, false, false);
    doEdit();
    alert("SUCCESS: edited " + rkey);
}


// Delete the record in place.
function editDeleteRecord(rkey) {
    var ok = confirm("Really delete " + rkey + "?");
    if (!ok) {
        return;
    }
    var rec = window.utilGetJsonRecords();
    if ("records" in rec) {
        if (rkey in rec["records"]) {
            delete rec["records"][rkey];
            window.utilUpdateRecords(rec, 0, true, true);
            doEdit();
        }
    }
}
