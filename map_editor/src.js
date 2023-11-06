const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;


perlin_octaves = 4;
perlin_amp_falloff = 0.5;

function scaled_cosine(i) {
    return 0.5 * (1 - Math.cos(i * Math.PI));
}

perlin = new Array(PERLIN_SIZE);
for (i = 0; i < PERLIN_SIZE; i++) {
    perlin[i] = Math.random();
}

function noise(x, y=0, z=0) {
    if (x < 0) x = -x; if (y < 0) y = -x; if (z < 0) z = -z;
    xi = Math.floor(x); yi = Math.floor(y); zi = Math.floor(z);
    xf = x - xi; yf = y - yi; zf = z - zi;
    ampl = 0.5;
    r = 0;
    for (o = 0; o < perlin_octaves; o++) {
        of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
        rxf = scaled_cosine(xf); ryf = scaled_cosine(yf);
        n1 = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);
        of += PERLIN_ZWRAP;
        n2 = perlin[of & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
        n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);
        n1 += scaled_cosine(zf) * (n2 - n1);
        r += n1 * ampl; ampl *= perlin_amp_falloff;
        xi <<= 1; xf *= 2; yi <<= 1; yf *= 2; zi <<= 1; zf *= 2;
        if (xf >= 1) { xi += 1; xf -= 1; }
        if (yf >= 1) { yi += 1; yf -= 1; }
        if (zf >= 1) { zi += 1; zf -= 1; }
    }
    return r;
}

const background_tiles = new Image();
background_tiles.src = "assets/tiles.png"; // 32x16 tiles. 64x48 hexagons.
const tile_width = 64;
const tile_height = 48;
const tile_names = ['empty', 'grass', 'dirt', 'stone', 'paved road'];

const tile_selection_dropdown = document.getElementById("tile_selection_dropdown");
tile_selection_dropdown.innerHTML = "<option selected>" + tile_names[1] + "</option>";
for (i = 2; i < tile_names.length; i++) {
    tile_selection_dropdown.innerHTML += "<option>" + tile_names[i] + "</option>";
}
tile_selection_dropdown.addEventListener("change", update_tile_selection);

const tile_selection_display = document.getElementById("tile_selection_display");
tile_selection_display.width = tile_width; tile_selection_display.height = tile_height;
tile_selection_display_context = tile_selection_display.getContext("2d");
brush_tile = 1;

function update_tile_selection(event) {
    brush_tile = tile_selection_dropdown.selectedIndex+1;
    tile_selection_display_context.clearRect(0, 0, tile_width, tile_height);
    tile_selection_display_context.drawImage(
        background_tiles,
        brush_tile * tile_width, 0,
        tile_width, tile_height,
        0, 0,
        tile_width, tile_height
    );
}

map_width = 80;
map_height = 80;

map = []
for (x = 0; x < map_width; x++) {
    map.push([]);
    for (y = 0; y < map_height; y++) {
        // fill the map with noise.
        map[x].push(Math.round(0.5+noise(x/8,y/8,0)*3));
    }
}

// default view to the middle of the map
view_x = map_width<<5;
view_y = map_height<<4;

// setup canvas and view
const canvas = document.getElementById("c");
canvas.addEventListener("mouseenter", mouse_enter);
canvas.width = 800;
canvas.height = 600;
scale = 1;
highlighted_tile = [0, 0];
highlighted_tile_display = document.getElementById("highlighted_tile_display");
view_speed = 5;
const ctx = canvas.getContext("2d");
const offscreen_canvas = new OffscreenCanvas(canvas.width, canvas.height);
const octx = offscreen_canvas.getContext("2d");
octx.imageSmoothingEnabled = false;
update_display = false;
// prevent the map from being to small
if (map_width < canvas.width / tile_width) map_width = Math.round(canvas.width / tile_width);
if (map_height < canvas.height / tile_height) map_height = Math.round(canvas.height / tile_height);
pressed_keys = {};

function on_image_load() {
    update_display = true;
    update_tile_selection(null);
    setInterval(update, 1000 / 60);
}
function draw() {
    if (update_display ) {
        octx.fillStyle = "rgba(255,255,255,1)";
        octx.clearRect(0, 0, canvas.width, canvas.height);
        //octx.fillRect(x * 64 - view_x, y * 32 - view_y + (x % 2) * 16, 96, 32);
        for (x = Math.floor(view_x / tile_width * scale)-1; x < Math.floor(view_x + canvas.width) / tile_width * scale + 1; x++) {
            for (y = Math.floor(view_y / 32 * scale) - 1; y < Math.floor(view_y + canvas.height) / 32 * scale + 1; y++) {
                if (x < 1) continue; if (x > map_width - 2) continue;
                if (y < 1) continue; if (y > map_height - 2) continue;
                // if (x == highlighted_tile[0] && y == highlighted_tile[1]) continue;

                //top left
                tile_x = map[x][y] * tile_width;
                tile_y = map[x-1+(y%2)][y-1] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x, tile_y, 32, 16,
                    Math.round((x * tile_width - view_x + (y%2)*32) * scale),
                    Math.round((y * 32 - view_y ) * scale),
                    32 * scale, 16 * scale);
                // top right
                tile_y = map[x+(y%2)][y - 1] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x + 32, tile_y, 32, 16,
                    Math.round((x * tile_width - view_x + 32 + (y%2)*32) * scale),
                    Math.round((y * 32 - view_y ) * scale),
                    32 * scale, 16 * scale);
                // draw mid left
                tile_y = map[x-1][y] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x, tile_y+16, 32, 16,
                    Math.round((x * tile_width - view_x + (y%2)*32) * scale),
                    Math.round((y * 32 - view_y + 16 ) * scale),
                    32 * scale, 16 * scale);
                // draw mid right
                tile_y = map[x + 1][y] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x+32, tile_y + 16, 32, 16,
                    Math.round((x * tile_width - view_x + (y%2)*32 + 32) * scale),
                    Math.round((y * 32 - view_y + 16) * scale),
                    32 * scale, 16 * scale);
                // bottom left
                tile_y = map[x-1+(y%2)][y+1] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x, tile_y + 32, 32, 16,
                    Math.round((x * tile_width - view_x + (y%2)*32) * scale),
                    Math.round((y * 32 - view_y + 32) * scale),
                    32 * scale, 16 * scale);
                // bottom right
                tile_y = map[x+(y%2)][y + 1] * tile_height;
                octx.drawImage(
                    background_tiles, tile_x+32, tile_y + 32, 32, 16,
                    Math.round((x * tile_width - view_x + (y%2)*32 + 32) * scale),
                    Math.round((y * 32 - view_y + 32) * scale),
                    32 * scale, 16 * scale);
            }
        }
        highlight_path = new Path2D();
        octx.lineWidth = 1;
        octx.strokeStyle = "red";
        octx.fillStyle = "rgba(255,0,0,0.1)";
        x = highlighted_tile[0]; y = highlighted_tile[1];
        highlight_path.moveTo(x * tile_width + tile_width / 2 - view_x + (32*(y%2)),y * tile_height/3*2 - view_y);
        highlight_path.lineTo(x * tile_width + tile_width - view_x+ (32*(y%2)), y * tile_height/3*2 + tile_height / 3 - view_y);
        highlight_path.lineTo(x * tile_width + tile_width - view_x+ (32*(y%2)), y*tile_height/3*2 + tile_height / 3 * 2 - view_y);
        highlight_path.lineTo(x * tile_width + tile_width / 2 - view_x+ (32*(y%2)), y*tile_height/3*2 + tile_height - view_y);
        highlight_path.lineTo(x * tile_width - view_x+ (32*(y%2)) , y*tile_height/3*2 + tile_height / 3 * 2 - view_y);
        highlight_path.lineTo(x * tile_width - view_x+ (32*(y%2)), y*tile_height/3*2 + tile_height / 3 - view_y);
        highlight_path.closePath();
        octx.stroke(highlight_path);
        octx.fill(highlight_path);
        update_display = false;
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen_canvas, 0, 0);
        //ctx.fillRect(0,0,canvas.width,canvas.height);
    }
}

function mouse_enter(event) {
    prev_mouse_x = event.offsetX; mouse_x = event.offsetX;
    prev_mouse_y = event.offsetY; mouse_y = event.offsetY;
    canvas.addEventListener("mousemove", mouse_move);
    window.addEventListener("keyup", key_up);
    window.addEventListener("keydown", key_down);
    canvas.addEventListener("wheel", mouse_wheel);
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mouseup", mouse_up);
    canvas.addEventListener("mouseleave", mouse_leave);
    canvas.removeEventListener("mouseenter",mouse_enter);
    update_display = true;
}
function mouse_leave(event) {
    canvas.removeEventListener("mousemove",mouse_move);
    window.removeEventListener("keyup",key_up);
    window.removeEventListener("keydown",key_down);
    canvas.removeEventListener("wheel",mouse_wheel);
    canvas.removeEventListener("mousedown",mouse_down);
    canvas.removeEventListener("mouseup", mouse_up);
    canvas.removeEventListener("mouseleave",mouse_leave);
    canvas.addEventListener("mouseenter", mouse_enter);
}
function mouse_move(event) {
    event.preventDefault();
    prev_mouse_x = mouse_x;
    prev_mouse_y = mouse_y;
    mouse_x = event.offsetX;
    mouse_y = event.offsetY;
    // pan view when middle mouse is pressed
    if ((event.buttons & 4) == 4 ) { 
        view_x -= mouse_x - prev_mouse_x;
        view_y -= mouse_y - prev_mouse_y;
        update_display = true;
        if (view_x < 0) view_x = 0;
        if (view_y < 0) view_y = 0;
        if (view_x + canvas.width > map_width * tile_width * scale+tile_width) view_x = map_width * tile_width * scale - canvas.width+tile_width;
        if (view_y + canvas.height > map_height * 64* scale+64) view_y = map_height * 64 * scale - canvas.height+64;
    }
    // calculate which tile the mouse is over
    mouse_tile_y = Math.floor((view_y + mouse_y) / (tile_height / 3 * 2));
    if (mouse_tile_y % 2) {
        mouse_tile_x = Math.floor((view_x + mouse_x-32) / tile_width);
    } else {
        mouse_tile_x = Math.floor((view_x + mouse_x) / tile_width);
    }
    if ([mouse_tile_x, mouse_tile_y] != highlighted_tile) {
        highlighted_tile = [mouse_tile_x, mouse_tile_y];
        highlighted_tile_display.innerHTML = "x: " + highlighted_tile[0] + ", y: " + highlighted_tile[1] + ", value: " + tile_names[map[highlighted_tile[0]][highlighted_tile[1]]] + " ("+ map[highlighted_tile[0]][highlighted_tile[1]]+")";
        update_display = true;
    }
    if ((event.buttons & 1) == 1) {
        map[highlighted_tile[0]][highlighted_tile[1]] = brush_tile;
        update_display = true;
    }
}
function mouse_wheel(event) {
    event.preventDefault();
    if (event.deltaY > 0) {
        scale *= 2;
        update_display = true;
    }
    if (event.deltY < 0) {
        scale *= 0.5;
        update_display = true;
    }
}
function key_down(event) {
    event.preventDefault();
    pressed_keys[event.key] = true;
}

function key_up(event) {
    event.preventDefault();
    pressed_keys[event.key] = false;
    switch (event.key) {
        case "=":
            scale = 1;
            update_display = true;
            break;
        case "+":
            scale *= 2;
            update_display = true;
            break;
        case "-":
            scale *= 0.5;
            update_display = true;
            break;
    }
}
function mouse_down(event) {
    event.preventDefault();
    if ((event.buttons & 1) == 1) {
        map[highlighted_tile[0]][highlighted_tile[1]] = brush_tile;
        update_display = true;
    }
}

function mouse_up(event) {
    event.preventDefault();
}
function import_map() {

}

function export_map() {

}

function handle_keyboard() {
    if (pressed_keys['w']) {
        view_y -= view_speed;
        update_display = true;
    }
    if (pressed_keys['a']) {
        view_x -= view_speed;
        update_display = true;
    }
    if (pressed_keys['s']) {
        view_y += view_speed;
        update_display = true;
    }
    if (pressed_keys['d']) {
        view_x += view_speed;
        update_display = true;
    }
}
function bound_view() {
    if (view_x < 0) view_x = 0;
    if (view_y < 0) view_y = 0;
    if (view_x > map_width * 64 - canvas.width) view_x = map_width * 64 - canvas.width;
    if (view_y > map_height * 32 - canvas.height + 16) view_y = map_height * 32 - canvas.height + 16;
}
function update() {
    handle_keyboard();
    bound_view();
    scale = 1;
    draw();
}

window.addEventListener("load", on_image_load);
