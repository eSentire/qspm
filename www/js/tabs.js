// citation: https://www.w3schools.com/howto/howto_js_tabs.asp
/*eslint no-unused-vars: ["warn", { "argsIgnorePattern": "openTab" }]*/
function openTab(event, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";

    // Call the associated logic.
    if (tabName == "Records") {
        window.doRecords();
    }
    if (tabName == "Add") {
        window.doAdd();
    }
    if (tabName == "Edit") {
        window.doEdit();
    }
}
