const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let waitingPlayer = null;

io.on('connection', (socket) => {
    if (!waitingPlayer) {
        waitingPlayer = socket;
        socket.emit('playerRole', { role: 'P1' });
    } else {
        const roomName = `room_${waitingPlayer.id}`;
        const p1 = waitingPlayer;
        const p2 = socket;

        p1.join(roomName);
        p2.join(roomName);
        socket.emit('playerRole', { role: 'P2' });
        io.to(roomName).emit('startGame');

        // СОЗДАЕМ ТАЙМЕР СПАВНА ДЛЯ КОНКРЕТНОЙ КОМНАТЫ
        const spawnInterval = setInterval(() => {
            // Генерируем данные препятствия один раз для двоих
            const obstacleData = {
                id: Math.random().toString(36).substr(2, 9),
                x: Math.floor(Math.random() * (800 - 50) + 30), // Сервер пока не знает ширину канваса, 800 - среднее значение
                y: -500
            };
            io.to(roomName).emit('spawnObstacle', obstacleData);
        }, 1200); // Спавн каждые 1.2 секунды

        socket.on('move', (data) => socket.to(roomName).emit('opponentMove', data));
        p1.on('move', (data) => p1.to(roomName).emit('opponentMove', data));

        socket.on('gameOver', (data) => {
            clearInterval(spawnInterval);
            io.to(roomName).emit('finish', data);
        });
        
        p1.on('gameOver', (data) => {
            clearInterval(spawnInterval);
            io.to(roomName).emit('finish', data);
        });

        waitingPlayer = null;
        
        socket.on('disconnect', () => clearInterval(spawnInterval));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
