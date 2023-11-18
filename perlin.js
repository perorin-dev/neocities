const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 65535;
const perlin_octaves = 4;
const perlin_amp_falloff = 0.5;
function scaled_cosine(i) {
    return 0.5 * (1.0 - Math.cos(i * Math.PI));
}
let perlin;
function noise(x, y = 0, z = 0) {
    if (perlin === undefined) {
        perlin = [];
        for (let i = 0; i <= PERLIN_SIZE; i++) {
            perlin.push(Math.random());
        }
    }
    x = Math.abs(x); y = Math.abs(y); z = Math.abs(z);
    let xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let xf = x - xi, yf = y - yi, zf = z - zi;
    let rxf, ryf;
    let r = 0, ampl = 0.5;
    let n1, n2, n3;
    for (let i = 0; i < perlin_octaves; i++) {
        let off = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
        rxf = scaled_cosine(xf); ryf = scaled_cosine(yf);
        n1 = perlin[off & PERLIN_SIZE];
        n1 += rxf * (perlin[(off + 1) & PERLIN_SIZE] - n1);
        n2 = perlin[(off + PERLIN_YWRAP) & PERLIN_SIZE];
        n2 += rxf * (perlin[(off + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
        n1 += ryf * (n2 - n1);
        off += PERLIN_ZWRAP;
        n2 = perlin[off & PERLIN_SIZE];
        n2 += rxf * (perlin[(off + 1) & PERLIN_SIZE] - n2);
        n3 = perlin[(off + PERLIN_YWRAP) & PERLIN_SIZE];
        n3 += rxf * (perlin[(off + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
        n2 += ryf * (n3 - n2);
        n1 += scaled_cosine(zf) * (n2 - n1);
        r += n1 * ampl;
        ampl *= perlin_amp_falloff;
        xi <<= 1; xf *= 2;
        yi <<= 1; yf *= 2;
        zi <<= 1; zf *= 2;
        if (xf >= 1) { xi++; xf--; }
        if (yf >= 1) { yi++; yf--; }
        if (zf >= 1) { zi++; zf--; }
    }
    return r;
}
