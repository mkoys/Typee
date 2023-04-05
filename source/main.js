import words from "./words.js";

const viewElement = document.querySelector(".view");
const counterElement = document.querySelector(".counter");
const languageTextElement = document.querySelector(".languageText");
const languageElement = document.querySelector(".language");
const iconElement = document.querySelector(".icon");
const headingElement = document.querySelector(".heading");
const popupElement = document.querySelector(".popup");
const popupBoxElement = document.querySelector(".popupBox");
const searchInputElement = document.querySelector(".searchInput");
const menuElement = document.querySelector(".menu");

const map = [];
const languages = Object.keys(words);
const ignoreKeys = ["Shift", "Alt", "Control", "Delete", "Enter", "CapsLock", "Home", "Insert", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Pause", "ScrollLock", "PrintScreen", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "Meta", "Dead" ];
const wordsOptions = [
	{icon: "done", text: 10, action: () => {setNumberOfWords(10); setMenu(false)}},
	{icon: "done", text: 20, action: () => {setNumberOfWords(20); setMenu(false)}},
	{icon: "done", text: 30, action: () => {setNumberOfWords(30); setMenu(false)}},
	{icon: "done", text: 50, action: () => {setNumberOfWords(50); setMenu(false)}},
	{icon: "done", text: 100, action: () => {setNumberOfWords(100); setMenu(false)}}
];
const themeOptions = [
	{icon: "done", text: "8008", action: () => {setTheme("8008");setMenu(false)}},
	{icon: "done", text: "aurora", action: () => {setTheme("aurora");setMenu(false)}},
	{icon: "done", text: "darling", action: () => {setTheme("darling");setMenu(false)}}
];
const prefrenceOptions = [
	{icon: "translate", text: "Language", action: () => setMenu(true, languageOptions, true)},
	{icon: "format_bold", text: "Words", action: () => setMenu(true, wordsOptions, true)},
	{icon: "format_paint", text: "Theme", action: () => setMenu(true, themeOptions, true)}
]; 

let wordNumber = 20;
let languageOptions = [];
let language = "english";
let theme = localStorage.getItem("theme"); 
let menu = false;
let menuFocus = false;
let menuOptions;
let text = "";
let position = 0;
let seed = 0;
let searchFilter;

popupBoxElement.style.visibility = "hidden";
popupBoxElement.style.opacity = 0;
languageTextElement.textContent = language;

const cursorPosition = { x: 0, y: 0 };
const cursorElement = document.createElement("div");
cursorElement.classList.add("cursor");
cursorElement.style.left = 0;
const textWidth = 14;

renderText(generateText(), { words: true });
setTheme(theme);
setNumberOfWords(wordNumber);

const resizeObserver = new ResizeObserver(_ => {
	const offsetLeft = map[position].offsetLeft;
	const offsetTop = map[position].offsetTop;
	checkScroll();
	updateCursor(offsetLeft, offsetTop);
});

resizeObserver.observe(viewElement);

popupBoxElement.addEventListener("click", () => setMenu(false, null, true));
popupElement.addEventListener("click", (event) => event.stopPropagation());
languageElement.addEventListener("click", () => setMenu(true, languageOptions, true));

for(let index = 0; index < languages.length; index++) {
	languageOptions[index] = {};
	languageOptions[index].icon = "done";
	languageOptions[index].text = languages[index];
	if(languages[index] !== language) languageOptions[index].invisible = true;
	languageOptions[index].action = () => {
		selectLanguage(languageOptions[index]);
	};
}

searchInputElement.addEventListener("input", (event) => {
	let value = event.target.value;

	if(value.length > 0) {
		searchFilter = new RegExp(value, "i");
	}else {
		searchFilter = false;
	}
	
	setMenu(menu, null);
	updateMenuFocus(false, false, true);
});

function setNumberOfWords(number) {
	for(const option of wordsOptions) {
		if(option.text === number) {
			option.invisible = false;
		}else {
			option.invisible = true;
		}
	}

	wordNumber = number; 
	reset(); 
}

function setTheme(newTheme) {
	theme = newTheme;
	let themeObject = {};

	localStorage.setItem("theme", theme);
	
	for(const option of themeOptions) {
		if(option.text === theme) {
			option.invisible = false;
		}else {
			option.invisible = true;
		}
	}

	switch(theme) {
		case "8008":
			themeObject = {
				'--main-color': '#f44c7f',
				'--side-color': 'white',
				'--none-color': '#939eae',
				'--back-color': '#333a45',
				'--right-color': 'white',
				'--wrong-color': '#da3333',
			}
			break;
		case "aurora": 
				themeObject = {
				'--main-color': '#00e980',
				'--side-color': 'white',
				'--none-color': '#245c69',
				'--back-color': '#011926',
				'--right-color': 'white',
				'--wrong-color': '#b94da1',
			}
		break;
		case "darling": 
				themeObject = {
				'--main-color': 'white',
				'--side-color': 'white',
				'--none-color': '#a30000',
				'--back-color': '#fec8cd',
				'--right-color': 'white',
				'--wrong-color': '#2e7dde',
			}
		break;

		default:
			break;
	}

	const themeObjectKeys = Object.keys(themeObject);

	themeObjectKeys.forEach(rule => document.documentElement.style.setProperty(rule, themeObject[rule]));
}

function randomNumberInRange(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const randomNumber = x - Math.floor(x);
  return Math.floor(randomNumber * (max - min + 1) + min);
}

function updateMenuFocus(adder, setter = false, reset = false, remove = false) {
	if(reset) {
		if(menuFocus !== false && menuElement.children[menuFocus]) menuElement.children[menuFocus].classList.remove("focus");
		menuFocus = remove === false ? 0 : false;
		if(menuElement.children[menuFocus]) menuElement.children[menuFocus].classList.add("focus");
		return;
	}

	if(menuFocus === false && setter === false) {
		menuFocus = adder > 0 ? 0 : menuElement.children.length - 1;
		if(menuElement.children[menuFocus]) menuElement.children[menuFocus].classList.add("focus");
	}else {
		if(menuFocus !== false && menuElement.children[menuFocus]) menuElement.children[menuFocus].classList.remove("focus");
		if(setter !== false) {
			menuFocus = setter;
		}else {
			menuFocus += adder;
		}
		if(menuFocus < 0) menuFocus = menuElement.children.length - 1;
		if(menuElement.children.length <= menuFocus) menuFocus = 0;
		if(menuElement.children[menuFocus]) menuElement.children[menuFocus].classList.add("focus");
	}
}

function setMenu(value, options, clear) {
	menu = value;
	
	if(clear) searchFilter = false;

	if(options) menuOptions = options;

	if(!options) options = menuOptions;

		if(menu) {
		menuElement.innerHTML = "";

		if(options) {
			for(let elementIndex = 0; elementIndex < options.length; elementIndex++) {
				const option = options[elementIndex];
				const icon = option.icon;
				const text = option.text;
				const optionTextElement = document.createElement("p");
				const optionIconElement = document.createElement("span");
				const optionElement = document.createElement("div");

				optionIconElement.classList.add("optionIcon", "material-symbols-outlined");
				optionTextElement.classList.add("optionText");
				optionElement.classList.add("menuOption");

				optionIconElement.textContent = icon;
				optionTextElement.textContent = text;

				if(option.invisible) {
					optionIconElement.style.visibility = "hidden";
				}

				optionElement.addEventListener("mouseenter", () => updateMenuFocus(null, elementIndex));
				optionElement.addEventListener("mouseleave", () => updateMenuFocus(false, false, true, true));

				optionElement.addEventListener("click", () => option.action(option));

				optionElement.appendChild(optionIconElement);
				optionElement.appendChild(optionTextElement);
				if(searchFilter) {
					if(searchFilter.test(option.text)) {
						menuElement.appendChild(optionElement);
					}	
				}else {
					menuElement.appendChild(optionElement);
				}
			}
		}

		popupBoxElement.style.visibility = "visible";
		popupBoxElement.style.opacity = 1;
	}else {
		popupBoxElement.style.visibility = "hidden";
		popupBoxElement.style.opacity = 0;
	}

	if(clear) {
		searchInputElement.value = "";
		updateMenuFocus(false, false, true);
	}

	setTimeout(() => searchInputElement.focus(), 100)
}

function selectLanguage(target) {
	for(let index = 0; index < languageOptions.length; index++) {
		if(languageOptions[index].text === language) {
			 languageOptions[index].invisible = true;
		}

		if(languageOptions[index].text === target.text) { 
			languageOptions[index].invisible = false;
		}
	}
	
	language = target.text;
	languageTextElement.textContent = language;
	setMenu(false, null, true);
	reset();
}

function generateText() {
	text = "";
	for(let index = 0; index < wordNumber; index++) {
		let randomIndex;
		if(seed) {
			randomIndex = randomNumberInRange(seed * index, 0, words[language].length);
		}else {
			randomIndex = Math.floor(Math.random() * words[language].length) -1;
		}
		if(index != wordNumber - 1) { text += words[language][randomIndex] + " " }
	}

	return text;
}

function renderText(text, options = {}) {
	viewElement.innerHTML = "";
	viewElement.appendChild(cursorElement);
	map.length = 0;
	let wordIndex = 0;
	let wordElement = false;
	for (const character of text) {
		const currentCharacterElement = document.createElement("p");
		currentCharacterElement.classList.add("character");
		currentCharacterElement.textContent = character;
		map.push(currentCharacterElement);

		if (options.words) {
			if (!wordElement) {
				wordElement = document.createElement("div");
				wordElement.classList.add("word");
				wordElement.setAttribute("index", wordIndex);
				wordIndex++;
			}

			if (character === " ") {
				wordElement.appendChild(currentCharacterElement);
				viewElement.appendChild(wordElement);
				wordElement = false;
			} else {
				wordElement.appendChild(currentCharacterElement);
			}
		} else {
			viewElement.appendChild(currentCharacterElement);
		}
	}

	if(wordElement) {
		viewElement.appendChild(wordElement);
		wordElement = false;
	}
}

function checkScroll(resolve = () => {}, reset = false) {
	const offsetTop = map[position].offsetTop;

	if(reset) {
		viewElement.scrollTop = 0;
		return;
	}

	if (cursorPosition.y != offsetTop) {
		if(offsetTop >= 56 || offsetTop < cursorPosition.y) {
			viewElement.scrollTop = offsetTop - 28;
		}

		resolve();
	}
}

function updateCursor(x, y) {
	cursorPosition.x = x;
	cursorPosition.y = y;
	cursorElement.style.top = `${cursorPosition.y}px`;
	cursorElement.style.left = `${cursorPosition.x}px`;	
}



function focusLogo(value) {
	if(value) {
		iconElement.style.color = "var(--main-color)"; 
		headingElement.style.color = "var(--right-color)";
	}else {
		iconElement.style.color = "var(--none-color)";
		headingElement.style.color = "var(--none-color)";
	}
}

function reset() {
	position = 0;
	counterElement.textContent = `${parseInt(map[position].parentNode.getAttribute("index")) + 1}/${viewElement.children.length}`;
	counterElement.style.opacity = 0;
	languageElement.style.opacity = 1;
	languageElement.style.visibility = "visible";
	cursorElement.style.animationIterationCount = "infinite";

	updateCursor(0, 0);
	focusLogo(true);
	checkScroll(() => {}, true);
	renderText(generateText(), {words: true});	
}

document.addEventListener("keydown", (event) => {
	const key = event.key;
	const backspace = key === "Backspace" ? true : false;

	if(key === "Tab" && !menu) {
		event.preventDefault();
		return reset();
	}

	if(key === "Escape") return setMenu(!menu, prefrenceOptions, true);
	if(menu) {
		switch(key) {
			case "ArrowDown": 
				updateMenuFocus(1);
			break;
			case "ArrowUp":
				updateMenuFocus(-1);
			break;
			case "Enter":
				menuElement.children[menuFocus].click();
			break;
		default:
			break;
		}
		
		return;
	};

	const previousCharacterElement = map[position];
	
	const ignoreKey = ignoreKeys.findIndex(item => item === key);

	if(ignoreKey > -1) { return }

	if(!backspace) {
		if(key === text[position]) {
			previousCharacterElement.classList.add("right");
		}else {
			previousCharacterElement.classList.add("wrong");
		}
		
		if(key === " ") {
			const wrong = previousCharacterElement.classList.contains("wrong");
			previousCharacterElement.textContent = wrong ? "_" : key;
		}else {
			previousCharacterElement.textContent = key;
		}
	}

	position += backspace ? -1 : 1;

	if(position == map.length) {
		reset();
		return;
	}

	if(position < 0) { position = 0	}

	if(map[position].parentNode.classList.contains("word")) {
    languageElement.style.opacity = 0;
    languageElement.style.visibility = "hidden";
		counterElement.textContent = `${parseInt(map[position].parentNode.getAttribute("index")) + 1}/${viewElement.children.length}`;
		counterElement.style.opacity = 1;
		cursorElement.style.animationIterationCount = 1;
		focusLogo(false);
	}

	if(backspace) {
		map[position].textContent = text[position];
		map[position].classList.remove("right", "wrong");
	}

	const currentCharacterElement = map[position];
	const offsetTop = currentCharacterElement.offsetTop;
	const offsetLeft = currentCharacterElement.offsetLeft;
	cursorPosition.x += backspace ? -textWidth : textWidth;

	if(cursorPosition.x < 0) { cursorPosition.x = 0 }

	cursorElement.style.left = `${cursorPosition.x}px`;

	checkScroll(() => {
		updateCursor(backspace ? offsetLeft : 0, offsetTop)
	});
});
