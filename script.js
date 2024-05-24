const pieceSize = 80;

let can = document.getElementById('can');
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
        let s = pieceSize / 4;
        if(x < this.X + s) return false;
        if(this.X + s * 5 < x) return false;
        if(y < this.Y + s) return false;
        if(this.Y + s * 5 < y) return false;

        return true;
    }

    Check(){
        // ピースが正しい位置にあるか確認
        let col = Math.round(this.X / pieceSize);
        let row = Math.round(this.Y / pieceSize);
        return this.OriginalCol === col && this.OriginalRow === row;
    }
}

window.onload = async() => {
    let sourceImage = await createSourceImage(); // 後述

    // ピースは縦横何列必要か？
    colMax = Math.floor(sourceImage.width / pieceSize);
    rowMax = Math.floor(sourceImage.height / pieceSize);

    // canvasのサイズはピースが占める面積の2倍とする
    can.width = colMax * pieceSize * 2;
    can.height = rowMax * pieceSize * 2;

    pieces = [];
    for(let row = 0; row < rowMax; row++){
        for(let col = 0; col < colMax; col++){
            let image = await createPiece(sourceImage, row, col, rowMax, colMax, false); // 後述
            let outline = await createPiece(sourceImage, row, col, rowMax, colMax, true);
            pieces.push(new Piece(image, outline, col * pieceSize, row * pieceSize));
        }
    }
    drawAll(); // 写真指定
    shuffle(); // ピースをシャッフル
}

async function createSourceImage(){
    let image = new Image();
    return await new Promise(resolve => {
        image.src = 'deer.png';
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

    if(ctx == null) return;

    ctx.beginPath();
    ctx.moveTo(s, s);
    ctx.lineTo(s * 2, s);

    if(row > 0){ // row == 0 のときは上辺には凹凸をつけない
        if((row + col) % 2 == 0)
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, false); // 凸
        else
            ctx.arc(s * 3, s, s, Math.PI, Math.PI * 2, true); // 凹
    }

    ctx.lineTo(s * 5, s);
    ctx.lineTo(s * 5, s * 2);

    if(col < colMax - 1){ // col == colMax - 1 のときは右辺には凹凸をつけない
        if((row + col) % 2 == 1)
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, false); // 凸
        else
            ctx.arc(s * 5, s * 3, s, Math.PI * 3 / 2, Math.PI / 2, true); // 凹
    }

    ctx.lineTo(s * 5, s * 5);
    ctx.lineTo(s * 4, s * 5);

    if(row < rowMax - 1){ // row == rowMax - 1 のときは下辺には凹凸をつけない
        if((row + col) % 2 == 0)
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, false); // 凸
        else
            ctx.arc(s * 3, s * 5, s, Math.PI * 0, Math.PI, true); // 凹
    }

    ctx.lineTo(s, s * 5);
    ctx.lineTo(s, s * 4);

    if(col > 0){ // col == 0 のときは左辺には凹凸をつけない
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

    let base64 = canvas.toDataURL("image/png", 1); // PNGなら"image/png"
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
    ctx.clearRect(0, 0, can.width, can.height); // いったん全消去
    let s = pieceSize / 4;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(s, s, pieceSize * colMax, pieceSize * rowMax); // 完成形が存在する部分を黒枠で囲む

    pieces.forEach(piece => {
        piece.Draw();
    });

    // 移動中のピースがあれば描画する
    if(movingPiece != null)
        movingPiece.Draw();
}

window.addEventListener('mousedown', (ev) => {
    if(ev.button != 0) return; // 左クリック以外は無視

    const rect = can.getBoundingClientRect();
    let ps = pieces.filter(piece => piece.IsClick(ev.clientX - rect.left, ev.clientY - rect.top) );
    if(ps.length == 0){
        console.log('どれもクリックされていない');
        return;
    }

    console.log(`${ps[0].X}, ${ps[0].Y}`);
    movingPiece = ps[0];
    oldX = ps[0].X;
    oldY = ps[0].Y;
});

window.addEventListener('mousemove', (ev) => {
    if(movingPiece != null){
        const rect = can.getBoundingClientRect();
        let newX = ev.clientX - rect.left - pieceSize * 0.75;
        let newY = ev.clientY - rect.top - pieceSize * 0.75;

        // 見えない位置に移動してしまうのを防ぐ
        if(newX <  - pieceSize / 2) newX =  - pieceSize / 2;
        if(newY <  - pieceSize / 2) newY =  - pieceSize / 2;
        if(newX > can.width - pieceSize / 2) newX = can.width - pieceSize / 2;
        if(newY > can.height - pieceSize / 2) newY = can.height - pieceSize / 2;

        movingPiece.X = newX;
        movingPiece.Y = newY;

        drawAll();
    }
});

window.addEventListener('mouseup', (ev) => {
    if(movingPiece != null){
        let col = Math.round(movingPiece.X / pieceSize);
        let row = Math.round(movingPiece.Y / pieceSize);
        

        if(col < 0) col = 0;
        if(row < 0) row = 0;

        if(row < rowMax && col < colMax){
            let ps = pieces.filter(piece => piece.X == col * pieceSize && piece.Y == row * pieceSize);
            if(ps.length == 0){
                movingPiece.X = col * pieceSize;
                movingPiece.Y = row * pieceSize;
            } else {
                movingPiece.X = oldX;
                movingPiece.Y = oldY;
            }
        }

        movingPiece = null;
        drawAll();
        check(); // 完成したかのチェック
    }
});

let timer = null;
let time = 0;
let $time = document.getElementById('time');

function shuffle(){
    let arr = [];
    pieces.forEach(piece => arr.push(piece));

    for(let row = 0; row < rowMax; row++){
        for(let col = 0; col < colMax; col++){
            let r = Math.floor(Math.random() * arr.length);
            arr[r].X = col * pieceSize;
            arr[r].Y = row * pieceSize;
            arr.splice(r, 1);
        }
    }
    drawAll();

    // 時間をカウント
    time = 0;
    clearInterval(timer);
    timer = setInterval(() => {
        time++;
        $time.style.color = '#000';
        $time.innerHTML = `${time} 秒`;
    }, 1000);
}

function check(){
    let ok = true;
    for(let i = 0; i < pieces.length; i++){
        if(!pieces[i].Check()){
            ok = false;
            break;
        }
    }
    if(ok){
        clearInterval(timer);
        $time.style.color = '#f00'; // タイムを赤で表示
    }
}
