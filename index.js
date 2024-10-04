const pieceSize = 50;

let can = document.getElementById('can');
// キャンバス内でのタッチ操作中にスクロールを無効化
can.addEventListener('touchstart', function(e) {
    e.preventDefault(); // デフォルトのスクロール動作を無効化
}, { passive: false });

can.addEventListener('touchmove', function(e) {
    e.preventDefault(); // タッチ移動中のスクロールを無効化
}, { passive: false });

let ctx = can.getContext('2d');
let pieces = []; // Pieceオブジェクトを格納する変数

let colMax = 0; // ピースは横に何個並ぶか？
let rowMax = 0; // ピースは縦に何個並ぶか？

class Piece {
    constructor(image, outline, x, y){
        this.Image = image;
        this.Outline = outline;
        this.X = x;
        this.Y = y;

        this.OriginalCol = Math.round(x / pieceSize); // 本来の位置
        this.OriginalRow = Math.round(y / pieceSize);
    }

    Draw(){
        ctx.drawImage(this.Image, this.X, this.Y);
        ctx.drawImage(this.Outline, this.X, this.Y);
    }

    IsClick(x, y){
        return x >= this.X && x <= this.X + pieceSize &&
               y >= this.Y && y <= this.Y + pieceSize;
    }

    Check() {
        return this.X === this.OriginalCol * pieceSize && this.Y === this.OriginalRow * pieceSize;
    }
}

window.onload = async() => {
    let sourceImage = await createSourceImage();

    colMax = Math.floor(sourceImage.width / pieceSize);
    rowMax = Math.floor(sourceImage.height / pieceSize);

    can.width = colMax * pieceSize * 1.2;
    can.height = rowMax * pieceSize * 2;

    pieces = [];
    for(let row = 0; row < rowMax; row++){
        for(let col = 0; col < colMax; col++){
            let image = await createPiece(sourceImage, row, col, rowMax, colMax, false);
            let outline = await createPiece(sourceImage, row, col, rowMax, colMax, true);
            pieces.push(new Piece(image, outline, col * pieceSize, row * pieceSize));
        }
    }
    drawAll();
}

async function createSourceImage(){
    let image = new Image();
    return await new Promise(resolve => {
        image.src = 'img/deer.png';
        image.onload =() => {
            resolve(image);
        }
    });
}

async function createPiece(sourceImage, row, col, rowMax, colMax, outlineOnly){
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    let s = pieceSize / 4;

    canvas.width = s * 6;
    canvas.height = s * 6;

    if(ctx == null)
        return;

    ctx.beginPath();
    ctx.moveTo(s, s);
    ctx.lineTo(s * 2, s);

    // ピースの形状に合わせた処理
    if(row > 0){
        if((row + col) % 2 == 0)
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, false); // 凸
        else
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, true); // 凹
    }

    // 残りのピース生成コードは省略（前のコードと同じ）

    let base64 = canvas.toDataURL("image/png", 1);
    canvas.remove();

    return await createImage(base64);
}

async function createImage(base64){
    let image = new Image();
    return await new Promise(resolve => {
        image.src = base64;
        image.onload =() => {
            resolve(image);
        }
    });
}

function drawAll(){
    ctx.clearRect(0, 0, can.width, can.height);
    pieces.forEach(piece => {
        piece.Draw();
    });
}

// シャッフル処理
document.getElementById('shuffle').addEventListener('click', shuffle);

function shuffle(){
    let arr = [...pieces]; // 配列のコピーを作成
    for(let row = 0; row < rowMax; row++){
        for(let col = 0; col < colMax; col++){
            let r = Math.floor(Math.random() * arr.length);
            arr[r].X = col * pieceSize;
            arr[r].Y = row * pieceSize;
            arr.splice(r, 1);
        }
    }
    drawAll();
}

function check(){
    let ok = pieces.every(piece => piece.Check());
    if(ok){
        alert("パズル完成！");
    }
}
