window.addEventListener("load", function(evt) {
    helpResize();
});


function helpResize() {
    var obj = document.getElementById("helpObject");
    var voff = obj.offsetTop;
    var height = window.innerHeight - voff;
    obj.setAttribute("height", height);
}
