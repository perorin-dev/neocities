const body = document.body;
const hrbg = new Image();
hrbg.src = "walls/c40e8490-1080p-16colors.png";
hrbg.onload = function () {
    body.style.backgroundImage = `url(${hrbg.src})`;
}
