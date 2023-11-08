const image_load_element = document.getElementById("image_load_element");
const image_element = document.getElementById("image_element");
const button = document.getElementById("generate_lineart");
const output_lineart_element = document.getElementById("output_lineart");
const canvas = document.getElementById("manipulation_space");

image_load_element.addEventListener("change", function (event) {
    const selected_file = event.target.files[0];
    if (selected_file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            image_element.src = e.target.result;
        };
        reader.readAsDataURL(selected_file);
    }
});

button.addEventListener("click", function () {
    const ctx = canvas.getContext("2d");
    canvas.width = image_element.width; canvas.height = image_element.height;
    canvas_diff = document.createElement("canvas");
    canvas_diff.width = image_element.width; canvas_diff.height = image_element.height;
    ctxd = canvas_diff.getContext("2d");
    document.body.appendChild(canvas_diff);
    // the line detection algorithm works by applying blur and getting
    // the difference between the blurred image and the original
    ctx.drawImage(image_element, 0, 0);
    ctxd.drawImage(image_element, 0, 0);
    blur(ctx,7);
    let image_data_b = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let image_data_a = ctxd.getImageData(0, 0, canvas.width, canvas.height);
    difference(image_data_a, image_data_b, ctxd);
});
function blur(context, blur_passes=1) {
    const width = context.canvas.width;
    const height = context.canvas.height;
    for (let pass = 0; pass < blur_passes; pass++) {
        console.log(`pass ${pass} of ${blur_passes}`);
        const original_image_data = context.getImageData(0, 0, width, height);
        const image_data = new ImageData(new Uint8ClampedArray(original_image_data.data), width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // sample pixel data for all neighbouring points
                const index = (y * width + x) * 4;
                let sum_r = 0, sum_g = 0, sum_b = 0;
                for (let ny = -1; ny <= 1; ny++) {
                    for (let nx = -1; nx <= 1; nx++) {
                        let px = nx + x; let py = ny + y;
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const nindex = (py * width + px) * 4;
                            sum_r += original_image_data.data[nindex];
                            sum_g += original_image_data.data[nindex + 1];
                            sum_b += original_image_data.data[nindex + 2];
                        }
                    }
                }
                // set pixel to mean of neighbors
                const out_r = Math.round(sum_r / 9);
                const out_g = Math.round(sum_g / 9);
                const out_b = Math.round(sum_b / 9);
                image_data.data[index] = out_r;
                image_data.data[index+1] = out_g;
                image_data.data[index+2] = out_b;
                image_data.data[index + 3] = 255;
            }
        }
        context.putImageData(image_data, 0, 0);
    }
}
function difference(image_data_a, image_data_b, output_context) {
    const width = output_context.canvas.width;
    const height = output_context.canvas.height;
    const result_image_data = output_context.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x)*4;
            let out_r = Math.abs(image_data_a.data[index] - image_data_b.data[index]);
            let out_g = Math.abs(image_data_a.data[index+1] - image_data_b.data[index+1]);
            let out_b = Math.abs(image_data_a.data[index+2] - image_data_b.data[index+2]);
            result_image_data.data[index] = out_r;
            result_image_data.data[index+1] = out_g;
            result_image_data.data[index+2] = out_b;
            result_image_data.data[index+3] = 255;//alpha channel
        }
    }
    output_context.putImageData(result_image_data, 0, 0);
}
