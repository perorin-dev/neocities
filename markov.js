const SOURCE_FILE = "gangstalking.txt";
const MARKOV_FILE = "markov8.json";
const ORDER = 8;

intext = "";
ngrams = {};

function setup(intext) {
    for (i = 0; i < intext.length - ORDER; i++) {
        gram = intext.slice(i, i + ORDER);
        if (!(gram in ngrams)) ngrams[gram] = [];
        ngrams[gram].push(intext[i + ORDER]);
    }
    sgrams = JSON.stringify(ngrams);
    blog_content.innerHTML = sgrams;
    return sgrams;
}

function markov() {
    post_length = 500 + Math.random() * 1000;
    ngrams = JSON.parse(intext);
    cgram = Object.keys(ngrams)[Math.floor(Math.random() * Object.keys(ngrams).length)];
    r = cgram;
    for (i = 0; i < post_length; i++) {
        if (!(cgram in ngrams)) break;
        r += ngrams[cgram][Math.floor(Math.random() * ngrams[cgram].length)];
        cgram = r.slice(r.length - ORDER, r.length);
    }
    i = 0;
    while (r[i] != ' ') i++;
    r = r.slice(i);
    for (i = 0; i < r.length; i++) {
        if (r.slice(i, i + 2) == '. ' && Math.random() < 0.5) {
            r = r.slice(0, i + 1) + '<br>' + r.slice(i + 1);
            i += 4;
        }
    }
    if (r.slice(-1) != '.') r += '.';
    blog_content.innerHTML = r;
    return r;
}


blog_content = document.getElementById("blog-content");

fetch(MARKOV_FILE)
    .then((res) => res.text())
    .then((text) => {
        intext = text;
        //setup(intext);
        markov();
    })
    .catch((e) => console.error(e));


