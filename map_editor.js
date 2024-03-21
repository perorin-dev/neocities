const FPS = 1000 / 60;
const NEIGHBORS = [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];
const TWOPI = Math.PI * 2;

// load images, need to find a more general way to do this
// for when I have more than just the single tileset
const backgroundTiles = new Image();
backgroundTiles.src = "Images/assets/tiles.png";
const tileWidth = 64, tileHeight = 48;
const tileNames = ['empty', 'grass', 'dirt', 'stone', 'paved road', 'paved road v2'];

// map sidebar html stuff
const mapNewButton    = document.getElementById("map-new-button");
const mapImportButton = document.getElementById("map-import-button");
const mapExportButton = document.getElementById("map-export-button");
const mapWidthInput   = document.getElementById("map-width-input");
const mapHeightInput  = document.getElementById("map-height-input");
const mapResizeButton = document.getElementById("map-set-size-button");
mapNewButton.addEventListener("click", mapNew);
mapImportButton.addEventListener("change", function (event) { mapImport(event) });
mapExportButton.addEventListener("click", mapExport);
mapResizeButton.addEventListener("click", mapResize);
// end map sidebar html stuff


// Paint tab html stuff
const tileSelectionDropdown = document.getElementById("tile-selection-dropdown");
tileSelectionDropdown.innerHTML = `<option selected>${tileNames[1]}</option>\n`;
for (let i = 2; i < tileNames.length; i++) {
    tileSelectionDropdown.innerHTML += `<option>${tileNames[i]}</option>\n`;
}

const tileSelectionDisplay = document.getElementById("tile-selection-display");
tileSelectionDisplay.width = tileWidth;
tileSelectionDisplay.height = tileHeight;
const tileSelectionDisplayContext = tileSelectionDisplay.getContext('2d');
let brushTile = 1;

const toolSelectionDropdown = document.getElementById("tool-selection-dropdown");
const toolNames = ['brush', 'fill'];
for (let i = 0; i < toolNames.length; i++) {
    toolSelectionDropdown.innerHTML += `<option>${toolNames[i]}</option>\n`;
}
const highlightedTileDisplay = document.getElementById("highlighted-tile-display");
const brushSizeSlider = document.getElementById("size-slider");

// end paint tab html stuff

// entity tool html stuff
const entitySelection = document.getElementById("entity-list");
const entityNewButton = document.getElementById("entity-new-button");
const entityDeleteButton = document.getElementById("entity-delete-button");
const entityComponentsSelection = document.getElementById("entity-components-list");
const entityComponentAddButton = document.getElementById("entity-component-add-button");
const entityComponentEditButton = document.getElementById("entity-component-edit-button");
const entityComponentRemoveButton = document.getElementById("entity-component-remove-button");
const entityValueSelection = document.getElementById("entity-values-list");
const entityValueAddButton = document.getElementById("entity-value-add-button");
const entityValueEditButton = document.getElementById("entity-value-edit-button");
const entityValueRemoveButton = document.getElementById("entity-value-remove-button");

entityValueRemoveButton.addEventListener("click", entityValueRemove);
function entityValueRemove() {
    let selectedComponent = getSelectedComponent();
    if (selectedComponent != null) {
        delete selectedComponent.values[getSelectedKey()];
        updateDisplay = true;
        entityValueSelectionUpdate();
    }
}

entityValueEditButton.addEventListener("click", entityValueEdit);
function entityValueEdit() {
    let newValue = window.prompt();
    let selectedComponent = getSelectedComponent();
    selectedComponent.values[getSelectedKey()] = newValue;
    updateDisplay = true;
    entityValueSelectionUpdate();
}
entityValueAddButton.addEventListener("click", entityValueAdd);
function entityValueAdd() {
    let valueName = window.prompt("New value name?");
    if (valueName == "") {
        console.log('empty value name\n');
        return;
    }
    let valueValue = window.prompt("New value value?"); //heh
    if (valueValue == "") {
        console.log('empty value value\n')
        return;
    }
    let selectedComponent = getSelectedComponent();
    if (contains(Object.keys(selectedComponent.values), valueName)) {
        console.log(`${selectedComponent.name} already contains ${valueName}\n`);
    } else {
        selectedComponent.values[valueName] = valueValue;
        updateDisplay = true;
        entityValueSelectionUpdate();
    }
}
function entityValueSelectionUpdate() {
    let selectedComponent = getSelectedComponent();
    entityValueSelection.innerHTML = "";
    if (selectedComponent == null) return;
    for (let i = 0; i < Object.keys(selectedComponent.values).length; i++) {
        entityValueSelection.innerHTML += `<option>${Object.keys(selectedComponent.values)[i]} | ${selectedComponent.values[Object.keys(selectedComponent.values)[i]]}\n`;
    }
}
entityComponentEditButton.addEventListener("click", entityComponentEdit);
function entityComponentEdit() {
    let selectedComponent = getSelectedComponent();
    let selectedEntity = getSelectedEntity();
    if (selectedComponent == null) return;
    let newName = window.prompt("New component name?");
    if (newName != "" ) {
        let oldName = selectedComponent.name;
        if ( selectedEntity.hasComponent(newName)) {
            console.log(`${selectedEntity.name} already has component ${newName}`);
            return;
        }
        selectedComponent.name = newName;
        selectedEntity.components[newName] = selectedComponent;
        delete selectedEntity.components[oldName];
        for (let i = 0; i < entityComponentsSelection.length; i++) {
            if (entityComponentsSelection.options[i].text == newName) {
                entityComponentsSelection.options[i].selectedIndex = true;
                break;
            }
        }
        updateDisplay = true;
        entityComponentsSelectionUpdate();
    }
}

function getSelectedEntity() {
    if (entitySelection.selectedIndex >= 0) {
        return entitys[entitySelection.selectedIndex];
    } else {
        return null;
    }
}
function getSelectedComponent() {
    let selectedEntity = getSelectedEntity();
    if (selectedEntity != null && entityComponentsSelection.selectedIndex >= 0) {
        return selectedEntity.components[entityComponentsSelection.options[entityComponentsSelection.selectedIndex].text];
    } else {
        return null;
    }
}
function getSelectedKey() {
    let selectedComponent = getSelectedComponent();
    if (selectedComponent != null && entityValueSelection.selectedIndex >= 0) {
        return Object.keys(selectedComponent.values)[entityValueSelection.selectedIndex];
    } else {
        return null;
    }
}
function getSelectedValue() {
    let selectedComponent = getSelectedComponent();
    let selectedKey = getSelectedKey();
    if (selectedComponent != null && selectedKey != null) {
        return selectedComponent.values[selectedKey];
    } else {
        return null;
    }
}
entityComponentRemoveButton.addEventListener("click", entityComponentRemove);
function entityComponentRemove() {
    let selectedComponent = getSelectedComponent();
    if (selectedComponent != null) {
        let tmpSelectedIndex = entityComponentsSelection.selectedIndex;
        let selectedEntity = getSelectedEntity();
        delete selectedEntity[selectedComponent.name];
        delete selectedComponent;
        entityComponentsSelectionUpdate();
        entityComponentsSelection.selectedIndex = tmpSelectedIndex;
        updateDisplay = true;
    }
}

entityNewButton.addEventListener("click", entityNew);
function entityNew() {
    let name = window.prompt("entity name?");
    if (name != "") {
        let newEntity = new Entity(name);
        entitys.push(newEntity);
        entitySelectionUpdate();
        entitySelection.selectedIndex = entitySelection.length - 1;
    }
}
entitySelection.addEventListener("change", entityComponentsSelectionUpdate);
entityComponentsSelection.addEventListener("change", entityValueSelectionUpdate);
function entityComponentsSelectionUpdate() {
    entityComponentsSelection.innerHTML = "";
    if (entitySelection.selectedIndex < 0) {
        entityValueSelectionUpdate();
        return;
    }
    let selectedEntity = getSelectedEntity();
    for (const property in selectedEntity.components) {
        entityComponentsSelection.innerHTML += `<option>${property}</option>\n`;
    }
    entityValueSelectionUpdate();
}
entityDeleteButton.addEventListener("click", entityDelete);
function entityDelete() {
    let selectedEntity = getSelectedEntity();
    if ( window.confirm(`Are you sure you want to delete ${selectedEntity.name}?`) ) {
        entitys.splice(entitySelection.selectedIndex, 1);
        entitySelectionUpdate();
        updateDisplay = true;
    }
}
entityComponentAddButton.addEventListener("click", entityComponentAdd);
function entityComponentAdd() {
    let selectedEntity = getSelectedEntity();
    if (selectedEntity == null) return;
    let name = window.prompt("component name?");
    if ( name != "" && !selectedEntity.hasComponent(name)) {
        let newComponent = new Component(name);
        selectedEntity.components[name] = newComponent;
        entityComponentsSelectionUpdate();
        for (let i = 0; i < Object.keys(selectedEntity.components).length; i++) {
            if (Object.keys(selectedEntity.components)[i] == name) {
                entityComponentsSelection.selectedIndex = i;
                break;
            }
        }
    }
}
function entitySelectionUpdate() {
    // add new entitys to the html select
    entitySelection.innerHTML = "";
    for (let i = 0; i < entitys.length; i++) {
        entitySelection.innerHTML += `<option>${entitys[i].name}</option>\n`;
    }
    entityComponentsSelectionUpdate();
}
class Entity {
    constructor(name) {
        this.name = name;
        this.components = {};
    }
    addComponent(name) {
        let newComponent = new Component(name);
        this.components[name] = newComponent;
    }
    hasComponent(name) {
        return Object.hasOwn(this.components,name);
    }
}
class Component {
    constructor(name) {
        this.name = name;
        this.values = {};
    }
}
// end entity tool html stuff

// sidebar tabs switching

class sidebarTab {
    constructor(name, toolElements, enabled=false) {
        this.name = name;
        this.buttonElement = document.getElementById(name);
        this.toolElements = toolElements;
        this.enabled = enabled;
    }
}
const sidebarTabs = [
    new sidebarTab(
        "map-edit-tab",
        document.getElementsByClassName("map-tab")
    ),
    new sidebarTab(
        "paint-mode-tab",
        document.getElementsByClassName("paint-tab"),
        enabled = true
    ),
    new sidebarTab(
        "entity-mode-tab",
        document.getElementsByClassName("entity-tab")
    )
];

for (let i = 0; i < sidebarTabs.length; i++) {
    sidebarTabs[i].buttonElement.addEventListener(
        "click",
        function () { switchSidebarTab(i) }
    );
}
function switchSidebarTab(tabIndex) {
    // disable elements of previously selected tab, then enable
    // the elements of the tab that's been switched to
    // this may lead to issues down the road if I add any elements
    // to the sidebar that wouldn't use the "flex" display
    for (let i = 0; i < sidebarTabs.length; i++) {
        if (sidebarTabs[i].enabled) {
            sidebarTabs[i].enabled = false;
            for (let element = 0; element < sidebarTabs[i].toolElements.length; element++) {
                sidebarTabs[i].toolElements[element].style.display = "none";
            }
            for (let attr of sidebarTabs[i].buttonElement.attributes) {
                if (attr.name == "selected") {
                    attr.value = "false";
                }
            }
        }
    }
    sidebarTabs[tabIndex].enabled = true;
    for (let i = 0; i < sidebarTabs[tabIndex].toolElements.length; i++) {
        sidebarTabs[tabIndex].toolElements[i].style.display = "flex";
    }
    for (let attr of sidebarTabs[tabIndex].buttonElement.attributes) {
        if (attr.name == "selected") attr.value = "true";
    }
    resizeCanvas();
}


// setup map

let mapWidth = 80;
let mapHeight = 80;
let map = [];
let undoMap = [];
// map[x][y]
for (let x = 0; x < mapWidth; x++) {
    map.push([]);
    undoMap.push([]);
    for (let y = 0; y < mapHeight; y++) {
        // fill the map with noise.
        let n = Math.round(0.5 + noise(x / 8, y / 8) * 3);
        map[x].push(n);
        undoMap[x].push(n)
    }
}

// set the view to the middle of the map by default

let view_x = mapWidth * tileWidth / 2;
let view_y = mapHeight * tileHeight / 3;

// these calculations don't assume the actual dimensions
// of the tiles, however, the rest of the program
// does assume, making this pointless
const tileSegmentWidth = Math.floor(tileWidth/2);
const tileSegmentHeight = Math.floor(tileHeight / 3);

// Because the tiles are not square, the actual tile image's
// height is misleading. Remember, the actual dimensions
// once accounting for the way the tiles intersect end up
// being 64x32
const tileCellHeight = tileSegmentHeight * 2;

// setup canvas and view
const canvas = document.getElementById("display");
//scale = 1;
let highlightedTile = [0, 0];
const viewSpeed = 7;
const ctx = canvas.getContext("2d");
const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
const octx = offscreenCanvas.getContext('2d');
octx.imageSmoothingEnabled = false;
octx.textAlign = "right";
octx.font = "monospace 12px";

let cachedSprites = [];
let cachedSpritesFilenames = [];

// setup input 
let pressedKeys = {};
let mouse_x = 0, mouse_y = 0;
let updateDisplay = false;

let entitys = [];
let exampleEntity = new Entity("exampleEntity");
exampleEntity.components.position = new Component("position");
exampleEntity.components.position.values.x = 43*64;
exampleEntity.components.position.values.y = 43*32;
exampleEntity.components.depth = new Component("depth");
exampleEntity.components.depth.values.depth = 0;
exampleEntity.components.sprite = new Component("sprite");
exampleEntity.components.sprite.values.filename = "Images/assets/default-sprite.png";
exampleEntity.components.sprite.values.offset_x = -16;
exampleEntity.components.sprite.values.offset_y = -16;
exampleEntity.components.sprite.values.rotation = 0;
exampleEntity.components.sprite.values.scale_x = 1;
exampleEntity.components.sprite.values.scale_y = 1;
exampleEntity.components.sprite.values.alpha = 1;
entitys.push(exampleEntity);
entitySelectionUpdate();

function spriteToHTMLImage(filename) {
    let i = index(cachedSpritesFilenames);
    if (i < 0) {
        cachedSprites.push(new Image());
        cachedSprites[cachedSprites.length - 1].src = filename;
        cachedSpritesFilenames.push(filename);
        return cachedSprites[cachedSprites.length - 1];
    } else {
        return cachedSprites[i];
    }
}

function expandMapToCanvasSize() {
    // prevent the map from being too small
    if (mapWidth < canvas.width / tileWidth) {
        mapWidth = Math.round(canvas.width / tileWidth);
    }
    if (mapHeight < canvas.height / tileHeight) {
        mapHeight = Math.round(canvas.height / tileHeight);
    }
}
function onLoad() {
    tileSelectionDropdown.addEventListener("change", updateTileSelection);
    canvas.addEventListener("ynresize", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", findFocus);
    canvas.addEventListener("mouseenter", mouseEnter);
    updateTileSelection(null);
    expandMapToCanvasSize();
    switchSidebarTab(0);
    switchSidebarTab(2);
    switchSidebarTab(1);
    resizeCanvas();
    setInterval(update, FPS);
}

function hasEventListener(element, eventType, callback) {
    var events = element._events || (element._events = {});
    if (!events[eventType]) {
        return false;
    }
    return events[eventType].some(listener => listener === callback);
}
function index(array, item) {
    //return index if array contains item, -1 otherwise
    for (let i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return i;
        }
    }
    return -1;
}
function contains(array, item) {
    // return true if array contains item, false otherise
    for (let i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return true;
        }
    }
    return false;
}

function resizeCanvas() {
    // Weird bug exists that results in scaled images. not sure how
    // it works....
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
    if (!updateDisplay) return;
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
    //
    // performance could be improved by splitting up the tileset before looping through the map
    for (let x = Math.floor(view_x / tileWidth) - 1; x < Math.floor(view_x + canvas.width) / tileWidth + 1; x++) {
        for (let y = Math.floor(view_y / tileCellHeight) - 1; y < Math.floor(view_y + canvas.height) / tileCellHeight + 1; y++) {
            // i don't want to deal with any potential out of bounds indices so i'm just
            // throwing out all the edges
            if (x < 1) continue; if (x > mapWidth  - 2) continue;
            if (y < 1) continue; if (y > mapHeight - 2) continue;

            // top left segment
            tile_x = map[x][y] * tileWidth;
            tile_y = map[x - 1 + (y & 1)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y, tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y & 1) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y),
                32, 16
            );

            // top right
            tile_y = map[x + (y & 1)][y - 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + tileCellHeight + (y & 1) * tileCellHeight),
                Math.round(y * tileSegmentWidth - view_y),
                tileSegmentWidth, tileSegmentHeight
            );

            // mid left
            tile_y = map[x - 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + tileSegmentHeight,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y & 1) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileSegmentHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // mid right
            tile_y = map[x + 1][y] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y + tileSegmentHeight,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y & 1) * tileSegmentWidth + tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileSegmentHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // bottom left
            tile_y = map[x - 1 + (y & 1)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x, tile_y + tileSegmentWidth,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y & 1) * tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileCellHeight),
                tileSegmentWidth, tileSegmentHeight
            );

            // bottom right
            tile_y = map[x + (y & 1)][y + 1] * tileHeight;
            octx.drawImage(
                backgroundTiles, tile_x + tileSegmentWidth, tile_y + tileSegmentWidth,
                tileSegmentWidth, tileSegmentHeight,
                Math.round(x * tileWidth - view_x + (y & 1) * tileSegmentWidth + tileSegmentWidth),
                Math.round(y * tileCellHeight - view_y + tileCellHeight),
                tileSegmentWidth, tileSegmentHeight
            );
        }
    }

    drawPaintCursor();

    // draw entitys with sprites
    let drawData = [];
    for (let i = 0; i < entitys.length; i++) {
        let keys = Object.keys(entitys[i].components);
        if (contains(keys, "sprite")) {
            //                              0      1           2           3         4      5         6        7        8
            //                sprite filename, depth, x position, y position, selected, alpha, rotation, scale_x, scale_y
            let entityData = [             "",     0,          0,          0,        0,     1,        0,       1,       1];
            if (i == entitySelection.selectedIndex) entityData[4] = 1;
            entityData[0] = entitys[i].components.sprite.values.filename;
            entityData[5] = entitys[i].components.sprite.values.alpha;
            entityData[6] = entitys[i].components.sprite.values.rotation;
            entityData[7] = entitys[i].components.sprite.values.scale_x;
            entityData[8] = entitys[i].components.sprite.values.scale_y;
            if (contains(keys, "depth")) {
                entityData[1] = entitys[i].components.depth.values.depth;
            }
            if (contains(keys, "position")) {
                entityData[2] = entitys[i].components.position.values.x + entitys[i].components.sprite.values.offset_x;
                entityData[3] = entitys[i].components.position.values.y + entitys[i].components.sprite.values.offset_y;
            }
            drawData.push(entityData);
        }
    }
    if (drawData.length > 0) {
        // sort sprites by depth, ie higher depth sprites are drawn in front of lower depth
        drawData.sort(drawDataCompare);
        for (let i = 0; i < drawData.length; i++) {
            let image = spriteToHTMLImage(drawData[i][0]);
            let x = drawData[i][2]-view_x;
            let y = drawData[i][3]-view_y;
            let width = image.width * drawData[i][7];
            let height = image.height * drawData[i][8];
            if (drawData[i][4]) { 
                // highlight the selected entity
                octx.shadowColor = "white";
                octx.shadowBlur = 16;
                octx.drawImage(image, x, y, width, height);
                octx.shadowColor = null;
                octx.shadowBlur = null;
            } else {
                octx.drawImage(image, x, y, width, height);
            }
        }
    }
    // finally, draw it all to the actual screen
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);
    updateDisplay = false;

}
function drawDataCompare(a, b) {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
}

function drawPaintCursor() {
    if (!sidebarTabs[1].enabled) return;
    octx.lineWidth = 1;
    octx.strokeStyle = "white";
    octx.fillStyle = "rgba(255,255,255,0.1)";
    const brushSize = brushSizeSlider.value;
    if ((brushSize == 1) || (toolSelectionDropdown.selectedIndex == 1)) {
        let highlightPath = new Path2D();
        let x = highlightedTile[0], y = highlightedTile[1];
        highlightPath.moveTo(x * tileWidth + tileSegmentWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight + tileSegmentHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight + tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth + tileSegmentWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight + tileHeight - view_y);
        highlightPath.lineTo(x * tileWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight + tileCellHeight - view_y);
        highlightPath.lineTo(x * tileWidth - view_x + (tileCellHeight * (y & 1)),
            y * tileCellHeight + tileSegmentHeight - view_y);
        highlightPath.closePath();
        octx.stroke(highlightPath);
        octx.fill(highlightPath);
    } else {
        octx.beginPath();
        octx.ellipse(mouse_x, mouse_y, brushSize / 20 * tileWidth, brushSize / 20 * tileWidth, 0, 0, TWOPI);
        octx.stroke();
        octx.fill();
    }
    return;
}
function findFocus(event) {
    // this function's purpose is to capture focus when the page first
    // loads. Necessary because it would usually capture focus when the
    // cursor enters the canvas area. However, when the page first loads
    // the cursor may already be inside the canvas area.
    canvas.removeEventListener("mousemove", findFocus);
    mouseEnter(event);
}

function mouseEnter(event) {
    mouse_x = event.offsetX;
    mouse_y = event.offsetY;
    canvas.addEventListener("mousemove", mouseMove);
    if (!hasEventListener(window, 'keyup', keyUp)) {
        window.addEventListener("keyup", keyUp);
    }
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
    window.removeEventListener("keydown", keyDown);
    //canvas.removeEventListener("wheel", mouseWheel);
    canvas.removeEventListener("mousedown", mouseDown);
    canvas.removeEventListener("mouseup", mouseUp);
    canvas.removeEventListener("mouseleave", mouseLeave);
    canvas.addEventListener("mouseenter", mouseEnter);
}

// remind me to give this function a reasonable name at some point
// gotta rewrite
function mapLinePixelsToTileGrid(x1, y1, x2, y2) {

    // this function is """heavily inspired""" by Michael Abrash's C implementation
    // of Bresenham's line-drawing algorithm from his book:
    //  Michael Abrash's Graphics Programming Black Book
    // I can't recommend the book enough, you can download and read it for free at
    // https://github.com/jagregory/abrash-black-book

    const brushSize = brushSizeSlider.value;

    if ((x1 == x2) && (y1 == y2)) { // line is actually a point
        paintTiles(x1, y1, brushSize);
        return;
    }
    

    // find out what kind of line we're making
    let begin_x, end_x, begin_y, end_y, lineMode, xDirection, deltaX, deltaY;

    if (y1 == y2) {
        lineMode = 1; // line is horizontal
        if (x1 < x2) {
            begin_x = x1;
            end_x = x2;
        } else {
            begin_x = x2;
            end_x = x1;
        }
        begin_y = y1;
        end_y = y1;
    } else if (x1 == x2) {
        lineMode = 0; // line is vertical
        begin_x = x1;
        end_x = x1;
        if (y1 < y2) {
            begin_y = y1;
            end_y = y2;
        } else {
            begin_y = y2;
            end_y = y1;
        }
    } else if (Math.abs(x2 - x1) == Math.abs(y2 - y1)) { // line is square
        lineMode = 2;
        if (x1 < x2) {
            begin_x = x1;
            end_x = x2;
        } else {
            begin_x = x2;
            end_x = x1;
        }
        if (y1 < y2) {
            begin_y = y1;
            end_y = y2;
        } else {
            begin_y = y2;
            end_y = y1;
        }
    } else { // none of the above, use bresenham's algorithm
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
    
    let x = begin_x;
    let y = begin_y;
    let errorTerm;

    switch (lineMode) {
        case 0: // vertical
            while (y < end_y) {
                paintTiles(x, y, brushSize);
                y += tileCellHeight;
            }
            break;

        case 1: // horizontal
            while (x < end_x) {
                paintTiles(x, y, brushSize);
                x += tileWidth;
            }
            break;

        case 2: // diagonal, deltax == deltay
            while (x < end_x) {
                paintTiles(x, y, brushSize);
                x += 32;
                y += 32;
            }
            break;

        // why am i doing this? idk...

        case 3: // deltax > deltay
            // busted, doesn't fully reach end point in y dimension
            let deltaYx2 = deltaY * 2;
            let deltaYx2MinusDeltaXx2 = deltaY - (deltaX * 2);
            errorTerm = deltaYx2 - deltaX;
            paintTiles(x, y, brushSize);
            while (deltaX--) {
                if (errorTerm >= 0) {
                    y++;
                    errorTerm += deltaYx2MinusDeltaXx2;
                } else {
                    errorTerm += deltaYx2;
                }
                x += xDirection;
                paintTiles(x, y, brushSize);
            }
            break;

        // this is like replacing the milk in ur cereal with
        // water and then eating a couple pizzas for dinner...

        case 4: // deltax < deltay
            let deltaXx2 = deltaX * 2;
            let deltaXx2MinusDeltaYx2 = deltaXx2 - (deltaY * 2);
            errorTerm = deltaXx2 - deltaY;
            paintTiles(x, y, brushSize);
            while (deltaY--) {
                if (errorTerm >= 0) {
                    x += xDirection;
                    errorTerm += deltaXx2MinusDeltaYx2;
                } else {
                    errorTerm += deltaXx2;
                }
                y++;
                paintTiles(x, y, brushSize);
            }
            break;

    }
    updateDisplay = true;
    return;
}

function panView(px, py, cx, cy) {
    view_x -= cx - px;
    view_y -= cy - py;
    boundView();
    updateDisplay = true;
    return;
}

function highlightTile(x, y) {
    // calculate which tile the mouse is over
    // this would be nice if it were pixel perfect with respect to the
    //  hexagonal tiles.but it works well enough for the moment
    let mouseTile_y = (view_y + y) >> 5;
    let mouseTile_x = ((view_x + x - (32 * (mouseTile_y & 1))) >> 6);
    if ([mouseTile_x, mouseTile_y] != highlightedTile) {
        highlightedTile = [mouseTile_x, mouseTile_y];
        highlightedTileDisplay.innerHTML = `x: ${highlightedTile[0]}<br /> y: ${highlightedTile[1]}<br />value: ${tileNames[map[highlightedTile[0]][highlightedTile[1]]]} (${map[highlightedTile[0]][highlightedTile[1]]})`;
        updateDisplay = true;
    }
    return;
}

function mouseMove(event) {
    event.preventDefault();
    const prevMouse_x = mouse_x, prevMouse_y = mouse_y;

    mouse_x = event.offsetX;
    mouse_y = event.offsetY;


    if (sidebarTabs[1].enabled) {
        highlightTile(mouse_x, mouse_y);
        if ((event.buttons & 1) == 1) { // is mouse button pressed?
            switch (toolSelectionDropdown.selectedIndex) {
                case 0: // brush
                    mapLinePixelsToTileGrid(prevMouse_x, prevMouse_y, mouse_x, mouse_y);
                    break;
                case 1: // fill
                    let ty = (view_y + mouse_y) >> 5;
                    let tx = (view_x + mouse_x - (32 * (ty & 1))) >> 6;
                    let tile = map[tx][ty];
                    if (tile == brushTile) break;
                    paintFill(tx, ty, tile);
                    break;
            }
        }
    } else if (sidebarTabs[2].enabled && ((event.buttons & 1 ) == 1 )) {
        let selectedEntity = getSelectedEntity();
        if (selectedEntity != null) {
            if (selectedEntity.hasComponent("sprite") &&
                selectedEntity.hasComponent("position")) {
                let image = spriteToHTMLImage(selectedEntity.components.sprite.values.filename);
                let x = selectedEntity.components.position.values.x +
                    selectedEntity.components.sprite.values.offset_x -
                    view_x;
                let y = selectedEntity.components.position.values.y +
                    selectedEntity.components.sprite.values.offset_y -
                    view_y;
                let w = image.width * selectedEntity.components.sprite.values.scale_x;
                let h = image.height * selectedEntity.components.sprite.values.scale_y;
                if (prevMouse_x >= x && prevMouse_x <= x + w && prevMouse_y >= y && prevMouse_y <= y + h) { 
                    selectedEntity.components.position.values.x += mouse_x - prevMouse_x;
                    selectedEntity.components.position.values.y += mouse_y - prevMouse_y;
                    updateDisplay = true;
                }
            }
        }
    }
    if ((event.buttons & 4) == 4) { // is middle mouse pressed?
        panView(prevMouse_x, prevMouse_y, mouse_x, mouse_y);
    }
}
function updateTileSelection(event) {
    // changes the tile to paint when the user selects a new
    // one from the tile selection dropdown
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

function paintTiles(mouse_x,mouse_y, brushSize) {
    if (brushSize == 1) {
        const tile_y = (view_y + mouse_y) >> 5;
        const tile_x = (view_x + mouse_x - (32 * (tile_y & 1))) >> 6;
        map[tile_x][tile_y] = brushTile;
        updateDisplay = true;
        return;
    }
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
            x+=32;
            let my = y >> 5;
            let mx = (x >> 6) - (my & 1);
            map[mx][my] = brushTile;
        }
        y+=16;
    }
    return;
}

function paintFill(x, y, tile) {
    // 
    map[x][y] = brushTile;
    for (let i = 0; i < NEIGHBORS.length; i++) {
        let ny = y + NEIGHBORS[i][1];
        if (ny < 0 || ny >= mapHeight) continue;
        let nx = x + NEIGHBORS[i][0];
        if ((y & 1) && (y != ny)) nx++;
        if (nx < 0 || nx >= mapWidth) continue;
        if (map[nx][ny] != tile) continue;
        if ((nx == x) && (ny == y)) continue;
        paintFill(nx, ny, tile);
    }
    return;
}
/*
function mouseWheel(event) {

}
*/

function undo() {
    let ia = map.length;
    while (ia--) {
        let ib = map[ia].length;
        while (ib--) {
            let tmp = map[ia][ib];
            map[ia][ib] = undoMap[ia][ib];
            undoMap[ia][ib] = tmp;
        }
    }
    updateDisplay = true;
    return;
}
function saveMapToUndo() {
    let ia = map.length;
    while (ia--) {
        let ib = map[ia].length;
        while (ib--) {
            undoMap[ia][ib] = map[ia][ib];
        }
    }
    return;
}
function keyDown(event) {
    event.preventDefault();
    pressedKeys[event.key] = true;
}

function keyUp(event) {
    event.preventDefault();
    if ((event.key == "z") && (pressedKeys["Control"])) {
        undo();
    }
    pressedKeys[event.key] = false;
    if (hasEventListener(canvas,"mouseenter",mouseEnter)) {
        canvas.removeEventListener("keyup", keyUp);
    }
}

function mouseDown(event) {
    if ((event.buttons & 1) == 1) {
        saveMapToUndo();
    }
    event.preventDefault();
    mouseMove(event);
}

function mouseUp(event) {
    if (event.button  == 0) {
        // select entitys with the mouse
        if (sidebarTabs[2].enabled) {
            let foundEntity = false;
            for (let i = 0; i < entitys.length; i++) {
                if (entitys[i].hasComponent("sprite") &&
                    entitys[i].hasComponent("position")) {
                    let image = spriteToHTMLImage(entitys[i].components.sprite.values.filename);

                    let x = entitys[i].components.position.values.x +
                        entitys[i].components.sprite.values.offset_x -
                        view_x;
                    let y = entitys[i].components.position.values.y +
                        entitys[i].components.sprite.values.offset_y -
                        view_y;
                    let w = image.width * entitys[i].components.sprite.values.scale_x;
                    let h = image.height * entitys[i].components.sprite.values.scale_y;
                    if (mouse_x >= x && mouse_x <= x + w && mouse_y >= y && mouse_y <= y + h) {
                        console.log(`selecting ${entitys[i].name}`)
                        entitySelection.selectedIndex = i;
                        entityComponentsSelectionUpdate();
                        foundEntity = true;
                        updateDisplay = true;
                    }
                }
            }
            if (!foundEntity && entitySelection.selectedIndex > -1) {
                updateDisplay = true;
                entitySelection.selectedIndex = -1;
                entityComponentsSelectionUpdate();
            }
        }
    }
    event.preventDefault();
}

function handleKeyboard() {
    let offsetX = 0, offsetY = 0;
    if (pressedKeys['w']) {
        offsetY += viewSpeed;
    }
    if (pressedKeys['a']) {
        offsetX += viewSpeed;
    }
    if (pressedKeys['s']) {
        offsetY -= viewSpeed;
    }
    if (pressedKeys['d']) {
        offsetX -= viewSpeed;
    }
    if (offsetX || offsetY) {
        panView(0, 0, offsetX, offsetY);
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

function mapResize() {
    if (!window.confirm("Are you sure you want to resize the map? This cannot be undone.") ){
        return;
    }
    let newWidth = mapWidthInput.value;
    let newHeight = mapHeightInput.value;
    let deltaY = mapHeight - newHeight;
    console.log(deltaY);
    let deltaX = mapWidth - newWidth;
    let tmp = []
    let tmpUndo = [];
    let y = 0, x = 0, oy = Math.floor(deltaY / 2), ox = Math.floor(deltaX / 2);
    while (x < newWidth) {
        tmp.push([]);
        tmpUndo.push([]);
        while (y < newHeight) {
            if (oy >= 0 && oy < mapHeight && ox >= 0 && ox < mapWidth) {
                tmp[x].push(map[ox][oy]);
                tmpUndo[x].push(map[ox][oy]);
            } else {
                tmp[x].push(0);
                tmpUndo[x].push(0);
            }
            y++; oy++;
        }
        x++; ox++;
        oy = Math.floor(deltaY / 2);
        y = 0;
    }
    mapWidth = newWidth; mapHeight = newHeight;
    map = tmp;
    undoMap = tmpUndo;
    updateDisplay = true;
}

function mapNew() {
    const width = Math.floor(Math.abs(Number(window.prompt("New map width:", "80"))));
    const height = Math.floor(Math.abs(Number(window.prompt("New map height:", "80"))));
    const fill = Math.floor(Math.abs(Number(window.prompt("Fill with? 0 for noise.", "0"))));
    mapWidth = width; mapHeight = height;
    let tmp = [];
    let tmpUndo = [];
    let x = 0, y = 0;
    if (fill > tileNames.length-1) fill = tileNames.length-1;
    let n = fill;
    while (x < width) {
        tmp.push([]);
        tmpUndo.push([]);
        while (y < height) {
            if (!fill) {
                n = Math.round(0.5 + noise(x / 8, y / 8) * 3);
            }
            tmp[x].push(n);
            tmpUndo[x].push(n)
            y++
        }
        y = 0;
        x++;
    }
    map = tmp;
    undoMap = tmpUndo;
    boundView();
    updateDisplay = true;
}

function mapImport(e) {
    const selected_file = e.target.files[0];
    if (selected_file) {
        const reader = new FileReader();
        reader.onload = function (ee) {
            const jsn = JSON.parse(ee.target.result);
            mapWidth = jsn.mapWidth;
            mapHeight = jsn.mapHeight;
            map = jsn.map;
            entitys = jsn.entitys;
            updateDisplay = true;
        }
        reader.readAsText(selected_file);
    }
}
function mapExport() {
    const mapData = {
        mapWidth: mapWidth,
        mapHeight: mapHeight,
        map: map,
        entitys: entitys
    }
    const mapBlob = new Blob([JSON.stringify(mapData)]);
    let a = document.createElement("a");
    a.href = URL.createObjectURL(mapBlob);
    a.download = "map.json";
    a.click();
}

function drawMousePosition() {
    ctx.fillStyle = "#FFF";
    ctx.fillRect(canvas.width - 60, canvas.height - 24, 60, 24);
    ctx.fillStyle = "black";
    ctx.fillText(`x: ${view_x + mouse_x}`, canvas.width - 50, canvas.height - 15);
    ctx.fillText(`y: ${view_y + mouse_y}`, canvas.width - 50, canvas.height - 3);
}
function update() {
    handleKeyboard();
    draw();
    drawMousePosition();
}

window.addEventListener("load", onLoad);
