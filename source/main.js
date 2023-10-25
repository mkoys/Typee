const mainElement = document.querySelector(".main"); 
const textElement = document.querySelector(".text");
const cursorElement = document.querySelector(".cursor");
const popUpElement = document.querySelector(".popup");
const menuSearchElement = document.querySelector(".menuInput");
const menuOptionsElement = document.querySelector(".menuOptions");
const resultsElement = document.querySelector(".results");
const resultsRightElement = document.querySelector(".resultsRight");
const resultsWrongElement = document.querySelector(".resultsWrong");
const resultsMistakesElement = document.querySelector(".resultsMistakes");
const resultsTimeElement = document.querySelector(".resultsTime");
const resultsWpmElement = document.querySelector(".resultsWPM");
const resultsCpmElement = document.querySelector(".resultsCPM");
const resultsPresicionElement = document.querySelector(".resultsPresicion");
const resultsRealPresicionElement = document.querySelector(".resultsRealPresicion");
const timerElement = document.querySelector(".timer");

const arrowKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
const funtionKeys = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
const ignoreKeys = ["Escape", "Shift", "Alt", "CapsLock", "Enter", "Control", "Delete", "Insert", "Home", "End", "PageUp", "PageDown", "ScrollLock", "Pause", ...funtionKeys, ...arrowKeys];
const resizeObserver = new ResizeObserver(_entries => updateView({ force: true }));
const visibleLines = 3;

const languageRequest = await fetch("/languages/_list.json");
const languageList = await languageRequest.json();
const themeRequest = await fetch("/themes/_list.json");
const themeList = await themeRequest.json();

const mainMenu = [
  {
    name: "Language...",
    icon: "language",
    action: () => menuLanguage()
  },
  {
    name: "Timer...",
    icon: "timer",
    action: () => menuTimer()
  },
  {
    name: "Theme...",
    icon: "palette",
    action: () => menuTheme()
  },
  {
    name: "Font Size...",
    icon: "format_size",
    action: () => menuFontSize()
  },
  {
    name: "Word Count...",
    icon: "text_increase",
    action: () => menuWordCount()
  },
  {
    name: "Font Family...",
    icon: "title",
    action: () => menuFontFamily()
  }
];

let time = 0;
let theme = null;
let themeName = null;
let timed = true;
let timeEnd = 10;
let textLength = 20;
let language = null;
let textLanguage = "english";
let fontFamily = "Cousine";
let menuOptions = [];
let menuSelected = 0;
let resultOpen = false;
let fontSize = 24;
let text = "";
let cursorCss;
let rootCss;
let characterWidth;
let cursorPosition = { x: 0, y : 0 };
let visibleLine = 0;
let scrollOffset = 0;
let wordPosition = 0;
let characterPosition = 0;
let characterHeight = 0;
let right = 0;
let typedWords = 0;
let wrong = 0;
let mistakes = 0;
let timer = null;
let menuOpen = false;
let precision = 0;
let wpm = 0;
let timerInterval = null;

await loadLanguage(textLanguage);
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

  if(!resultOpen && !menuOpen) {
    if(!timer) timer = performance.now();
    timeMode();
  }

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
        mistakes++;
      }
      cursorNext();
    }
  }
});

function timeMode() {
  if(timerInterval === null) {
    if(timed) {
      timerElement.textContent = timeEnd;
      timerElement.style.opacity = 1;
      timerInterval = setInterval(checkTimer, 1000);
    }else {
      timerElement.style.opacity = null;
    }
  }
}

async function loadLanguage(name) {
  const request = await fetch(`/languages/${name}.json`);
  const newLanguage = await request.json();
  language = newLanguage;
}

function loadTheme(name) {
  if(theme) document.head.removeChild(theme);
  theme = null;
  themeName = null;
  const linkElement = document.createElement("link");
  linkElement.rel = "stylesheet";
  linkElement.href = `/themes/${name}.css`;
  theme = linkElement;
  themeName = name;
  document.head.appendChild(linkElement);
}

function checkTimer() {
  timerElement.textContent = timeEnd - Math.floor((performance.now() - timer) / 1000);
  if((performance.now() - timer) / 1000 >= timeEnd) {
    timerElement.style.opacity = null;
    openResults(true);
    reset();
    generateText(textLength);
    renderText(text);
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function openResults(action) {
  if(action) {
    precision = right / ((right + wrong) / 100);
    const realPrecision = right / ((right + mistakes) / 100);
    wpm = Math.floor((typedWords / ((performance.now() - timer) / 1000)) * 60);
    
    resultsRightElement.textContent = `Right: ${right}`;
    resultsWrongElement.textContent = `Wrong: ${wrong}`;
    resultsMistakesElement.textContent = `Mistakes: ${mistakes}`;
    resultsPresicionElement.textContent = `Precision: ${Number(precision).toFixed(2)}%`;
    resultsRealPresicionElement.textContent = `Real Precision: ${Number(realPrecision).toFixed(2)}%`;
    resultsTimeElement.textContent = `Time: ${Math.floor((performance.now() - timer) / 1000)}s`;
    resultsWpmElement.textContent = `WPM: ${wpm}`;
    resultsCpmElement.textContent = `CPM: ${Math.floor(((right + wrong) / ((performance.now() - timer) / 1000)) * 60)}`;
    resizeObserver.unobserve(textElement);
    mainElement.classList.add("disapear");
    resultOpen = true;
    setTimeout(() => {
      mainElement.style.display = "none";
      resultsElement.style.display = "flex";
      setTimeout(() => {
        resultsElement.classList.add("appear");
      }, 10);
    }, 200);
  }else {
    resultsElement.classList.remove("appear");
    resultOpen = false;
    timer = null;
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
  const currenlySelected = language;
  const mapIndex = languageList.findIndex(item => item === currenlySelected.name);

  const languageMenu = languageList.map(language => { 
    return { name: language.charAt(0).toUpperCase() + language.slice(1), action: async () => { 
      textLanguage = language; 
      await loadLanguage(textLanguage);
      reset();
      generateText(textLength);
      renderText(text);
      openMenu(false);
      setTimeout(() => loadMenu({options: mainMenu}), 200);
    }}
  });

  if(mapIndex > -1) languageMenu[mapIndex].afterIcon = "check";
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

  const currenlySelected = fontSize;
  const map = [12, 14, 16, 20, 24];
  const mapIndex = map.findIndex(item => item == currenlySelected);

  const fontMenu = [
    { name: "12px", action: () => changeFont(12) },
    { name: "14px", action: () => changeFont(14) },
    { name: "16px", action: () => changeFont(16) },
    { name: "20px", action: () => changeFont(20) },
    { name: "24px", action: () => changeFont(24) }
  ];

  if(mapIndex > -1) fontMenu[mapIndex].afterIcon = "check";
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

  let currenlySelected = textLength;
  const map = [3, 5, 10, 20, 50];
  const mapIndex = map.findIndex(item => item == currenlySelected);

  const countMenu = [
    { name: "3 words", action: () => changeCount(3) },
    { name: "5 words", action: () => changeCount(5) },
    { name: "10 words", action: () => changeCount(10) },
    { name: "20 words", action: () => changeCount(20) },
    { name: "50 words", action: () => changeCount(50) }
  ];

  if(mapIndex > -1) countMenu[mapIndex].afterIcon = "check";
  loadMenu({options: countMenu});
}


function menuTheme() {
  const changeTheme = (newTheme) => {
    loadTheme(newTheme);
    openMenu(false);
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }

  const currenlySelected = themeName;
  const mapIndex = themeList.findIndex(item => item.name === currenlySelected);

  const themeMenu = themeList.map(theme => { 
    return { name: theme.name, action: async () => await changeTheme(theme.name) }
  });

  if(mapIndex > -1) themeMenu[mapIndex].afterIcon = "check";
  loadMenu({options: themeMenu});
}

function menuFontFamily() {
  const changeFont = (newFont) => {
    fontFamily = newFont; 
    document.documentElement.style.setProperty("--font", newFont);
    reset();
    calibrate();
    renderText(text);
    openMenu(false);
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }

  const currenlySelected = fontFamily;
  const map = ["Cousine", "Roboto Mono", "Source Code Pro"];
  const mapIndex = map.findIndex(item => item === currenlySelected);

  const countMenu = [
    { name: "Cousine", action: () => changeFont("Cousine") },
    { name: "Roboto Mono", action: () => changeFont("Roboto Mono") },
    { name: "Source Code Pro", action: () => changeFont("Source Code Pro") }
  ];

  if(mapIndex > -1) countMenu[mapIndex].afterIcon = "check";
  loadMenu({options: countMenu});
}

function menuTimer() {
  const changeCount = (action, newTime) => {
    timeEnd = newTime ? newTime : timeEnd; 
    timed = action;
    reset();
    generateText(textLength);
    renderText(text);
    openMenu(false);
    setTimeout(() => loadMenu({options: mainMenu}), 200);
  }

  let currenlySelected = timeEnd;
  const map = [5, 10, 15, 30, 60, false];
  const mapIndex = map.findIndex(item => item == currenlySelected);

  const countMenu = [
    { name: "5 sconds", action: () => changeCount(true, 5) },
    { name: "10 sconds", action: () => changeCount(true, 10) },
    { name: "15 sconds", action: () => changeCount(true, 15) },
    { name: "30 sconds", action: () => changeCount(true, 30) },
    { name: "1 minute", action: () => changeCount(true, 60) },
    { name: "Off", action: () => changeCount(false) }
  ];

  if(mapIndex > -1) countMenu[mapIndex].afterIcon = "check";
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
      const menuOptionHeader = document.createElement("div");
      if(optionIndex == menuSelected) menuOptionElement.classList.add("selected");
      if(option.icon) {
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-rounded");
        iconElement.classList.add("menuOptionIcon");
        iconElement.textContent = option.icon;
        menuOptionHeader.appendChild(iconElement);
      }
      menuOptionElement.classList.add("menuOption");
      menuOptionTextElement.classList.add("menuOptionText");
      menuOptionHeader.classList.add("menuOptionHeader");
      menuOptionTextElement.textContent = option.name;
      menuOptionHeader.appendChild(menuOptionTextElement);
      menuOptionElement.appendChild(menuOptionHeader);
      menuOptionsElement.appendChild(menuOptionElement);
      if(option.afterIcon) {
        const iconElement = document.createElement("span");
        iconElement.classList.add("material-symbols-rounded");
        iconElement.classList.add("menuOptionAfterIcon");
        iconElement.textContent = option.afterIcon;
        menuOptionElement.appendChild(iconElement);
      }
      menuOptionElement.addEventListener("click", _event => option.action());
      menuOptionElement.addEventListener("mouseenter", _event => {
        const children = [...event.srcElement.parentNode.children];
        menuSelect(children.findIndex(element => element === event.srcElement));
      });
    }
  });

  menuSelect(0);
}

function reset() {
  if(timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timer = null;
    timerElement.style.opacity = null;
  }
  typedWords = 0;
  right = 0;
  wrong = 0;
  mistakes = 0;
  wordPosition = 0;
  characterPosition = 0;
  updateView({ force: true });
}

function calibrate() {
  characterHeight = 0;
  const canvas = new OffscreenCanvas(100, 100);
  const cssRules = document.styleSheets[1].cssRules;
  const context = canvas.getContext("2d");
  context.font = `${fontSize}px ${fontFamily}`;
  characterWidth = context.measureText("a").width;
  for(let ruleIndex = 0; ruleIndex < cssRules.length; ruleIndex++) {
    const cssRule = cssRules.item(ruleIndex);
    if(cssRule.selectorText && cssRule.selectorText === ".char") {
      cssRule.style.width = `${characterWidth}px`;
      cssRule.style.fontSize = `${fontSize}px`;
    }

    if(cssRule.selectorText && cssRule.selectorText === ":root") {
      rootCss = cssRule;
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
  const words = language.words;
  for(let index = 0; index < length; index++) {
    const randomNumber = Math.floor(Math.random() * words.length);
    text += index != length - 1 ? `${words[randomNumber]} ` : words[randomNumber];
  }
}

function cursorNext(times = 1) {
  for(let index = 0; index < times; index++) {
  characterPosition++;
    if(characterPosition >= textElement.children[wordPosition].children.length) {
      characterPosition = 0;
      wordPosition++;
      typedWords++;
      if(wordPosition >= textElement.children.length) { 
        openResults(true);
        reset();
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
