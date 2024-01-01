const backgroundTiles = new Image();
backgroundTiles.src = "Images/assets/tiles.png";
const tileWidth = 64, tileHeight = 48;
const tileNames = ['empty', 'grass', 'dirt', 'stone', 'paved road', 'paved road v2'];

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

const brushSizeSlider = document.getElementById("size-slider");
brushSizeSlider.addEventListener("change", updateBrushSize);
brushSize = brushSizeSlider.value;

function updateBrushSize(event) {
    brushSize = brushSizeSlider.value;
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

view_x = mapWidth * tileWidth / 2;
view_y = mapHeight * tileHeight / 3;
tileSegmentWidth = Math.floor(tileWidth/2);
tileSegmentHeight = Math.floor(tileHeight/3);
tileCellHeight = tileSegmentHeight * 2;

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

// grandpa's function
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
    // splits the tiles into segments, one segment for each edge of the hexagon.
    // looks up the tile to use in the tileset image by using the value
    // of the current tile for x dimension in tileset, and the value
    // of the neighbor tile for y dimension
    for (let x = Math.floor(view_x / tileWidth) - 1; x < Math.floor(view_x + canvas.width) / tileWidth + 1; x++) {
        for (let y = Math.floor(view_y / tileCellHeight) - 1; y < Math.floor(view_y + canvas.height) / tileCellHeight + 1; y++) {
            if (x < 1) continue; if (x > mapWidth  - 2) continue;
            if (y < 1) continue; if (y > mapHeight - 2) continue;

            // top left segment
            tile_x = map[x][y] * tileWidth;
            tile_y = map[x - 1 + (y % 2)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y, tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y % 2) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y),
                32, 16
            );

            // top right
            tile_y = map[x + (y % 2)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + tileCellHeight + (y % 2) * tileCellHeight),
                Math.round(y * tileSegmentWidth - view_y),
                tileSegmentWidth, tileSegmentHeight
            );

            // mid left
            tile_y = map[x - 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + tileSegmentHeight,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y % 2) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileSegmentHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // mid right
            tile_y = map[x + 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y + tileSegmentHeight,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y % 2) * tileSegmentWidth + tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileSegmentHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // bottom left
            tile_y = map[x - 1 + (y % 2)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + tileSegmentWidth,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y % 2) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileCellHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // bottom right
            tile_y = map[x + (y % 2)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y + tileSegmentWidth,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y % 2) * tileSegmentWidth + tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileCellHeight),
                tileSegmentWidth, tileSegmentHeight
            );
        }
    }

    // draws the... "cursor"? i guess you'd call it?
    octx.lineWidth = 1;
    octx.strokeStyle = "red";
    octx.fillStyle = "rgba(255,0,0,0.1)";
    if (brushSize == 1) {
        let highlightPath = new Path2D();
        let x = highlightedTile[0], y = highlightedTile[1];
        highlightPath.moveTo(x * tileWidth + tileSegmentWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight + tileSegmentHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight + tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileSegmentWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight + tileHeight - view_y);
        highlightPath.lineTo(x * tileWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight + tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth - view_x + (tileCellHeight * (y % 2)),
            y * tileCellHeight + tileSegmentHeight - view_y);
        highlightPath.closePath();
        octx.stroke(highlightPath);
        octx.fill(highlightPath);
    } else {
        octx.beginPath();
        octx.ellipse(mouse_x, mouse_y, brushSize / 20 * tileWidth, brushSize / 20 * tileWidth, 0, 0, Math.PI * 2);
        octx.stroke();
        octx.fill();
    }

    // finally, draw it all to the actual screen
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
    // the wheel event was originally for scaling the view, but it
    // doesn't work the way i expected and i can't be assed fixing
    // it for the moment
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
    //canvas.removeEventListener("wheel", mouseWheel);
    canvas.removeEventListener("mousedown", mouseDown);
    canvas.removeEventListener("mouseup", mouseUp);
    canvas.removeEventListener("mouseleave", mouseLeave);
    canvas.addEventListener("mouseenter", mouseEnter);
}

// remind me to give this function a reasonable name at some point
function mapLinePixelsToTileGrid(x1, y1, x2, y2) {

    // this function is """heavily inspired""" by Michael Abrash's C implementation
    // of Bresenham's line-drawing algorithm from his book:
    //  Michael Abrash's Graphics Programming Black Book
    // I can't recommend the book enough, you can download and read it for free at
    // https://github.com/jagregory/abrash-black-book

    if ((x1 == x2) && (y1 == y2)) { // line is actually a point
        if (brushSize == 1) {
            //           (     y     ) / 32;
            let tile_y = (view_y + y1) >> 5;
            //           ((       x      ) - ( odd tile offset )) / 64;
            let tile_x = (view_x + x1 - (32 * (tile_y & 1))) >> 6;
            map[tile_x][tile_y] = brushTile;
        } else {
            paintTiles(x1, y1);
        }
        updateDisplay = true;
        return;
    }
    

    // find out what kind of line we're making
    let begin_x, end_x, begin_y, end_y, lineMode, xDirection, deltaX, deltaY;

    if (y1 == y2) {
        lineMode = 1; // line is horizontal
        begin_x = Math.min(x1, x2);
        end_x = Math.max(x1, x2);
        begin_y = y1;
        end_y = y1;
    } else if (x1 == x2) {
        lineMode = 0; // line is vertical
        begin_x = x1;
        end_x = x1;
        begin_y = Math.min(y1, y2);
        end_y = Math.max(y1, y2);
    } else {
        if (y1 > y2) {
            begin_y = y2;
            end_y = y1;
            begin_x = x2;
            end_x = x1;
        } else {
            begin_y = y1;
            end_y = y2;
            begin_x = x1;
            end_x = x2;
        }
        deltaX = end_x - begin_x;
        deltaY = end_y - begin_y;
        if (Math.abs(deltaX) == Math.abs(deltaY)) {
            lineMode = 2; // line is diagonal
        } else {
            xDirection = 1;
            if (deltaX > 0) {
                if (deltaX > deltaY) {
                    lineMode = 3;
                } else {
                    lineMode = 4;
                }
            } else {
                deltaX = -deltaX;
                xDirection = -1;
                if (deltaX > deltaY) {
                    lineMode = 3;
                } else {
                    lineMode = 4;
                }
            }
        }
    }
    
    // This is how I convert from pixel space to the map's tile space
    // I should stick this somewhere more obvious...;.
    //           (       y        ) / 32;
    let tile_y = (view_y + begin_y) >> 5;
    //           ((      x       ) - ( odd tile offset )) / 64;
    let tile_x = (view_x + begin_x - (32 * (tile_y & 1))) >> 6;

    let x = begin_x;
    let y = begin_y;
    let errorTerm;

    switch (lineMode) {
        case 0: // vertical
            map[tile_x][tile_y] = brushTile;
            while (y < end_y) {
                if (brushSize == 1) {
                    tile_y = (view_y + y) >> 5;
                    map[tile_x][tile_y] = brushTile;
                } else {
                    paintTiles(x, y);
                }
                y += tileCellHeight;
            }
            break;

        case 1: // horizontal
            map[tile_x][tile_y] = brushTile;
            while (x < end_x) {
                if (brushSize == 1) {
                    tile_x = (view_x + x - (32 * (tile_y & 1))) >> 6;
                    map[tile_x][tile_y] = brushTile;
                } else {
                    paintTiles(x, y);
                }
                x += tileWidth;
            }
            break;
        case 2: // diagonal
            // I have a feeling this case is bugged, but it happens
            // so rarely it's hard to figure out how...
            x = Math.min(x1, x2);
            end_x = Math.max(x1, x2);
            y = Math.min(y1, y2);
            end_y = Math.max(y1, y2);
            map[tile_x][tile_y] = brushTile;
            while (x < end_x) {
                if (brushSize == 1) {
                    tile_y = (view_y + y) >> 5;
                    tile_x = (view_x + x - (32 * (tile_y & 1))) >> 6;
                    map[tile_x][tile_y] = brushTile;
                } else {
                    paintTiles(x, y);
                }
                x += 16;
                y += 16;
            }
            break;

        // why am i doing this? idk...

        case 3: // deltax > deltay
            let deltaYx2 = deltaY * 2;
            let deltaYx2MinusDeltaXx2 = deltaY - (deltaX * 2);
            errorTerm = deltaYx2 - deltaX;
            map[tile_x][tile_y] = brushTile;
            while (deltaX--) {
                if (errorTerm >= 0) {
                    y++;
                    errorTerm += deltaYx2MinusDeltaXx2;
                } else {
                    errorTerm += deltaYx2;
                }
                x += xDirection;
                if (brushSize == 1) {
                    tile_y = (view_y + y) >> 5;
                    tile_x = (view_x + x - (32 * (tile_y & 1))) >> 6;
                    map[tile_x][tile_y] = brushTile;
                } else {
                    paintTiles(x, y);
                }
            }
            break;

        // this is like replacing the milk in ur cereal with
        // water and then eating a couple pizzas for dinner...

        case 4: // deltax < deltay
            let deltaXx2 = deltaX * 2;
            let deltaXx2MinusDeltaYx2 = deltaXx2 - (deltaY * 2);
            errorTerm = deltaXx2 - deltaY;
            map[tile_x][tile_y] = brushTile;
            while (deltaY--) {
                if (errorTerm >= 0) {
                    x += xDirection;
                    errorTerm += deltaXx2MinusDeltaYx2;
                } else {
                    errorTerm += deltaXx2;
                }
                y++;
                if (brushSize == 1) {
                    tile_y = (view_y + y) >> 5;
                    tile_x = (view_x + x - (32 * (tile_y & 1))) >> 6;
                    map[tile_x][tile_y] = brushTile;
                } else {
                    paintTiles(x, y);
                }
            }
            break;

    }
    updateDisplay = true;
    return;
}
function mouseMove(event) {
    event.preventDefault();
    mouse_x = event.offsetX;
    mouse_y = event.offsetY;
    // pan view when middle mouse is pressed
    if ((event.buttons & 4) == 4) {
        view_x -= mouse_x - prevMouse_x;
        view_y -= mouse_y - prevMouse_y;
        updateDisplay = true;
    }
    // calculate which tile the mouse is over
    // this would be nice if it were pixel perfect with respect to the
    //  hexagonal tiles.but it works well enough for the moment
    // also needs to be moved to its own dedicated function
    mouseTile_y = Math.floor((view_y + mouse_y) / (tileCellHeight));
    if (mouseTile_y % 2) {
        mouseTile_x = Math.floor((view_x + mouse_x - tileWidth / 2) / tileWidth);
    } else {
        mouseTile_x = Math.floor((view_x + mouse_x) / tileWidth);
    }
    if ([mouseTile_x, mouseTile_y] != highlightedTile) {
        highlightedTile = [mouseTile_x, mouseTile_y];
        highlightedTileDisplay.innerHTML = `x: ${highlightedTile[0]}<br /> y: ${highlightedTile[1]}<br />value: ${tileNames[map[highlightedTile[0]][highlightedTile[1]]]} (${map[highlightedTile[0]][highlightedTile[1]]})`;
        updateDisplay = true;
    }

    if ((event.buttons & 1) == 1) { // is mouse button pressed?
        mapLinePixelsToTileGrid(prevMouse_x, prevMouse_y, mouse_x, mouse_y);
    }
    prevMouse_x = mouse_x;
    prevMouse_y = mouse_y;
}

function paintTiles(mouse_x,mouse_y) {
    let radius = brushSize * tileWidth / 20;
    let center_x = view_x + mouse_x;
    let center_y = view_y + mouse_y;
    let y = center_y - (radius * tileCellHeight);
    // pythagoras sh*t x squared + y squared = radius squred
    // so x = the square root of radius squared - y squared
    //
    let end_y = center_y + radius * tileCellHeight;
    while (y < end_y) {
        let x = center_x - Math.sqrt((radius * radius) - ((center_y - y) * (center_y - y)));
        let end_x = center_x + Math.sqrt((radius * radius) - ((center_y - y) * (center_y - y)));
        while (x < end_x) {
            x += 64;
            let my = y >> 5;
            let mx = (x >> 6) - (my & 1);
            map[mx][my] = brushTile;
        }
        y+=32;
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
    mouseMove(event);
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
    if (view_x > mapWidth * tileWidth - canvas.width) {
        view_x = mapWidth * tileWidth - canvas.width;
    }
    if (view_y > mapHeight * (tileCellHeight) - canvas.height + (tileSegmentHeight)) {
        view_y = mapHeight * (tileCellHeight) - canvas.height + (tileSegmentHeight);
    }
}

function update() {
    handleKeyboard();
    boundView();
    draw();
}

window.addEventListener("load", onImageLoad);
