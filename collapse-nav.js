btn = document.getElementById("toggle-visibility");
nav = document.getElementById("nav-section");
ctn = document.getElementById("nav-container");
btn.addEventListener("click",toggleNav);
function toggleNav() {
    if (nav.style.display == 'none') {
        nav.style.display = 'block';
        ctn.style.width = "25%!important;";
        btn.innerHTML = '▲ collapse';
        resizeCanvas();
    } else {
        nav.style.display = 'none';
        ctn.style.width = "unset";
        btn.innerHTML = '▼';
        resizeCanvas();
    }
}