import words from "./words.js"

const mainElement = document.querySelector(".main"); 
const textElement = document.querySelector(".text");
const cursorElement = document.querySelector(".cursor");
const popUpElement = document.querySelector(".popup");
const menuSearchElement = document.querySelector(".menuInput");
const menuOptionsElement = document.querySelector(".menuOptions");
const resultsElement = document.querySelector(".results");
const resultsRightElement = document.querySelector(".resultsRight");
const resultsWrongElement = document.querySelector(".resultsWrong");
const resultsTimeElement = document.querySelector(".resultsTime");
const resultsWpmElement = document.querySelector(".resultsWPM");
const resultsPresicionElement = document.querySelector(".resultsPresicion");

const fontFamily = "Cousine";
const arrowKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
const funtionKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
const ignoreKeys = ["Escape", "Shift", "Alt", "CapsLock", "Enter", "Control", "Delete", "Insert", "Home", "End", "PageUp", "PageDown", "ScrollLock", "Pause", ...funtionKeys, ...arrowKeys];
const resizeObserver = new ResizeObserver(_entries => updateView({ force: true }));
const visibleLines = 3;

const mainMenu = [
  {
    name: "Language...",
    action: () => menuLanguage()
  },
  {
    name: "Font Size...",
    action: () => menuFontSize()
  },
  {
    name: "Word Count...",
    action: () => menuWordCount()
  }
];

let time = 0;
let textLength = 20;
let textLanguage = "english";
let menuOptions = [];
let menuSelected = 0;
let resultOpen = false;
let fontSize = 24;
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
let menuOpen = false;
let precision = 0;
let wpm = 0;

calibrate();
loadMenu({options: mainMenu});
generateText(textLength);
renderText(text);

menuSearchElement.addEventListener("keydown", event => {
  const searchIgnoreKeys = [...ignoreKeys, "Tab"];
  if(searchIgnoreKeys.findIndex(key => key === event.key) > -1) return;
  const filter = event.key === "Backspace" ?  menuSearchElement.value.slice(0, menuSearchElement.value.length - 1) : menuSearchElement.value + event.key;
  loadMenu({filter});
});

document.addEventListener("keydown", event => {
  if(!timer) timer = performance.now();
  if(event.key === "Escape") return openMenu();
  if(event.key === "ArrowUp" && menuOpen) menuSelect(menuSelected - 1);
  if(event.key === "ArrowDown" && menuOpen) menuSelect(menuSelected + 1);
  if(event.key === "Enter") {
    if(menuOpen) {
      const filter = menuSearchElement.value;
      const filteredOptions = [];
      menuOptions.forEach(option => { if(option.name.toLowerCase().startsWith(filter.toLowerCase())) filteredOptions.push(option) });
      filteredOptions[menuSelected].action();
    }
  }

  if(ignoreKeys.findIndex(key => key === event.key) > -1) return;
  if(!menuOpen) {
    if(event.key === "Tab") {
      event.preventDefault();
        reset();
        generateText(textLength);
        renderText(text);
      if(resultOpen) openResults(false);
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
  }
});

function openResults(action) {
  if(action) {
    resizeObserver.unobserve(textElement);
    mainElement.classList.add("disapear");
    resultOpen = true;
    setTimeout(() => {
      mainElement.style.display = "none";
      resultsElement.style.display = "flex";
      setTimeout(() => {
        resultsRightElement.textContent = `Right: ${right}`;
        resultsWrongElement.textContent = `Wrong: ${wrong}`;
        resultsPresicionElement.textContent = `Precision: ${Number(precision).toFixed(2)}%`;
        resultsTimeElement.textContent = `Time: ${time}s`;
        resultsWpmElement.textContent = `WPM: ${(text.split(" ").length / time) * 60}`;
        resultsElement.classList.add("appear");
      }, 10);
    }, 200);
  }else {
    resultsElement.classList.remove("appear");
    resultOpen = false;
    setTimeout(() => {
      resultsElement.style.display = null;
      mainElement.style.display = null;
      setTimeout(() => {
        mainElement.classList.remove("disapear");
      }, 10);
    }, 200);
  }
}

function openMenu(action) {
  if(action === undefined) {
    menuOpen ? close() : open();
  }else {
    action ? open() : close();
  }

  function open() {
    menuOpen = true;
    popUpElement.style.visibility = "visible";
    popUpElement.style.opacity = "1";
    setTimeout(() => menuSearchElement.focus(), 10);
  }

  function close() {
    menuOpen = false;
    menuSelected = 0;
    popUpElement.style.visibility = null;
    popUpElement.style.opacity = null;
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }
}

function menuLanguage() {
  const languages = Object.keys(words);
  const languageMenu = languages.map(language => { 
    return { name: language.charAt(0).toUpperCase() + language.slice(1), action: () => { 
      textLanguage = language; 
      reset();
      generateText(textLength);
      renderText(text);
      openMenu(false);
      setTimeout(() => loadMenu({options: mainMenu}), 200);
    }}
  });

  loadMenu({options: languageMenu});
}

function menuFontSize() {
  const changeFont = (newfontSize) => {
    fontSize = newfontSize; 
    reset();
    calibrate();
    generateText(textLength);
    openMenu(false);
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }

  const fontMenu = [
    { name: "12px", action: () => changeFont(12) },
    { name: "14px", action: () => changeFont(14) },
    { name: "16px", action: () => changeFont(16) },
    { name: "20px", action: () => changeFont(20) },
    { name: "24px", action: () => changeFont(24) }
  ];

  loadMenu({options: fontMenu});
}

function menuWordCount() {
  const changeCount = (newCount) => {
    textLength = newCount; 
    reset();
    generateText(textLength);
    renderText(text);
    openMenu(false);
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }

  const countMenu = [
    { name: "3 words", action: () => changeCount(3) },
    { name: "5 words", action: () => changeCount(5) },
    { name: "10 words", action: () => changeCount(10) },
    { name: "20 words", action: () => changeCount(20) },
    { name: "50 words", action: () => changeCount(50) }
  ];

  loadMenu({options: countMenu});
}

function menuSelect(index) {
  if(menuOptionsElement.children.length > 0) {
    if(menuOptionsElement.children.length > menuSelected && menuSelected > -1) menuOptionsElement.children[menuSelected].classList.remove("selected");
    menuSelected = index;
    if(menuOptionsElement.children.length > menuSelected && menuSelected >= 0) {
      menuOptionsElement.children[menuSelected].classList.add("selected");
    }else if(menuSelected < 0) {
      menuSelect(menuOptionsElement.children.length - 1);
    }else {
      menuSelect(0);
    }
  }else {
    menuSelected = 0;
  }
}

function loadMenu({ options, filter }) {
  if(!filter) filter = "";
  if(options) {
    menuOptions = options;
    menuSearchElement.value = "";
    setTimeout(() => menuSearchElement.focus(), 10);
  }

  menuOptionsElement.innerHTML = "";
  menuOptions.forEach((option, optionIndex) => {
    if(option.name.toLowerCase().startsWith(filter.toLowerCase())) {
      const menuOptionElement = document.createElement("div");
      const menuOptionTextElement = document.createElement("p");
      if(optionIndex == menuSelected) menuOptionElement.classList.add("selected");
      menuOptionElement.classList.add("menuOption");
      menuOptionTextElement.classList.add("menuOptionText");
      menuOptionTextElement.textContent = option.name;
      menuOptionElement.appendChild(menuOptionTextElement);
      menuOptionsElement.appendChild(menuOptionElement);
      menuOptionElement.addEventListener("click", _event => option.action());
      menuOptionElement.addEventListener("mouseenter", _event => menuSelect(optionIndex));
    }
  });

  menuSelect(0);
}

function reset() {
  right = 0;
  wrong = 0;
  wordPosition = 0;
  characterPosition = 0;
  updateView({ force: true });
}

function calibrate() {
  characterHeight = 0;
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
  text = "";
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
        precision = right / (text.length / 100);
        time = Math.floor((performance.now() - timer) / 1000);
        wpm = (text.split(" ").length / time) * 60;
        openResults(true);
        return;
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
  resizeObserver.unobserve(textElement);
  textElement.innerHTML = "";
  const words = text.split(" ").map((word, wordIndex) => wordIndex !== text.split(" ").length - 1 ? word + " " : word);

  words.forEach(word => {
    const wordElement = document.createElement("p");
    wordElement.classList.add("word");
    generateCharacters(word, wordElement);
    textElement.appendChild(wordElement);
  });

  resizeObserver.observe(textElement);
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
