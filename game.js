// Отключаем авто-подключение сокетов при загрузке страницы
const socket = io({ autoConnect: false }); 
let myRole = null; 

// Ресурсы
const damagedCarImg = new Image();
damagedCarImg.src = 'images/carDamaged.png';

const sound = new Audio('damagesound.mp3');
const music = new Audio('nes.mp3');
music.loop = true;

const explosion = document.createElement('img');
explosion.src = 'pontus-ornemark-explosion-animation-update_transparent.gif'; 
explosion.style.position = 'absolute';
explosion.style.display = 'none';
explosion.style.zIndex = '1000';
document.body.appendChild(explosion);

const scale = 0.3;
const speed = 5;
const carSpeed = 8;
const keys = {};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let timer = null;
let objects = [];
let winnerText = ""; 

const info = document.createElement('div');
info.style = "position:fixed; bottom:20px; right:20px; color:white; font-size:30px; font-family:Arial; font-weight:bold; text-shadow: 2px 2px black; display:none;";
document.body.appendChild(info);

// ФУНКЦИЯ КНОПКИ СТАРТ
function startSearch() {
    const btn = document.getElementById("buttonstart");
    btn.innerText = 'ПОИСК ИГРОКА...';
    btn.disabled = true;

    // Теперь подключаемся к серверу
    socket.connect();
}

// Привязываем функцию к кнопке (убедись, что в HTML у кнопки id="buttonstart")
document.getElementById("buttonstart").onclick = startSearch;

class Road {
    constructor(image, y) {
        this.x = 0;
        this.y = y;
        this.image = new Image();
        this.image.src = image;
    }
    Update(road) {
        this.y += speed;
        if (this.y > canvas.height) {
            this.y = road.y - canvas.height + speed;
        }
    }
}

class Car {
    constructor(imagePath, x, y, label) {
        this.dead = false;
        this.x = x;
        this.y = y;
        this.label = label; 
        this.image = new Image();
        this.image.src = imagePath;
        this.loaded = false;
        this.image.onload = () => { this.loaded = true; };
        // Если картинка не найдена, ставим флаг, чтобы не рисовать её
        this.image.onerror = () => { console.error("Не найден файл:", imagePath); };
    }
    Update() {
        this.y += speed;
        if (this.y > canvas.height + 100) this.dead = true;
    }
    CanMoveTo(newX, newY, otherCar) {
        if (otherCar.dead) return true; 
        const myW = this.image.width * scale;
        const myH = this.image.height * scale;
        const otherW = otherCar.image.width * scale;
        const otherH = otherCar.image.height * scale;
        return !(newY < otherCar.y + otherH && newY + myH > otherCar.y && newX < otherCar.x + otherW && newX + myW > otherCar.x);
    }
    Move(dx, dy, otherPlayer) {
        if (this.dead) return;
        let nextX = this.x + dx;
        let nextY = this.y + dy;
        if (nextX < 0 || nextX + this.image.width * scale > canvas.width) nextX = this.x;
        if (nextY < 0 || nextY + this.image.height * scale > canvas.height) nextY = this.y;
        if (this.CanMoveTo(nextX, nextY, otherPlayer)) {
            this.x = nextX;
            this.y = nextY;
        }
    }
    Collide(car) {
        if (!this.loaded || !car.loaded) return false;
        if (this.y < car.y + car.image.height * scale && this.y + this.image.height * scale > car.y) {
            if (this.x < car.x + car.image.width * scale && this.x + this.image.width * scale > car.x) return true;
        }
        return false;
    }
}

let roads = [new Road("images/road.jpg", 0), new Road("images/road.jpg", 0)];
let player = new Car("images/car.png", 0, 0, "P1");
let player2 = new Car("images/car.png", 0, 0, "P2");

// СОКЕТЫ
socket.on('playerRole', (data) => {
    myRole = data.role;
    info.style.display = "block";
    info.innerText = "Вы: " + myRole;
});

socket.on('startGame', () => {
    document.getElementById("buttonstart").innerText = "ИГРОК НАЙДЕН!";
    setTimeout(() => {
        const overlay = document.getElementById("ui-overlay");
        if (overlay) overlay.style.display = "none";
        // Теперь музыка сработает, так как был клик по кнопке
        music.play().catch(e => console.log("Музыка не запустилась:", e));
        Start();
    }, 1000);
});

socket.on('opponentMove', (data) => {
    if (myRole === 'P1') {
        player2.x = data.x;
        player2.y = data.y;
    } else {
        player.x = data.x;
        player.y = data.y;
    }
});

socket.on('finish', (data) => {
    const loser = (data.loser === 'P1') ? player : player2;
    TriggerExplosion(loser, false); 
});

function Resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width * 0.3;
    player.y = canvas.height - 200;
    player2.x = canvas.width * 0.7;
    player2.y = canvas.height - 200;
    roads[1].y = canvas.height;
}

function Start() {
    if (timer) clearInterval(timer);
    winnerText = "";
    Resize();
    timer = setInterval(Update, 1000 / 60);
}

function Stop() {
    if (timer) clearInterval(timer);
    timer = null;
}

function TriggerExplosion(loser, sendSignal = true) {
    if (timer == null) return; // Чтобы не взрываться дважды
    Stop(); 
    if (sendSignal) socket.emit('gameOver', { loser: (loser === player ? 'P1' : 'P2') });
    
    loser.dead = true;
    loser.image = damagedCarImg;

    const centerX = loser.x + (loser.image.width * scale) / 2;
    const centerY = loser.y + (loser.image.height * scale) / 2;

    explosion.style.left = (centerX - 150) + 'px';
    explosion.style.top = (centerY - 150) + 'px';
    explosion.style.width = '300px';
    explosion.style.display = 'block';

    setTimeout(() => { explosion.style.display = 'none'; }, 500);

    winnerText = (loser === player) ? "PLAYER 2 WINS!" : "PLAYER 1 WINS!";
    sound.play();
    music.pause();
    Draw();

    setTimeout(() => { location.reload(); }, 3000);
}

function Update() {
    let dx = 0, dy = 0;
    
    if (myRole === 'P1') {
        if (keys["KeyA"]) dx -= carSpeed;
        if (keys["KeyD"]) dx += carSpeed;
        if (keys["KeyW"]) dy -= carSpeed;
        if (keys["KeyS"]) dy += carSpeed;
        player.Move(dx, dy, player2);
        socket.emit('move', { x: player.x, y: player.y });
    } else if (myRole === 'P2') {
        if (keys["ArrowLeft"]) dx -= carSpeed;
        if (keys["ArrowRight"]) dx += carSpeed;
        if (keys["ArrowUp"]) dy -= carSpeed;
        if (keys["ArrowDown"]) dy += carSpeed;
        player2.Move(dx, dy, player);
        socket.emit('move', { x: player2.x, y: player2.y });
    }

    roads[0].Update(roads[1]);
    roads[1].Update(roads[0]);

    // ВАЖНО: проверь путь Images/car_red.png или images/car_red.png
    if (RandomInteger(0, 10000) > 9850) { // Сделал спавн чуть реже
        objects.push(new Car("images/car_red.png", RandomInteger(30, canvas.width - 50), -200, ""));
    }

    for (let i = 0; i < objects.length; i++) {
        objects[i].Update();
        if (player.Collide(objects[i])) { TriggerExplosion(player); return; }
        if (player2.Collide(objects[i])) { TriggerExplosion(player2); return; }
    }
    objects = objects.filter(n => !n.dead);
    Draw();
}

function Draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r of roads) {
        ctx.drawImage(r.image, 0, 0, r.image.width, r.image.height, r.x, r.y, canvas.width, canvas.height);
    }
    DrawCar(player);
    DrawCar(player2);
    for (let obj of objects) DrawCar(obj);

    if (winnerText !== "") {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 8;
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.strokeText(winnerText, canvas.width / 2, canvas.height / 2);
        ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2);
    }
}

function DrawCar(car) {
    if (!car.loaded) return; // НЕ РИСУЕМ, если не загрузилась (исправляет Broken State)
    const w = car.image.width * scale;
    const h = car.image.height * scale;
    ctx.drawImage(car.image, 0, 0, car.image.width, car.image.height, car.x, car.y, w, h);
    if (car.label && !car.dead) {
        ctx.fillStyle = "yellow";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(car.label, car.x + w / 2, car.y - 10);
    }
}

function RandomInteger(min, max) {
    return Math.round(min - 0.5 + Math.random() * (max - min + 1));
}

window.addEventListener("keydown", (e) => { keys[e.code] = true; });
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
window.addEventListener("resize", Resize);
