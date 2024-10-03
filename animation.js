export function startAnimation() {
  var alphabet = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
  ];
  var letter_count = 0;
  var el = document.querySelector("#loading");
  var word = el.innerHTML.trim();
  var finished = false;

  el.innerHTML = ""; // Clear the element
  for (var i = 0; i < word.length; i++) {
    var span = document.createElement("span");
    span.innerHTML = word.charAt(i);
    el.appendChild(span);
  }

  function write() {
    for (var i = letter_count; i < word.length; i++) {
      var c = Math.floor(Math.random() * 36);
      document.querySelectorAll("span")[i].innerHTML = alphabet[c];
    }
    if (!finished) {
      setTimeout(write, 10); // Keep running with minimal delay
    }
  }

  function inc() {
    var spans = document.querySelectorAll("span");
    spans[letter_count].innerHTML = word[letter_count];
    spans[letter_count].classList.add("glow");
    letter_count++;
    if (letter_count >= word.length) {
      finished = true;
    } else {
      setTimeout(inc, 500); // Speed up next increment
    }
  }

  setTimeout(inc, 100);
  setTimeout(write, 10);
}
