const pieceSize = 80;
let can = document.getElementById('can');
let ctx = can.getContext('2d');
let pieces = [];
let colMax = 0;
let rowMax = 0;
let movingPiece = null;
let oldX = 0;
let oldY = 0;

class Piece {
    constructor(image, outline, x, y) {
        this.Image = image;
        this.Outline = outline;
        this.X = x;
        this.Y = y;
        this.OriginalCol = Math.round(x / pieceSize);
        this.OriginalRow = Math.round(y / pieceSize);
    }

    Draw() {
        ctx.drawImage(this.Image, this.X, this.Y);
        ctx.drawImage(this.Outline, this.X, this.Y);
    }

    IsClick(x, y) {
        let s = pieceSize / 4;
        if (x < this.X + s) return false;
        if (this.X + s * 5 < x) return false;
        if (y < this.Y + s) return false;
        if (this.Y + s * 5 < y) return false;
        return true;
    }
}

window.onload = async () => {
    let sourceImage = await createSourceImage();
    colMax = Math.floor(sourceImage.width / pieceSize);
    rowMax = Math.floor(sourceImage.height / pieceSize);
    can.width = colMax * pieceSize * 2;
    can.height = rowMax * pieceSize * 2;

    pieces = [];
    for (let row = 0; row < rowMax; row++) {
        for (let col = 0; col < colMax; col++) {
            let image = await createPiece(sourceImage, row, col, rowMax, colMax, false);
            let outline = await createPiece(sourceImage, row, col, rowMax, colMax, true);
            pieces.push(new Piece(image, outline, col * pieceSize, row * pieceSize));
        }
    }
    drawAll();
}

async function createSourceImage() {
    let image = new Image();
    return await new Promise(resolve => {
        image.src = 'img/deer.png';
        image.onload = () => resolve(image);
    });
}

async function createPiece(sourceImage, row, col, rowMax, colMax, outlineOnly) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let s = pieceSize / 4;
    canvas.width = s * 6;
    canvas.height = s * 6;

    ctx.beginPath();
    ctx.moveTo(s, s);
    ctx.lineTo(s * 2, s);

    if (row > 0) {
        if ((row + col) % 2 == 0)
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, false);
        else
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, true);
    }

    ctx.lineTo(s * 5, s);
    ctx.lineTo(s * 5, s * 2);

    if (col < colMax - 1) {
        if ((row + col) % 2 == 1)
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, false);
        else
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, true);
    }

    ctx.lineTo(s * 5, s * 5);
    ctx.lineTo(s * 4, s * 5);

    if (row < rowMax - 1) {
        if ((row + col) % 2 == 0)
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, false);
        else
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, true);
    }

    ctx.lineTo(s, s * 5);
    ctx.lineTo(s, s * 4);

    if (col > 0) {
        if ((row + col) % 2 == 1)
            ctx.arc(s, s * 3, s, Math.PI / 2, Math.PI * 3 / 2, false);
        else
            ctx.arc(s, s * 3, s, Math.PI / 2, Math.PI * 3 / 2, true);
    }

    ctx.closePath();
    ctx.clip();

    if (outlineOnly)
        ctx.stroke();
    else
        ctx.drawImage(sourceImage, s - s * 4 * col, s - s * 4 * row);

    let base64 = canvas.toDataURL("image/png", 1);
    canvas.remove();
    return await createImage(base64);
}

async function createImage(base64) {
    let image = new Image();
    return await new Promise(resolve => {
        image.src = base64;
        image.onload = () => resolve(image);
    });
}

function drawAll() {
    ctx.clearRect(0, 0, can.width, can.height);
    let s = pieceSize / 4;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(s, s, pieceSize * colMax, pieceSize * rowMax);

    pieces.forEach(piece => piece.Draw());

    if (movingPiece != null) movingPiece.Draw();
}

// PC用のイベントリスナー
window.addEventListener('mousedown', (ev) => {
    if (ev.button != 0) return;
    const rect = can.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    movingPiece = pieces.find(piece => piece.IsClick(x, y));
    if (movingPiece) {
        oldX = movingPiece.X;
        oldY = movingPiece.Y;
    }
});

window.addEventListener('mousemove', (ev) => {
    if (!movingPiece) return;
    const rect = can.getBoundingClientRect();
    movingPiece.X = ev.clientX - rect.left - pieceSize / 2;
    movingPiece.Y = ev.clientY - rect.top - pieceSize / 2;
    drawAll();
});

window.addEventListener('mouseup', () => {
    movingPiece = null;
    drawAll();
});

// スマホ用のイベントリスナー
function disableScroll(e) {
    e.preventDefault();
}

function enableScrollOnTouchMove(e, enable) {
    if (!enable)
        window.addEventListener('touchmove', disableScroll, { passive: false });
    else
        window.removeEventListener('touchmove', disableScroll);
}

window.addEventListener('touchstart', (ev) => {
    ev.preventDefault(); // デフォルトイベントをキャンセル

    if (ev.touches.length != 1) { // 触れている指が1でない場合
        enableScrollOnTouchMove(ev, true); // フリックでスクロールできるようにする
        return;
    }

    let x = ev.touches[0].pageX; // 触れている指に関する情報を取得
    let y = ev.touches[0].pageY; // 触れている指に関する情報を取得

    const rect = can.getBoundingClientRect();

    let ps = pieces.filter(piece => piece.IsClick(x - rect.left, y - rect.top));
    if (ps.length == 0) {
        console.log('どれもクリックされていない');
        enableScrollOnTouchMove(ev, true); // フリックでスクロールできるようにする
        return;
    }

    movingPiece = ps[ps.length - 1]; // 一番手前に描画されているものを取得
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length != 1) return;

    if (movingPiece != null) {
        const rect = can.getBoundingClientRect();

        let x = e.touches[0].pageX; // 触れている指に関する情報を取得
        let y = e.touches[0].pageY; // 触れている指に関する情報を取得

        let newX = x - rect.left - pieceSize * 0.75;
        let newY = y - rect.top - pieceSize * 0.75;

        // 見えない位置に移動してしまうのを防ぐ
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

        if (row < rowMax && col < colMax) {
            let ps = pieces.filter(_ => _.X == col * pieceSize && _.Y == row * pieceSize);
            if (ps.length == 0) {
                // そこにピースがなくズレが小さいときだけフィットさせる
                if (Math.abs(col * pieceSize - movingPiece.X) < 20 && Math.abs(row * pieceSize - movingPiece.Y) < 20) {
                    movingPiece.X = col * pieceSize;
                    movingPiece.Y = row * pieceSize;
                }
            }
        }

        // 移動したピースを最前面に描画する
        pieces = pieces.filter(piece => piece != movingPiece);
        pieces.push(movingPiece);

        movingPiece = null;

        drawAll();
        check();
    }
    enableScrollOnTouchMove(e, false); // フリックでスクロールできないようにする
});

// リロードの抑止
window.addEventListener('beforeunload', (ev) => {
    ev.preventDefault();
    ev.returnValue = '';
});
