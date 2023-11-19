const backgroundTiles = new Image();
backgroundTiles.src = "Images/assets/tiles.png";
const tileWidth = 64, tileHeight = 48;
const tileNames = ['empty', 'grass', 'dirt', 'stone', 'paved road'];

const tileSelectionDropdown = document.getElementById("tile-selection-dropdown");
tileSelectionDropdown.innerHTML = `<option selected>${tileNames[1]}</option>`;
for (let i = 2; i < tileNames.length; i++) {
    tileSelectionDropdown.innerHTML += `<option>${tileNames[i]}</option>`;
}
tileSelectionDropdown.addEventListener("change", updateTileSelection);

const tileSelectionDisplay = document.getElementById("tile-selection-display");
tileSelectionDisplay.width = tileWidth;
tileSelectionDisplay.height = tileHeight;
tileSelectionDisplayContext = tileSelectionDisplay.getContext('2d');
brushTile = 1;

function updateTileSelection(event) {
    brushTile = tileSelectionDropdown.selectedIndex + 1;
    tileSelectionDisplayContext.clearRect(0, 0, tileWidth, tileHeight);
    tileSelectionDisplayContext.drawImage(
        backgroundTiles,
        brushTile * tileWidth, 0,
        tileWidth, tileHeight,
        0, 0,
        tileWidth, tileHeight
    );
}

mapWidth = 80;
mapHeight = 80;
map = [];
for (let x = 0; x < mapWidth; x++) {
    map.push([]);
    for (let y = 0; y < mapHeight; y++) {
        // fill the map with noise.
        map[x].push(Math.round(0.5 + noise(x / 8, y / 8) * 3));
    }
}

// set the view to the middle of the map by default

view_x = mapWidth << 5;
view_y = mapHeight << 4;

// setup canvas and view
const canvas = document.getElementById("display");
//scale = 1;
highlightedTile = [0, 0];
highlightedTileDisplay = document.getElementById("highlighted-tile-display");
viewSpeed = 5;
const ctx = canvas.getContext("2d");
const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
const octx = offscreenCanvas.getContext('2d');
octx.imageSmoothingEnabled = false;
// prevent the map from being too small
if (mapWidth < canvas.width / tileWidth) {
    mapWidth = Math.round(canvas.width / tileWidth);
}
if (mapHeight < canvas.height / tileHeight) {
    mapHeight = Math.round(canvas.height / tileHeight);
}
pressedKeys = {};
updateDisplay = false;

function onImageLoad() {
    updateTileSelection(null);
    canvas.addEventListener("onresize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", findFocus);
    canvas.addEventListener("mouseenter", mouseEnter);
    resizeCanvas();
    setInterval(update, 1000 / 60);
}
function resizeCanvas() {
    const style = getComputedStyle(canvas);
    canvas.width = 300; canvas.height = 150;
    let w = parseInt(style.getPropertyValue("width"), 10);
    let h = parseInt(style.getPropertyValue("height"), 10);
    canvas.width = w;
    canvas.height = h;
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    updateDisplay = true;
}

function draw() {
    if (offscreenCanvas.width != canvas.width) {
        offscreenCanvas.width = canvas.width;
    }
    if (offscreenCanvas.height != canvas.height) {
        offscreenCanvas.height = canvas.height;
    }
    octx.clearRect(0, 0, canvas.width, canvas.height);

    let tile_x, tile_y;
    for (let x = Math.floor(view_x / tileWidth) - 1; x < Math.floor(view_x + canvas.width) / tileWidth + 1; x++) {
        for (let y = Math.floor(view_y / 32) - 1; y < Math.floor(view_y + canvas.height) / 32 + 1; y++) {
            if (x < 1) continue; if (x > mapWidth  - 2) continue;
            if (y < 1) continue; if (y > mapHeight - 2) continue;

            // top left
            tile_x = map[x][y] * tileWidth;
            tile_y = map[x - 1 + (y % 2)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y, 32, 16,
                Math.round(x * tileWidth - view_x + (y % 2) * 32),
                Math.round(y * 32 - view_y),
                32, 16
            );

            // top right
            tile_y = map[x + (y % 2)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + 32, tile_y, 32, 16,
                Math.round(x * tileWidth - view_x + 32 + (y % 2) * 32),
                Math.round(y * 32 - view_y),
                32,16
            );

            // mid left
            tile_y = map[x - 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + 16, 32, 16,
                Math.round(x * tileWidth - view_x + (y % 2) * 32),
                Math.round(y * 32 - view_y + 16),
                32, 16
            );

            // mid right
            tile_y = map[x + 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x+32, tile_y + 16, 32, 16,
                Math.round(x * tileWidth - view_x + (y % 2) * 32 + 32),
                Math.round(y * 32 - view_y + 16),
                32, 16
            );

            // bottom left
            tile_y = map[x - 1 + (y % 2)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + 32, 32, 16,
                Math.round(x * tileWidth - view_x + (y % 2) * 32),
                Math.round(y * 32 - view_y + 32),
                32, 16
            );

            // bottom right
            tile_y = map[x + (y % 2)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + 32, tile_y + 32, 32, 16,
                Math.round(x * tileWidth - view_x + (y % 2) * 32 + 32),
                Math.round(y * 32 - view_y + 32),
                32, 16
            );
        }
    }
    let highlightPath = new Path2D();
    octx.lineWidth = 1;
    octx.strokeStyle = "red";
    octx.fillStyle = "rgba(255,0,0,0.1)";
    let x = highlightedTile[0], y = highlightedTile[1];
    highlightPath.moveTo(x * tileWidth + tileWidth / 2 - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 - view_y);
    highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 + tileHeight / 3 - view_y);
    highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 + tileHeight / 3 * 2 - view_y);
    highlightPath.lineTo(x * tileWidth + tileWidth / 2 - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 + tileHeight - view_y);
    highlightPath.lineTo(x * tileWidth - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 + tileHeight / 3 * 2 - view_y);
    highlightPath.lineTo(x * tileWidth - view_x + (32 * (y % 2)),
        y * tileHeight / 3 * 2 + tileHeight / 3 - view_y);
    highlightPath.closePath();
    octx.stroke(highlightPath);
    octx.fill(highlightPath);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);
}

function findFocus(event) {
    canvas.removeEventListener("mousemove", findFocus);
    mouseEnter(event);
}
function mouseEnter(event) {
    prevMouse_x = event.offsetX; mouse_x = event.offsetX;
    prevMouse_y = event.offsetY; mouse_y = event.offsetY;
    canvas.addEventListener("mousemove", mouseMove);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("keydown", keyDown);
    //canvas.addEventListener("wheel", mouseWheel);
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mouseleave", mouseLeave);
    canvas.removeEventListener("mouseenter", mouseEnter);
    updateDisplay = true;
}

function mouseLeave() {
    canvas.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("keydown", keyDown);
    //canvas.removeEventListener("wheel", wheel);
    canvas.removeEventListener("mousedown", mouseDown);
    canvas.removeEventListener("mouseup", mouseUp);
    canvas.removeEventListener("mouseleave", mouseLeave);
    canvas.addEventListener("mouseenter", mouseEnter);
}

function mouseMove(event) {
    event.preventDefault();
    prevMouse_x = mouse_x;
    prevMouse_y = mouse_y;
    mouse_x = event.offsetX;
    mouse_y = event.offsetY;
    // pan view when middle mouse is pressed
    if ((event.buttons & 4) == 4) {
        view_x -= mouse_x - prevMouse_x;
        view_y -= mouse_y - prevMouse_y;
        if (view_x < 0) view_x = 0;
        if (view_y < 0) view_y = 0;
        if (view_x + canvas.width > mapWidth * tileWidth) view_x = mapWidth * tileWidth - canvas.width + tileWidth;
        if (view_y + canvas.height > mapHeight * 64 + 64) view_y = mapHeight * 64 - canvas.height + 64;
        updateDisplay = true;
    }
    // calculate which tile the mouse is over
    mouseTile_y = Math.floor((view_y + mouse_y) / (tileHeight / 3 * 2));
    if (mouseTile_y % 2) {
        mouseTile_x = Math.floor((view_x + mouse_x - 32) / tileWidth);
    } else {
        mouseTile_x = Math.floor((view_x + mouse_x) / tileWidth);
    }
    if ([mouseTile_x, mouseTile_y] != highlightedTile) {
        highlightedTile = [mouseTile_x, mouseTile_y];
        highlightedTileDisplay.innerHTML = `x: ${highlightedTile[0]}<br /> y: ${highlightedTile[1]}<br />value: ${tileNames[map[highlightedTile[0]][highlightedTile[1]]]} (${map[highlightedTile[0]][highlightedTile[1]]})`;
        updateDisplay = true;
    }
    if ((event.buttons & 1) == 1) {
        map[highlightedTile[0]][highlightedTile[1]] = brushTile;
        updateDisplay = true;
    }
}

/*
function mouseWheel(event) {

}
*/

function keyDown(event) {
    event.preventDefault();
    pressedKeys[event.key] = true;
}

function keyUp(event) {
    event.preventDefault();
    pressedKeys[event.key] = false;
}

function mouseDown(event) {
    event.preventDefault();
    if ((event.buttons & 1) == 1) {
        map[highlightedTile[0]][highlightedTile[1]] = brushTile;
        updateDisplay = true;
    }
}

function mouseUp(event) {
    event.preventDefault();
}

/* TO BE IMPLEMENTED
* 
* function importMap() {
* 
* }
* 
* function exportMap() {
* 
* }
* 
*/

function handleKeyboard() {
    if (pressedKeys['w']) {
        view_y -= viewSpeed;
        updateDisplay = true;
    }
    if (pressedKeys['a']) {
        view_x -= viewSpeed;
        updateDisplay = true;
    }
    if (pressedKeys['s']) {
        view_y += viewSpeed;
        updateDisplay = true;
    }
    if (pressedKeys['d']) {
        view_x += viewSpeed;
        updateDisplay = true;
    }
}

function boundView() {
    if (view_x < 0) view_x = 0;
    if (view_y < 0) view_y = 0;
    if (view_x > mapWidth * 64 - canvas.width) {
        view_x = mapWidth * 64 - canvas.width;
    }
    if (view_y > mapHeight * 32 - canvas.height + 16) {
        view_y = mapHeight * 32 - canvas.height + 16;
    }
}

function update() {
    handleKeyboard();
    boundView();
    draw();
}

window.addEventListener("load", onImageLoad);
