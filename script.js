const puzzleWidth = 480;
const puzzleHeight = 480;
const pieceSize = 80;
const colMax = puzzleWidth / pieceSize;
const rowMax = puzzleHeight / pieceSize;

let can = document.getElementById('canvas');
let ctx = can.getContext('2d');

can.width = puzzleWidth;
can.height = puzzleHeight;

let pieces = [];
let movingPiece = null;
let oldX, oldY;

class Piece {
    constructor(image, x, y, originalCol, originalRow) {
        this.image = image;
        this.X = x;
        this.Y = y;
        this.OriginalCol = originalCol;
        this.OriginalRow = originalRow;
    }

    draw() {
        ctx.drawImage(
            this.image,
            this.OriginalCol * pieceSize, 
            this.OriginalRow * pieceSize, 
            pieceSize, 
            pieceSize, 
            this.X, 
            this.Y, 
            pieceSize, 
            pieceSize
        );
    }

    check() {
        return (
            this.X >= this.OriginalCol * pieceSize - pieceSize / 2 &&
            this.X <= this.OriginalCol * pieceSize + pieceSize / 2 &&
            this.Y >= this.OriginalRow * pieceSize - pieceSize / 2 &&
            this.Y <= this.OriginalRow * pieceSize + pieceSize / 2
        );
    }
}

function createSourceImage(callback) {
    let img = new Image();
    img.onload = () => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = puzzleWidth;
        canvas.height = puzzleHeight;
        ctx.drawImage(img, 0, 0, puzzleWidth, puzzleHeight);
        callback(canvas);
    };
    img.src = 'deer.png';
}

function createPiece(image, col, row) {
    let piece = new Piece(image, col * pieceSize, row * pieceSize, col, row);
    pieces.push(piece);
}

function initializePieces(image) {
    pieces = [];
    for (let row = 0; row < rowMax; row++) {
        for (let col = 0; col < colMax; col++) {
            createPiece(image, col, row);
        }
    }
    shuffle();
}

function drawAll() {
    ctx.clearRect(0, 0, can.width, can.height);
    pieces.forEach(piece => piece.draw());
}

window.addEventListener('mousedown', (ev) => {
    let canvasRect = can.getBoundingClientRect();
    let x = ev.clientX - canvasRect.left;
    let y = ev.clientY - canvasRect.top;

    let ps = pieces.filter(p => 
        x >= p.X && x <= p.X + pieceSize && 
        y >= p.Y && y <= p.Y + pieceSize
    );

    if (ps.length === 0) return;
    movingPiece = ps.pop();

    oldX = movingPiece.X;
    oldY = movingPiece.Y;

    // 動かしているピースを手前に描画するため、いったん配列から削除して最後に追加する
    pieces = pieces.filter(piece => piece !== movingPiece);
    pieces.push(movingPiece);
});

window.addEventListener('mousemove', (ev) => {
    if (movingPiece != null) {
        const canvasRect = can.getBoundingClientRect();
        movingPiece.X = ev.clientX - canvasRect.left - pieceSize / 2;
        movingPiece.Y = ev.clientY - canvasRect.top - pieceSize / 2;

        drawAll();
    }
});

window.addEventListener('mouseup', (ev) => {
    if (movingPiece == null) return;

    // ドロップ時の処理
    if (movingPiece.check()) {
        // 正しい位置に置かれた場合、座標をスナップ
        movingPiece.X = movingPiece.OriginalCol * pieceSize;
        movingPiece.Y = movingPiece.OriginalRow * pieceSize;
    } else {
        // 正しい位置でない場合、元の位置に戻す
        movingPiece.X = oldX;
        movingPiece.Y = oldY;
    }

    drawAll();
    movingPiece = null;

    // パズルが完成しているかチェック
    if (checkCompletion()) {
        alert("パズル完成！");
    }
});

function shuffle() {
    // ピースの位置をランダムに配置
    pieces.forEach(piece => {
        let x = Math.floor(Math.random() * colMax) * pieceSize;
        let y = Math.floor(Math.random() * rowMax) * pieceSize;
        piece.X = x;
        piece.Y = y;
    });
    drawAll();
}

function checkCompletion() {
    // 全てのピースが正しい位置にあるか確認
    return pieces.every(piece => piece.check());
}

createSourceImage(initializePieces);
