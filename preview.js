function on_load() {
    c = document.getElementById("post-canvas");
    c.width = 180; c.height = 180;
    ctx = c.getContext("2d");
    o = document.createElement("canvas");
    o.width = c.width; o.height = c.height;
    octx = o.getContext("2d", willReadFrequently=true);
    bg = new Image(c.width, c.height);
    bg.src = "Images/waves-background.jpg";
    ctx.drawImage(bg, 0, 0);
    octx.drawImage(bg, 0, 0);
    originalImageData = octx.getImageData(0, 0, c.width, c.height);
    t = 0;
    requestAnimationFrame(draw);
}

function draw() {
    t += 1;
    const newImageData = new ImageData(c.width, c.height);
    for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
            let offset_xg = Math.round(x - 8 + noise(x / 11, y / 11, t/100 ) * 16);
            let offset_xb = Math.round(x - 8 + noise((x+c.height*c.width) / 11, y / 11, t/100 ) * 16);
            offset_xg %= c.width - 1;
            offset_xb %= c.width - 1;
            let offsetIndexg= (y * c.width * 4) + (offset_xg * 4);
            let offsetIndexb = (y * c.width * 4) + (offset_xb * 4);
            let index = (y * c.width * 4) + (x * 4);
            newImageData.data[index] = originalImageData.data[index];
            newImageData.data[index + 1] = originalImageData.data[offsetIndexg + 1];
            newImageData.data[index + 2] = originalImageData.data[offsetIndexb + 2];
            newImageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(newImageData, 0, 0);
    requestAnimationFrame(draw);
}

window.addEventListener("load", on_load);