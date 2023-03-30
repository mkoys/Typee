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
		const characterElement = document.createElement("p");
		characterElement.classList.add("character");
		characterElement.textContent = character;
		map.push(characterElement);

		if (options.words) {
			if (!wordElement) {
				wordElement = document.createElement("div");
				wordElement.classList.add("word");
				wordElement.setAttribute("index", wordIndex);
				wordIndex++;
			}

			if (character === " ") {
				wordElement.appendChild(characterElement);
				viewElement.appendChild(wordElement);
				wordElement = false;
			} else {
				wordElement.appendChild(characterElement);
			}
		} else {
			viewElement.appendChild(characterElement);
		}
	}

	if(wordElement) {
		viewElement.appendChild(wordElement);
		wordElement = false;
	}
}

document.addEventListener("keydown", (event) => {
	position++;
	
	if(map.length == position) {
		position = 0;
	}

	console.log(map[position]);
	const offsetTop = map[position].offsetTop;
	cursorPosition.x += 13;
	cursorElement.style.left = `${cursorPosition.x}px`;

	if (cursorPosition.y != offsetTop) {
		cursorPosition.y = offsetTop;
		cursorPosition.x = 0;
		cursorElement.style.top = `${cursorPosition.y}px`;
		cursorElement.style.left = `${cursorPosition.x}px`;
	}
});
