const socket = io(); // Подключаемся к серверу
let myRole = null; // P1 или P2

// UI элементы
const btn = document.getElementById("buttonstart");
const info = document.createElement('div');
info.style = "position:fixed; bottom:20px; right:20px; color:white; font-size:30px; font-family:Arial; font-weight:bold; text-shadow: 2px 2px black;";
document.body.appendChild(info);

// Получаем роль от сервера
socket.on('playerRole', (data) => {
    myRole = data.role;
    info.innerText = "Вы: " + myRole;
});

// Когда нашелся оппонент
socket.on('startGame', () => {
    btn.innerText = "ИГРОК НАЙДЕН!";
    setTimeout(() => {
        btn.remove();
        music.play();
        Start();
    }, 1000);
});

// Получаем движения оппонента
socket.on('opponentMove', (data) => {
    if (myRole === 'P1') {
        player2.x = data.x;
        player2.y = data.y;
    } else {
        player.x = data.x;
        player.y = data.y;
    }
});

// Получаем сигнал о конце игры
socket.on('finish', (data) => {
    const loser = (data.loser === 'P1') ? player : player2;
    TriggerExplosion(loser, false); // false чтобы не слать сигнал повторно
});

// ... (Весь старый код классов Road и Car остается без изменений) ...

// В функции Update меняем отправку координат
function Update() {
    let dx = 0, dy = 0;
    
    // Управляем только СВОЕЙ машиной
    if (myRole === 'P1') {
        if (keys["KeyA"]) dx -= carSpeed;
        if (keys["KeyD"]) dx += carSpeed;
        if (keys["KeyW"]) dy -= carSpeed;
        if (keys["KeyS"]) dy += carSpeed;
        player.Move(dx, dy, player2);
        socket.emit('move', { x: player.x, y: player.y });
    } else {
        if (keys["ArrowLeft"]) dx -= carSpeed;
        if (keys["ArrowRight"]) dx += carSpeed;
        if (keys["ArrowUp"]) dy -= carSpeed;
        if (keys["ArrowDown"]) dy += carSpeed;
        player2.Move(dx, dy, player);
        socket.emit('move', { x: player2.x, y: player2.y });
    }

    roads[0].Update(roads[1]);
    roads[1].Update(roads[0]);

    // Синхронный спавн препятствий лучше делать на сервере, 
    // но для простоты оставим как есть (могут быть небольшие расхождения)
    if (RandomInteger(0, 10000) > 9750) {
        objects.push(new Car("Images/car_red.png", RandomInteger(30, canvas.width - 50), -200, ""));
    }

    for (let i = 0; i < objects.length; i++) {
        objects[i].Update();
        if (player.Collide(objects[i])) { 
            socket.emit('gameOver', { loser: 'P1' }); 
            return; 
        }
        if (player2.Collide(objects[i])) { 
            socket.emit('gameOver', { loser: 'P2' }); 
            return; 
        }
    }
    objects = objects.filter(n => !n.dead);
    Draw();
}

function Start() {
    if (timer) clearInterval(timer);
    winnerText = "";
    Resize();
    timer = setInterval(Update, 1000 / 60);
}

// Изменяем TriggerExplosion
function TriggerExplosion(loser, sendSignal = true) {
    Stop(); 
    loser.dead = true;
    loser.image = damagedCarImg;
    // ... логика взрыва ...
    winnerText = (loser === player) ? "PLAYER 2 WINS!" : "PLAYER 1 WINS!";
    Draw();
    setTimeout(() => { location.reload(); }, 3000);
}