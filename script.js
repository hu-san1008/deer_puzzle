// script.js

const rows = 5; // パズルの行数
const cols = 5; // パズルの列数
const imageSrc = 'deer.png'; // 画像のパス

const container = document.getElementById('puzzle-container');

const pieces = [];
let shuffledPieces = [];

// 画像のロード
const image = new Image();
image.src = imageSrc;
image.onload = () => {
    createPuzzlePieces(image);
    shuffleAndDisplayPieces();
    addDragAndDrop();
};

function createPuzzlePieces(image) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const pieceWidth = containerWidth / cols;
    const pieceHeight = containerHeight / rows;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const canvas = document.createElement('canvas');
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            canvas.classList.add('puzzle-piece');
            const context = canvas.getContext('2d');
            context.drawImage(
                image,
                col * (image.width / cols),
                row * (image.height / rows),
                image.width / cols,
                image.height / rows,
                0,
                0,
                pieceWidth,
                pieceHeight
            );
            pieces.push({canvas, originalIndex: row * cols + col});
        }
    }
}

function shuffleAndDisplayPieces() {
    shuffledPieces = pieces.sort(() => Math.random() - 0.5);
    shuffledPieces.forEach((piece, index) => {
        piece.canvas.dataset.index = index;
        container.appendChild(piece.canvas);
    });
}

function addDragAndDrop() {
    let dragStartIndex;

    const dragStart = (e) => {
        dragStartIndex = +e.target.dataset.index;
    };

    const dragOver = (e) => {
        e.preventDefault();
    };

    const drop = (e) => {
        const dragEndIndex = +e.target.dataset.index;
        swapPieces(dragStartIndex, dragEndIndex);
        e.target.classList.remove('drag-over');
    };

    const dragEnter = (e) => {
        e.preventDefault();
        e.target.classList.add('drag-over');
    };

    const dragLeave = (e) => {
        e.target.classList.remove('drag-over');
    };

    const touchStart = (e) => {
        dragStartIndex = +e.target.dataset.index;
    };

    const touchMove = (e) => {
        e.preventDefault();
    };

    const touchEnd = (e) => {
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        if (dropTarget && dropTarget.classList.contains('puzzle-piece')) {
            const dragEndIndex = +dropTarget.dataset.index;
            swapPieces(dragStartIndex, dragEndIndex);
        }
    };

    shuffledPieces.forEach((piece, index) => {
        const canvas = piece.canvas;
        canvas.dataset.index = index;
        canvas.draggable = true;
        canvas.addEventListener('dragstart', dragStart);
        canvas.addEventListener('dragover', dragOver);
        canvas.addEventListener('drop', drop);
        canvas.addEventListener('dragenter', dragEnter);
        canvas.addEventListener('dragleave', dragLeave);

        canvas.addEventListener('touchstart', touchStart);
        canvas.addEventListener('touchmove', touchMove);
        canvas.addEventListener('touchend', touchEnd);
    });
}

function swapPieces(fromIndex, toIndex) {
    const temp = shuffledPieces[fromIndex];
    shuffledPieces[fromIndex] = shuffledPieces[toIndex];
    shuffledPieces[toIndex] = temp;

    container.innerHTML = '';
    shuffledPieces.forEach((piece, index) => {
        piece.canvas.dataset.index = index;
        container.appendChild(piece.canvas);
    });

    checkWin();
}

function checkWin() {
    const isWin = shuffledPieces.every((piece, index) => piece.originalIndex === index);
    if (isWin) {
        setTimeout(() => {
            alert('Congratulations! You solved the puzzle!');
        }, 100);
    }
}
