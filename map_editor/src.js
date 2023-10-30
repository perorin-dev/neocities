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

function noise(x, y, z) {
    if (x < 0) x = -x; if (y < 0) y = -x; if (z < 0) z = -z;
    xi = Math.floor(x); yi = Math.floor(y); zi = Math.floor(z);
    xf = x - xi; yf = y - yi; zf = z - zi;
    ampl = 0.5;
    for (o = 0; o < perlin_octaves; o++) {
        of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
        rxf = scaled_cosine(xf); ryf = scaled_cosine(yf);
        n1 = perlin[of & PERLIN_SIZE];
        n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE - n2]);
        n1 += ryf * (n2 - n1);
        of += PERLIN_ZWRAP;
        n2 = perlin[of & PERLIN_SIZE];
        n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
        n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);
        n1 += scaled_cosine(zf) * (n2 - n1);
        r = n1 * ampl; ampl *= perlin_amp_falloff;
        xi <<= 1; xf *= 2; yi <<= 1; yf *= 2; zi <<= 1; zf *= 2;
        if (xf >= 1) { xi += 1; xf -= 1; }
        if (yf >= 1) { yi += 1; yf -= 1; }
        if (zf >= 1) { zi += 1; zf -= 1; }
    }
    return r;
}

const background_tiles = new Image();
background_tiles.src = "assets/tiles-0.03.png"; // 32x16 tiles. 96x32 hexagons.

map_width = 80;
map_height = 80;
if (map_width < 864 / 64) map_width = Math.round(864 / 64);
if (map_width < 864 >> 6) map_width = 864 >> 6;
if (map_height < 632 >> 5) map_height = 632 >> 5;
map = []
for (x = 0; x < map_width; x++) {
    map.push([]);
    for (y = 0; y < map_height; y++) {
        map[x].push(1);
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
pressed_keys = {};
brush_tile = 2;

function pick_tile(tile_a, tile_b) {
    //bg tile order:
    // 1 - grass
    // 2 - dirt
    // 3 - stone
    if (tile_a == 2 && tile_b == 0) return 1;
    if (tile_a == 5 && tile_b == 0) return 4;
    if (tile_a == 5 && tile_b == 2) return 3;
    return tile_a;
}

function on_image_load() {
    update_display = true;
    setInterval(update, 1000 / 60);
}
function check_edges(x, y) {

    o = (x % 2);
    center = map[x][y];
    top_left = center; top = center; top_right = center; bottom_left = center; bottom = center; bottom_right = center;
    if (x >= 0 && x < map_width && y >= 0 && y < map_height) {
        if (x > 0) {
            if (y > 0) {
                top_left = map[x - 1][y - 1 + o];
            }
            if (y < map_width - 1) {
                bottom_left = map[x - 1][y + o];
            }
        }
        if (x < map_width - 1) {
            if (y > 0) {
                top_right = map[x + 1][y - 1 + o];
            }
            if (y < map_width - 1) {
                bottom_right = map[x + 1][y + o];
            }
        }
        if (y > 0) {
            top = map[x][y - 1];
        }
        if (y < map_height - 1) {
            bottom = map[x][y + 1];
        }
    }
    return [center, top_left, top, top_right, bottom_left, bottom, bottom_right];
}
function draw() {
    if (update_display ) {
        octx.clearRect(0, 0, canvas.width, canvas.height);
        x = highlighted_tile[0];
        y = highlighted_tile[1];

        if (x < 1) x = 1;
        if (x > map_width - 2) x = map_width - 2;
        if (y < 1) y = 1;
        if (y > map_height - 2) y = map_height - 2;
        tile_x = map[x][y] * 96;
        tile_y = map[x - 1][y - (x % 2)] * 32;
        octx.drawImage(
            background_tiles, tile_x, tile_y, 32, 16,
            Math.round((x * 64 - view_x) * scale),
            Math.round((y * 32 - view_y + (x % 2)*16) * scale),
            32 * scale, 16 * scale);
        // draw top middle
        tile_x = map[x][y] * 96;
        tile_y = map[x][y - 1] * 32;
        octx.drawImage(
            background_tiles, tile_x + 32, tile_y, 32, 16,
            Math.round((x * 64 - view_x + 32) * scale),
            Math.round((y * 32 - view_y + (x % 2)*16) * scale),
            32 * scale, 16 * scale);
        // draw top right
        tile_y = map[x + 1][y - (x%2)] * 32;
        octx.drawImage(
            background_tiles, tile_x + 64, tile_y, 32, 16,
            Math.round((x * 64 - view_x + 64) * scale),
            Math.round((y * 32 - view_y + (x % 2) * 16) * scale),
            32 * scale, 16 * scale);
        // draw bottom left
        tile_y = map[x - 1][y + (x % 2)] * 32;
        octx.drawImage(
            background_tiles, tile_x, tile_y + 16, 32, 16,
            Math.round((x * 64 - view_x) * scale),
            Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
            32 * scale, 16 * scale);
        // middle bottom
        tile_y = map[x][y+1] * 32;
        octx.drawImage(
            background_tiles, tile_x + 32, tile_y + 16, 32, 16,
            Math.round((x * 64 - view_x + 32) * scale),
            Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
            32 * scale, 16 * scale);
        // bottom right
        tile_y = map[x + 1][y + (x % 2)] * 32;
        octx.drawImage(
            background_tiles, tile_x + 64, tile_y + 16, 32, 16,
            Math.round((x * 64 - view_x + 64) * scale),
            Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
            32 * scale, 16 * scale);
        octx.fillStyle = "rgba(255,255,255,0.3)";
        octx.fillRect(x * 64 - view_x, y * 32 - view_y + (x % 2) * 16, 96, 32);
        for (x = Math.floor(view_x / 64 * scale)-1; x < Math.floor(view_x + canvas.width) / 64 * scale + 1; x++) {
            for (y = Math.floor(view_y / 32 * scale) - 1; y < Math.floor(view_y + canvas.height) / 32 * scale + 1; y++) {
                if (x < 1) continue; if (x > map_width - 2) continue;
                if (y < 1) continue; if (y > map_height - 2) continue;
                if (x == highlighted_tile[0] && y == highlighted_tile[1]) continue;

                tile_x = map[x][y] * 96;
                tile_y = map[x - 1][y-((x-1)%2)] * 32;
                octx.drawImage(
                    background_tiles, tile_x, tile_y, 32, 16,
                    Math.round((x * 64 - view_x) * scale),
                    Math.round((y * 32 - view_y + (x % 2)*16) * scale),
                    32 * scale, 16 * scale);
                // draw top middle
                tile_y = map[x][y - 1] * 32;
                octx.drawImage(
                    background_tiles, tile_x + 32, tile_y, 32, 16,
                    Math.round((x * 64 - view_x + 32) * scale),
                    Math.round((y * 32 - view_y + (x % 2)*16) * scale),
                    32 * scale, 16 * scale);
                // draw top right
                tile_y = map[x + 1][y-((x+1)%2)] * 32;
                octx.drawImage(
                    background_tiles, tile_x + 64, tile_y, 32, 16,
                    Math.round((x * 64 - view_x + 64) * scale),
                    Math.round((y * 32 - view_y + (x % 2) * 16) * scale),
                    32 * scale, 16 * scale);
                // draw bottom left
                tile_y = map[x - 1][y + (x % 2)] * 32;
                octx.drawImage(
                    background_tiles, tile_x, tile_y + 16, 32, 16,
                    Math.round((x * 64 - view_x) * scale),
                    Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
                    32 * scale, 16 * scale);
                // middle bottom
                tile_y = map[x][y+1] * 32;
                octx.drawImage(
                    background_tiles, tile_x + 32, tile_y + 16, 32, 16,
                    Math.round((x * 64 - view_x + 32) * scale),
                    Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
                    32 * scale, 16 * scale);
                // bottom right
                tile_y = map[x + 1][y + (x % 2)] * 32;
                octx.drawImage(
                    background_tiles, tile_x + 64, tile_y + 16, 32, 16,
                    Math.round((x * 64 - view_x + 64) * scale),
                    Math.round((y * 32 - view_y + (x % 2)* 16 + 16) * scale),
                    32 * scale, 16 * scale);

            }
        }
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
        if (view_x + canvas.width > map_width * 64 * scale+64) view_x = map_width * 64 * scale - canvas.width+64;
        if (view_y + canvas.height > map_height * 32* scale+32) view_y = map_height * 32 * scale - canvas.height+32;
    }
    // calculate which tile the mouse is over
    mouse_tile_x = Math.round(((view_x + mouse_x - 48) * scale) / 64);
    if (mouse_tile_x % 2) {
        mouse_tile_y = Math.round(((view_y + mouse_y - ((view_x % 2) * 16) - 32) * scale) / 32);
    } else {
        mouse_tile_y = Math.round(((view_y + mouse_y - 16) * scale) / 32);
    }
    if ([mouse_tile_x, mouse_tile_y] != highlighted_tile) {
        highlighted_tile = [mouse_tile_x, mouse_tile_y];
        highlighted_tile_display.innerHTML = "x: " + highlighted_tile[0] + ", y: " + highlighted_tile[1] + ", value: " + map[highlighted_tile[0]][highlighted_tile[1]];
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
    if (pressed_keys['1']) {
        brush_tile = 1;
    }
    if (pressed_keys['2']) {
        brush_tile = 2;
    }
    if (pressed_keys['3']) {
        brush_tile = 3;
    }
    if (pressed_keys['4']) {
        brush_tile = 4;
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
