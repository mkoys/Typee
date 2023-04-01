import words from "./words.js";

const viewElement = document.querySelector(".view");
const couterElement = document.querySelector(".counter");
const languageTextElement = document.querySelector(".languageText");
const languageElement = document.querySelector(".language");
const iconElement = document.querySelector(".icon");
const headingElement = document.querySelector(".heading");

const map = [];
const language = "english";
const wordNumber = 30;
let text = "";
let position = 0;
let seed = 0;
const ignoreKeys = ["Shift", "Tab", "Alt", "Control", "Delete", "Enter", "CapsLock", "End", "Home", "Insert", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Pause", "ScrollLock", "PrintScreen", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", ];

languageTextElement.textContent = language;

function randomNumberInRange(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const randomNumber = x - Math.floor(x);
  return Math.floor(randomNumber * (max - min + 1) + min);
}

for(let index = 0; index < wordNumber; index++) {
	let randomIndex;
	if(seed) {
		randomIndex = randomNumberInRange(seed * index, 0, words[language].length);
	}else {
		randomIndex = Math.floor(Math.random() * words[language].length) -1;
	}
	if(index != wordNumber - 1) { text += words[language][randomIndex] + " " }
}

const cursorPosition = { x: 0, y: 0 };
const cursorElement = document.createElement("div");
cursorElement.classList.add("cursor");
cursorElement.style.left = 0;
viewElement.prepend(cursorElement);
const textWidth = 14;

renderText(text, { words: true });

function renderText(text, options = {}) {
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

function checkScroll(resolve = () => {}) {
	const offsetTop = map[position].offsetTop;

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

const resizeObserver = new ResizeObserver(_ => {
	const offsetLeft = map[position].offsetLeft;
	const offsetTop = map[position].offsetTop;
	checkScroll();
	updateCursor(offsetLeft, offsetTop);
});

resizeObserver.observe(viewElement);

document.addEventListener("keydown", (event) => {
	//	event.preventDefault();
	const key = event.key;
	const backspace = key === "Backspace" ? true : false;

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

	if(map.length == position || position < 0) { position = 0	}

	if(map[position].parentNode.classList.contains("word")) {
    languageElement.style.opacity = 0;
    languageElement.style.visibility = "hidden";
		couterElement.textContent = `${parseInt(map[position].parentNode.getAttribute("index")) + 1}/${viewElement.children.length}`;
		couterElement.style.opacity = 1;
    iconElement.style.color = "var(--none-color)";
    headingElement.style.color = "var(--none-color)";
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
