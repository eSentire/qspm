/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
window.addEventListener("load", function(_evt) {
    helpResize();
});

function helpResize() {
    var obj = document.getElementById("helpObject");
    var voff = obj.offsetTop;
    var height = window.innerHeight - voff;
    obj.setAttribute("height", height);
}
