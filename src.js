const SOURCE_FILE = "gangstalking.txt";
const MARKOV_FILE = "markov8.json";
const ORDER = 8;

intext = "";
ngrams = {};
// yyyy-mm-dd
now = new Date(Date.now());
today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
yesterday = date_to_str(new Date(Date.parse(today) - 86410));
tomorrow = date_to_str(new Date(Date.parse(today)));
today = yesterday;
yesterday = date_to_str(new Date(Date.parse(today) - 86410));

function date_to_str(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
}

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

function markov(date) {
    seed = Date.parse(date);
    post_length = 1000 + Math.random() * 3000;
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

function go_to_tomorrow() {
    yesterday = date_to_str(new Date(Date.parse(today)))
    today = date_to_str(new Date(Date.parse(tomorrow)));
    tomorrow = date_to_str(new Date(Date.parse(tomorrow) + 94000));
    now_date.innerHTML = today;
    head_date.innerHTML = today;
    future_date.innerHTML = tomorrow;
    past_date.innerHTML = yesterday;
    markov(today);
}
function go_to_yesterday() {
    today = yesterday;
    tomorrow = date_to_str(new Date(Date.parse(tomorrow) - 86401));
    yesterday = date_to_str(new Date(Date.parse(yesterday) - 86401));
    now_date.innerHTML = today;
    head_date.innerHTML = today;
    future_date.innerHTML = tomorrow;
    past_date.innerHTML = yesterday;
    markov(today);
}

blog_content = document.getElementById("blog-content");
head_date = document.getElementById("head-date");
future_date = document.getElementById("future-date");
now_date = document.getElementById("now");
past_date = document.getElementById("past-date");

now_date.innerHTML = today;
head_date.innerHTML = today;
future_date.innerHTML = tomorrow;
past_date.innerHTML = yesterday;

future_date.addEventListener("mouseup", go_to_tomorrow);
past_date.addEventListener("mouseup", go_to_yesterday);

fetch(MARKOV_FILE)
    .then((res) => res.text())
    .then((text) => {
        intext = text;
        //setup(intext);
        markov(Date.parse(today));
    })
    .catch((e) => console.error(e));


