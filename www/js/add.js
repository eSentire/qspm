// Add tab services.
/*eslint no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    window.doAdd = doAdd;
});

const MAX_ADD_ROWS = 16;

function doAdd() {
    var i;
    var insert = document.getElementById('addInsert');
    insert.innerHTML = "";  // clear the DOM.

    var fieldset = document.createElement("FIELDSET");
    var legend = document.createElement("LEGEND");
    legend.innerHTML = "Add Record";
    fieldset.appendChild(legend)

    var tbl = document.createElement("TABLE");
    tbl.className = "main-record-add";

    var thead = document.createElement("THEAD");
    var tr = document.createElement("TR");
    var thns = ["#", "Field", "Value"];
    for (i in thns) {
        var th = document.createElement("TH");
        th.innerHTML = thns[i];
        tr.appendChild(th);
    }
    thead.appendChild(tr);
    tbl.appendChild(thead);

    var tbody = document.createElement("TBODY");
    tbody.setAttribute("id", "main-record-add-table-body");

    // First row is exceptional.
    tr = document.createElement("TR");

    var td = document.createElement("TD");
    td.innerHTML = "&nbsp;";
    tr.appendChild(td);

    td = document.createElement("TD");
    td.innerHTML = "Unique Record Name";
    tr.appendChild(td);

    td = document.createElement("TD");
    var input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("id", "add-rec-0-key");
    input.setAttribute("size", "120");
    td.appendChild(input);
    tr.appendChild(td);

    tbody.appendChild(tr);

    // All of the other rows are boiler plate.
    for (i=1; i<=5; i++) {
        addAppendTableRow(tbody, i);
    }
    tbl.appendChild(tbody);
    fieldset.appendChild(tbl);

    var button, nbsp;

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("title", "add a new row");
    button.setAttribute("onclick", "addAppendTableRowAction()");
    button.innerHTML = "Append Row";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("title", "save if this record is unique");
    button.setAttribute("onclick", "addSaveRecord()");
    button.innerHTML = "Save";
    fieldset.appendChild(button);

    nbsp = document.createElement("SPAN");
    nbsp.innerHTML = "&nbsp;";
    fieldset.appendChild(nbsp);

    button = document.createElement("BUTTON");
    button.setAttribute("type", "button");
    button.setAttribute("title", "clear the fields");
    button.setAttribute("onclick", "addClearFields()");
    button.innerHTML = "Clear";
    fieldset.appendChild(button);

    insert.appendChild(fieldset);

    var fieldset1 = window.passwordCreateFieldset('addPassword',
                                                  'Generate Password',
                                                  true,
                                                  '');
    insert.appendChild(document.createElement("P"));
    insert.appendChild(fieldset1);
}

function addAppendTableRowAction() {
    var tbody = document.getElementById("main-record-add-table-body");
    var trows = tbody.getElementsByTagName("TR");
    var i = trows.length;
    if (i > MAX_ADD_ROWS) {
        alert("WARNING! a maximum of " + MAX_ADD_ROWS + " rows is allowed");
        return;
    }
    addAppendTableRow(tbody, i);
}

function addAppendTableRow(tbody, i) {
    var tr = document.createElement("TR");

    var td = document.createElement("TD");
    td.setAttribute("style", "text-align:right");
    td.innerHTML = i;
    tr.appendChild(td);

    td = document.createElement("TD");
    var input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("id", "add-rec-" + i + "-key");
    input.setAttribute("size", "32");
    td.appendChild(input);
    tr.appendChild(td);

    td = document.createElement("TD");
    //input = document.createElement("TEXTAREA");
    //input.setAttribute("rows", "1");
    //input.setAttribute("cols", "80");
    input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("id", "add-rec-" + i + "-val");
    input.setAttribute("size", "120");
    td.appendChild(input);
    tr.appendChild(td);

    tbody.appendChild(tr);
}

// Clear all of the fields on the Add page.
function addClearFields() {
    var obj1 = document.getElementById("main-record-add-table-body");
    var obj2s = obj1.getElementsByTagName("INPUT");
    for (var i=0; i<obj2s.length; i++) {
        obj2s[i].value = "";
    }
}

function addSaveRecord() {
    var rkey = document.getElementById("add-rec-0-key").value.trim();
    if (!rkey) {
        alert("WARNING! empty id is not valid");
        return
    }
    var rec = window.utilGetJsonRecords();
    if (!("records" in rec)) {
        rec["records"] = {};
    }
    if (rkey in rec["records"]) {
        alert("WARNING! record already exists '" + rkey + "'");
        return
    }

    // Collect all of the key value pairs.
    rec["records"][rkey] = {};
    for (var i=1; i<=MAX_ADD_ROWS; i++) {
        var okey = document.getElementById("add-rec-" + i + "-key");
        var oval = document.getElementById("add-rec-" + i + "-val");
        if (!okey || !oval) {
            continue;
        }
        var key = okey.value.trim();
        var val = oval.value.trim();
        if (!key || !val) {
            continue;
        }
        rec["records"][rkey][key] = val;
    }
    window.utilUpdateRecords(rec, 0, true, true);
    alert("SUCCESS: added '" + rkey + "'");
}
