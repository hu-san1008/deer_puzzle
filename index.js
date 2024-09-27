const pieceSize = 50;

let can = document.getElementById('can');
let ctx = can.getContext('2d');
let can2 = document.getElementById('can2');
let ctx2 = can2.getContext('2d');
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
        // 追加: ピースが正しい位置にあるかを確認するメソッド
        return this.X === this.OriginalCol * pieceSize && this.Y === this.OriginalRow * pieceSize;
    }
}

window.onload = async() => {
    let sourceImage = await createSourceImage();

    // ピースは縦横何列必要か？
    colMax = Math.floor(sourceImage.width / pieceSize);
    rowMax = Math.floor(sourceImage.height / pieceSize);

    // canvasのサイズはピースが占める面積の2倍とする
    can.width = colMax * pieceSize * 1.2;
    can.height = rowMax * pieceSize * 2;
    can2.width = colMax * pieceSize * 1.2;
    can2.height = rowMax * pieceSize * 2;

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

    if(row > 0){
        if((row + col) % 2 == 0)
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, false); // 凸
        else
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, true); // 凹
    }

    ctx.lineTo(s * 5, s);
    ctx.lineTo(s * 5, s * 2);

    if(col < colMax - 1){
        if((row + col) % 2 == 1)
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, false); // 凸
        else
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, true); // 凹
    }

    ctx.lineTo(s * 5, s * 5);
    ctx.lineTo(s * 4, s * 5);

    if(row < rowMax - 1){
        if((row + col) % 2 == 0)
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, false); // 凸
        else
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, true); // 凹
    }

    ctx.lineTo(s, s * 5);
    ctx.lineTo(s, s * 4);

    if(col > 0){
        if((row + col) % 2 == 1)
            ctx.arc(s, s * 3, s, Math.PI / 2, Math.PI * 3 / 2, false); // 凸
        else
            ctx.arc(s, s * 3, s, Math.PI / 2, Math.PI * 3 / 2, true); // 凹
    }

    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = '#fff'; // 輪郭は白

    if(outlineOnly)
        ctx.stroke();
    else
        ctx.drawImage(sourceImage, s - s * 4 * col, s - s * 4 * row);

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

let movingPiece = null; // 現在移動中のピース
let oldX = 0; // 現在移動中のピースの移動前のX座標
let oldY = 0; // 現在移動中のピースの移動前のY座標

function drawAll(){
    ctx.clearRect(0, 0, can.width, can.height);
    let s = pieceSize / 4;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(s, s, pieceSize * colMax, pieceSize * rowMax);

    pieces.forEach(piece => {
        piece.Draw();
    });

    if(movingPiece != null)
        movingPiece.Draw();
}

window.addEventListener('mousedown', (ev) => {
    if(ev.button != 0)
        return;

    const rect1 = can.getBoundingClientRect();
    const rect2 = can2.getBoundingClientRect();

    // canvas2上のピースをクリックした場合
    let ps2 = pieces.filter(piece => piece.IsClick(ev.clientX - rect2.left, ev.clientY - rect2.top));
    if(ps2.length > 0) {
        console.log('canvas2のピースがクリックされました');
        movingPiece = ps2[0];
        oldX = movingPiece.X;
        oldY = movingPiece.Y;

        // canvas2からcanvas1へピースを移動
        movingPiece.X = ev.clientX - rect1.left - pieceSize * 0.75;
        movingPiece.Y = ev.clientY - rect1.top - pieceSize * 0.75;

        drawAll(); // canvas1で再描画
        return;
    }

    // 既存のcanvas1上での処理はそのまま
    let ps = pieces.filter(piece => piece.IsClick(ev.clientX - rect1.left, ev.clientY - rect1.top));
    if(ps.length == 0){
        console.log('canvas1ではどれもクリックされていない');
        return;
    }

    movingPiece = ps[0];
    oldX = ps[0].X;
    oldY = ps[0].Y;
});


window.addEventListener('mousemove', (ev) =>{
    if(movingPiece != null){
        const rect = can.getBoundingClientRect();
        let newX = ev.clientX - rect.left - pieceSize * 0.75;
        let newY = ev.clientY - rect.top - pieceSize * 0.75;

        if(newX <  - pieceSize / 2)
            newX =  - pieceSize / 2;
        if(newY <  - pieceSize / 2)
            newY =  - pieceSize / 2;
        if(newX > can.width - pieceSize / 2)
            newX = can.width - pieceSize / 2;
        if(newY > can.height - pieceSize / 2)
            newY = can.height - pieceSize / 2;

        movingPiece.X = newX;
        movingPiece.Y = newY;

        drawAll();
    }
});

window.addEventListener('mouseup', (ev) =>{
    if(movingPiece != null){
        let col = Math.round(movingPiece.X / pieceSize);
        let row = Math.round(movingPiece.Y / pieceSize);

        if(col < 0)
            col = 0;
        if(row < 0)
            row = 0;

        if(row < rowMax && col < colMax){
                movingPiece.X = col * pieceSize;
                movingPiece.Y = row * pieceSize;
            } else {
                // ピースを元の位置に戻す
                movingPiece.X = oldX;
                movingPiece.Y = oldY;
            }
    
            // ピースが正しい位置に配置されているかを確認
            if(movingPiece.Check()){
                console.log('ピースが正しい位置に配置されました');
            }
    
            drawAll();
            movingPiece = null; // 移動終了
        }
    });
    