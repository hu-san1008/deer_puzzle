// スクロールを無効にする関数
function disableScroll(e) {
    e.preventDefault();
}

// タッチ移動でスクロールを有効または無効にする関数
function enableScrollOnTouchMove(e, enable) {
    if (!enable) {
        window.addEventListener('touchmove', disableScroll, { passive: false });
    } else {
        window.removeEventListener('touchmove', disableScroll);
    }
}

// タッチ開始時のイベントリスナー
window.addEventListener('touchstart', (ev) => {
    ev.preventDefault(); // デフォルトのタッチ動作を防ぐ

    if (ev.touches.length != 1) {
        enableScrollOnTouchMove(ev, true); // 複数の指でのタッチの場合はスクロールを有効にする
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

    movingPiece = ps[ps.length - 1]; // 一番手前のピースを選択
});

// タッチ移動時のイベントリスナー
window.addEventListener('touchmove', (e) => {
    if (e.touches.length != 1) return;

    if (movingPiece != null) {
        const rect = can.getBoundingClientRect();

        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        let newX = x - rect.left - pieceSize * 0.75;
        let newY = y - rect.top - pieceSize * 0.75;

        // ピースが画面外に出ないように調整
        newX = Math.max(newX, -pieceSize / 2);
        newY = Math.max(newY, -pieceSize / 2);
        newX = Math.min(newX, can.width - pieceSize / 2);
        newY = Math.min(newY, can.height - pieceSize * 0.75);

        movingPiece.X = newX;
        movingPiece.Y = newY;

        drawAll();
    }
});

// タッチ終了時のイベントリスナー
window.addEventListener('touchend', (e) => {
    if (movingPiece != null) {
        let col = Math.round(movingPiece.X / pieceSize);
        let row = Math.round(movingPiece.Y / pieceSize);

        col = Math.max(col, 0);
        row = Math.max(row, 0);

        if (row < rowMax && col < colMax) {
            let ps = pieces.filter(_ => _.X == col * pieceSize && _.Y == row * pieceSize);
            if (ps.length == 0) {
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
        // check 関数の呼び出しが必要ならば定義するか削除
        // check();
    }
    enableScrollOnTouchMove(e, false); // スクロールを無効にする
});

// ページのリロードを防ぐ
window.addEventListener('beforeunload', (ev) => {
    ev.preventDefault();
    ev.returnValue = '';
});
