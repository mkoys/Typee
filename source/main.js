import words from "./words.js"

const mainElement = document.querySelector(".main"); 
const textElement = document.querySelector(".text");
const cursorElement = document.querySelector(".cursor");

const textLength = 20;
const fontSize = 24;
const fontFamily = "Cousine";
const textLanguage = "english";
const funtionKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
const ignoreKeys = ["Shift", "Alt", "CapsLock", "Controll", "Enter", "Delete", "Insert", "Home", "End", "PageUp", "PageDown", "ScrollLock", "Pause", ...funtionKeys];
const visibleLines = 3;

let text = "";
let cursorCss;
let characterWidth;
let cursorPosition = { x: 0, y : 0 };
let visibleLine = 0;
let scrollOffset = 0;
let wordPosition = 0;
let characterPosition = 0;
let characterHeight = 0;
let right = 0;
let wrong = 0;
let timer = null;

calibrate();
generateText(textLength);
renderText(text);

const resizeObserver = new ResizeObserver(_entries => updateView({ force: true }));
resizeObserver.observe(textElement);

document.addEventListener("keydown", event => {
  if(ignoreKeys.findIndex(key => key === event.key) > -1) return;
  if(!timer) timer = performance.now();
  if(event.key === "Tab") {
    event.preventDefault();
    reset();
    generateText(textLength);
    renderText(text);
  }else if(event.key === "Backspace") {
    cursorBack();
    const currentCharacter = textElement.children[wordPosition].children[characterPosition];
    if(currentCharacter.classList.contains("wrong")) wrong--;
    if(currentCharacter.classList.contains("right")) right--;
    currentCharacter.classList.remove("wrong");
    currentCharacter.classList.remove("right");
  }else {
    const currentCharacter = textElement.children[wordPosition].children[characterPosition];
    if(currentCharacter.textContent === event.key) {
      currentCharacter.classList.add("right");
      right++;
    }else {
      currentCharacter.classList.add("wrong");
      wrong++;
    }
    cursorNext();
  }
});

function reset() {
    text = "";
    right = 0;
    wrong = 0;
    wordPosition = 0;
    characterPosition = 0;
    updateView({ force: true });
}

function calibrate() {
  const canvas = new OffscreenCanvas(100, 100);
  const cssRules = document.styleSheets[0].cssRules;
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px ${fontFamily}`;
  characterWidth = context.measureText("a").width;
  for(let ruleIndex = 0; ruleIndex < cssRules.length; ruleIndex++) {
    const cssRule = cssRules.item(ruleIndex);
    if(cssRule.selectorText && cssRule.selectorText === ".char") {
      cssRule.style.width = `${characterWidth}px`;
      cssRule.style.fontSize = `${fontSize}px`;
    }

    if(cssRule.selectorText && cssRule.selectorText === ".cursor") {
      cursorCss = cssRule;
      cssRule.style.width = `${characterWidth}px`;
    }
  }

  mainElement.style.width = "20px";
  renderText("Hokus pokus try to focus!");

  for(let childIndex = 0; childIndex < textElement.children.length; childIndex++) {
    const element = textElement.children[childIndex];
    if(!characterHeight && element.offsetTop > 0) characterHeight = element.offsetTop;
    cursorCss.style.height = `${characterHeight}px`;
  }

  mainElement.style.width = null;
  mainElement.style.height = `${visibleLines * characterHeight}px`;
  renderText(text);
}

function generateText(length = 0) {
  for(let index = 0; index < length; index++) {
    const randomNumber = Math.floor(Math.random() * words[textLanguage].length);
    text += index != length - 1 ? `${words[textLanguage][randomNumber]} ` : words[textLanguage][randomNumber];
  }
}

function cursorNext(times = 1) {
  for(let index = 0; index < times; index++) {
  characterPosition++;
    if(characterPosition >= textElement.children[wordPosition].children.length) {
      characterPosition = 0;
      wordPosition++;
      if(wordPosition >= textElement.children.length) { 
        const precision = right / (text.length / 100);
        const time = Math.floor((performance.now() - timer) / 1000);
        console.log(`Right: ${right}`);
        console.log(`Wrong: ${wrong}`);
        console.log(`Precision: ${Number(precision).toFixed(2)}`);
        console.log(`Time: ${time}s`);
        console.log(`WPM: ${(text.split(" ").length / time) * 60}`);

        reset();
        generateText(textLength);
        renderText(text);
      }
    }
  }

  updateView();
}

function cursorBack(times = 1) {
  for(let index = 0; index < times; index++) {
    visibleLine = visibleLines;
    characterPosition--;
    if(characterPosition < 0) {
      wordPosition--;
      if(wordPosition < 0) { 
        wordPosition = 0;
        characterPosition = 0;
      }else {
        characterPosition = textElement.children[wordPosition].children.length - 1;
      }
    }
  }

  updateView();
}

function updateView(options = { force: false }) {
  let lastCursorPosition = { ...cursorPosition };
  cursorUpdate();
  const lineDelta = visibleLines % 2 == 0 ? visibleLines / 2 : (visibleLines - 1) / 2;
  if(lastCursorPosition.y !== cursorPosition.y) {
    if(options.force || visibleLine >= lineDelta) {
      visibleLine = lineDelta;
      scrollOffset = cursorPosition.y - (lineDelta * characterHeight);
      mainElement.scrollTo({ top: scrollOffset, behavior: "smooth" });
    }else {
      visibleLine++;
    }
  }
}

function cursorUpdate() {
  const currentCharacter = textElement.children[wordPosition].children[characterPosition];
  cursorPosition.x = currentCharacter.offsetLeft;
  cursorPosition.y = currentCharacter.offsetTop;
  cursorElement.style.left = `${cursorPosition.x}px`;
  cursorElement.style.top = `${cursorPosition.y}px`;
}

function renderText(text) {
  textElement.innerHTML = "";
  const words = text.split(" ").map((word, wordIndex) => wordIndex !== text.split(" ").length - 1 ? word + " " : word);

  words.forEach(word => {
    const wordElement = document.createElement("p");
    wordElement.classList.add("word");
    generateCharacters(word, wordElement);
    textElement.appendChild(wordElement);
  });
}

function generateCharacters(text, element) {
  const characters = text.split("");
  characters.forEach(char => {
    const charElement = document.createElement("p");
    charElement.textContent = char;
    charElement.classList.add("char");
    element.appendChild(charElement);
  });
}
