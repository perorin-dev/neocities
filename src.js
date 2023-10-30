
function ldd() {
  now = (Date.now()/1000)%3;
  document.getElementById('loading').innerHTML = 'loading'+ '...'.slice(-now+3);
  setTimeout( ldd, 1000);
}
ldd()
//setTimeout( ldd, 10);

/*const canvas = document.getElementById("cv");
canvas.width = 400;
canvas.height = 165;
const ctx = canvas.getContext("2d");
const offscreen_canvas = new OffscreenCanvas(canvas.width,canvas.height);
const octx = offscreen_canvas.getContext("2d");
function mapToDrawable(arr) {
  output = new Uint8ClampedArray(arr.length*4);
  for ( i = 0; i < arr.length; i++ ) {
    v = arr[i]*255;
    output[i*4] = v;
    output[i*4+1] = v*.25;
    output[i*4+2] = v*.5;
    if ( arr[i] ) { output[i*4+3] = 255; } else { output[i*4+3] = 4; }
  }
  return output;
}

function main() {
  for ( y = 0; y < canvas.height; y++ ) {
    for ( x = 0; x < canvas.width; x++ ) {
      live_neighbors = 0;
      for   ( ny = y - 1; ny <= y + 1; ny++ ) {
        for ( nx = x - 1; nx <= x + 1; nx++ ) {
          if ( ny > canvas.height ) { ny -= canvas.height; }
          if ( nx > canvas.width  ) { nx -= canvas.width;  }
          if ( ny < 0 ) { ny += canvas.height; }
          if ( nx < 0 ) { nx += canvas.width;  }
          if ( nx == x && ny == y ) { continue; }
          if ( screen_a[ ny * canvas.width + nx ] ) {
            live_neighbors++;
          }
        }
      }
      i = canvas.width * y + x;
      if (screen_a[i] == 0 ) {
        if ( live_neighbors == 3 ) {
          screen_b[i] = 1;
        }
      }
      else {
        if ( live_neighbors < 2 ) {
          screen_b[i] = 0;
        }
        else if ( live_neighbors > 3 ) {
          screen_b[i] = 0;
        }
        else {
          screen_b[i] = 1;
        }
      }
    }
  }
  for ( i = 0; i < screen_b.length; i++ ) {
    if ( screen_grab.data[i*4] ) { screen_b[i] = 1.5; }
  }
    
  //console.log(screen_b);
  output_screen = new ImageData(mapToDrawable(screen_b),canvas.width,canvas.height);
  octx.putImageData(output_screen,0,0);
  ctx.drawImage(offscreen_canvas,0,0);
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillText(screen_text,canvas.width/2, canvas.height/2+font_size/4,canvas.width-20);
  screen_a = screen_b.slice(0);
  window.requestAnimationFrame(main);
}

screen_a = new Uint8ClampedArray(canvas.width*canvas.height);
screen_b = new Uint8ClampedArray(canvas.width*canvas.height);

/*
// initial seed
for ( i = 0; i < canvas.width*canvas.height; i++ ) {
  if (Math.round(Math.random())) {
    screen_a[i] = 255;
  } else {
    screen_a[i] = 0;
  }
}
*//* 
screen_text = "perorin";
font_size = 80
ctx.font = font_size+"px serif";
ctx.fillStyle = "rgba(255,64,128,255)";
ctx.textAlign = "center";
ctx.fillText(screen_text,canvas.width/2, canvas.height/2+font_size/4,canvas.width-20);
screen_grab = ctx.getImageData(0,0,canvas.width,canvas.height);
for ( i = 0; i < screen_a.length; i++ ) {
  screen_a[i] = screen_grab.data[i*4];
}
frame = 0;
window.requestAnimationFrame(main);

*/