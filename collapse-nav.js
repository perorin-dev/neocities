btn = document.getElementById("toggle-visibility");
nav = document.getElementById("nav-section");
btn.addEventListener("click",toggleNav);
function toggleNav() {
    if (nav.style.display == 'none') {
        nav.style.display = 'block';
        btn.innerHTML = '◀';
    } else {
        nav.style.display = 'none';
        btn.innerHTML = '▶';
    }
}