const can = document.getElementById('puzzleCanvas');
const ctx = can.getContext('2d');
const pieceSize = 100; // ピースのサイズ
let pieces = [];
let movingPiece = null;

const img = new Image();
img.src = 'img/deer.png'; // ここに画像のパスを指定してください

// ピースのオブジェクトを定義
class Piece {
    constructor(x, y, srcX, srcY) {
        this.X = x;
        this.Y = y;
        this.srcX = srcX;
        this.srcY = srcY;
    }

    IsClick(x, y) {
        return x > this.X && x < this.X + pieceSize && y > this.Y && y < this.Y + pieceSize;
    }

    draw() {
        ctx.drawImage(img, this.srcX, this.srcY, pieceSize, pieceSize, this.X, this.Y, pieceSize, pieceSize);
    }
}

// ピースをシャッフルする関数
function shufflePieces() {
    for (let i = 0; i < pieces.length; i++) {
        const randIndex = Math.floor(Math.random() * pieces.length);
        const tempX = pieces[i].X;
        const tempY = pieces[i].Y;
        pieces[i].X = pieces[randIndex].X;
        pieces[i].Y = pieces[randIndex].Y;
        pieces[randIndex].X = tempX;
        pieces[randIndex].Y = tempY;
    }
    drawAll();
}

// すべてのピースを描画する関数
function drawAll() {
    ctx.clearRect(0, 0, can.width, can.height);
    pieces.forEach(piece => piece.draw());
}

// イベントリスナー
document.getElementById('shuffleButton').addEventListener('click', shufflePieces);

window.addEventListener('touchstart', (ev) => {
    ev.preventDefault();

    if (ev.touches.length != 1) {
        enableScrollOnTouchMove(ev, true);
        return;
    }

    let x = ev.touches[0].pageX;
    let y = ev.touches[0].pageY;

    const rect = can.getBoundingClientRect();
    let ps = pieces.filter(piece => piece.IsClick(x - rect.left, y - rect.top));

    if (ps.length == 0) {
        enableScrollOnTouchMove(ev, true);
        return;
    }

    movingPiece = ps[ps.length - 1];
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length != 1) return;

    if (movingPiece != null) {
        const rect = can.getBoundingClientRect();
        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        let newX = x - rect.left - pieceSize * 0.75;
        let newY = y - rect.top - pieceSize * 0.75;

        if (newX < -pieceSize / 2) newX = -pieceSize / 2;
        if (newY < -pieceSize / 2) newY = -pieceSize / 2;
        if (newX > can.width - pieceSize / 2) newX = can.width - pieceSize / 2;
        if (newY > can.height - pieceSize * 0.75) newY = can.height - pieceSize * 0.75;

        movingPiece.X = newX;
        movingPiece.Y = newY;

        drawAll();
    }
});

window.addEventListener('touchend', (e) => {
    if (movingPiece != null) {
        let col = Math.round(movingPiece.X / pieceSize);
        let row = Math.round(movingPiece.Y / pieceSize);

        if (col < 0) col = 0;
        if (row < 0) row = 0;

        if (row < 4 && col < 4) {
            let ps = pieces.filter(_ => _.X == col * pieceSize && _.Y == row * pieceSize);
            if (ps.length == 0) {
                if (Math.abs(col * pieceSize - movingPiece.X) < 20 && Math.abs(row * pieceSize - movingPiece.Y) < 20) {
                    movingPiece.X = col * pieceSize;
                    movingPiece.Y = row * pieceSize;
                }
            }
        }

        pieces = pieces.filter(piece => piece != movingPiece);
        pieces.push(movingPiece);
        movingPiece = null;

        drawAll();
    }
    enableScrollOnTouchMove(e, false);
});

// スクロールの制御
function disableScroll(e) {
    e.preventDefault();
}

function enableScrollOnTouchMove(e, enable) {
    if (!enable)
        window.addEventListener('touchmove', disableScroll, { passive: false });
    else
        window.removeEventListener('touchmove', disableScroll);
}

// イメージが読み込まれた後にピースを作成
img.onload = () => {
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            pieces.push(new Piece(x * pieceSize, y * pieceSize, x * pieceSize, y * pieceSize));
        }
    }
    shufflePieces();
};
