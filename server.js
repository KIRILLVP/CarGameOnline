const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 1. Указываем папку со статическими файлами (картинки, звуки, скрипты)
app.use(express.static(__dirname));

// 2. Добавляем маршрут для главной страницы (исправляет ошибку Cannot GET /)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    if (!waitingPlayer) {
        // Первый игрок зашел — ждет
        waitingPlayer = socket;
        socket.emit('playerRole', { role: 'P1' });
    } else {
        // Второй игрок зашел — создаем комнату
        const roomName = `room_${waitingPlayer.id}`;
        const p1 = waitingPlayer;
        const p2 = socket;

        p1.join(roomName);
        p2.join(roomName);

        socket.emit('playerRole', { role: 'P2' });

        // Уведомляем обоих, что игра началась
        io.to(roomName).emit('startGame');

        // Пересылаем координаты СВОЕЙ машины оппоненту
        socket.on('move', (data) => {
            socket.to(roomName).emit('opponentMove', data);
        });

        p1.on('move', (data) => {
            p1.to(roomName).emit('opponentMove', data);
        });

        // Если кто-то врезался, сообщаем всем в комнате
        socket.on('gameOver', (data) => {
            io.to(roomName).emit('finish', data);
        });

        p1.on('gameOver', (data) => {
            io.to(roomName).emit('finish', data);
        });

        waitingPlayer = null;
    }

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        console.log('Пользователь отключился');
    });
});

// 3. Используем порт, который дает Render, или 3000 для локалки
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
