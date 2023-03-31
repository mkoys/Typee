const viewElement = document.querySelector(".view");
const couterElement = document.querySelector(".counter");

const map = [];
const text = "This is some text. This is also some text but it is a bit longer than it the first one! So this right here is a small typing test build by Mkoys This is some text. This is also some text but it is a bit longer than it the first one! So this right here is a small typing test build by Mkoys ";
let position = 0;
const ignoreKeys = ["Shift", "Tab", "Alt", "Control", "Delete", "Enter", "CapsLock", "End", "Home", "Insert", "PageUp", "PageDown"];

const cursorPosition = { x: 0, y: 0 };
const cursorElement = document.createElement("div");
cursorElement.classList.add("cursor");
cursorElement.style.left = 0;
viewElement.prepend(cursorElement);

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
		couterElement.textContent = `${parseInt(map[position].parentNode.getAttribute("index")) + 1}/${viewElement.children.length}`;
		couterElement.style.opacity = 1;
	}

	if(backspace) {
		map[position].textContent = text[position];
		map[position].classList.remove("right", "wrong");
	}

	const currentCharacterElement = map[position];
	const offsetTop = currentCharacterElement.offsetTop;
	const offsetLeft = currentCharacterElement.offsetLeft;
	cursorPosition.x += backspace ? -13 : 13;

	if(cursorPosition.x < 0) { cursorPosition.x = 0 }

	cursorElement.style.left = `${cursorPosition.x}px`;

	checkScroll(() => {
		updateCursor(backspace ? offsetLeft : 0, offsetTop)
	});
});
