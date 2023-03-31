const viewElement = document.querySelector(".view");

const map = [];
const text = "This is some text. This is also some text but it is a bit longer than it the first one! So this right here is a small typing test build by Mkoys wtf";
let position = 0;

const cursorPosition = { x: 0, y: 0 };
const cursorElement = document.createElement("div");
cursorElement.classList.add("cursor");
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

document.addEventListener("keydown", (event) => {
	event.preventDefault();
	const key = event.key;
	const backspace = key === "Backspace" ? true : false;

	const previousCharacterElement = map[position];

	if(key === "Shift" || key === "Tab" || key === "Alt" || key === "Control" || key === "Delete") { return }

	if(!backspace) {
		if(key === text[position]) {
			previousCharacterElement.classList.add("right");
		}else {
			previousCharacterElement.classList.add("wrong");
		}

		previousCharacterElement.textContent = key;
	}

	position += backspace ? -1 : 1;

	if(map.length == position || position < 0) { position = 0	}

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

	if (cursorPosition.y != offsetTop) {
		cursorPosition.y = offsetTop;
		cursorPosition.x = backspace ? offsetLeft : 0;
		cursorElement.style.top = `${cursorPosition.y}px`;
		cursorElement.style.left = `${cursorPosition.x}px`;
	}
});
