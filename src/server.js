let express = require('express')
let app = express();

let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 8080;

const users = [];

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('new-message', (message) => io.emit('new-message', message));
    socket.on('new-user', (user) => {
        if (users.includes(user.username)) {
            io.emit('new-user', { ok: false });
        } else {
            users.push(user.username);
            io.emit('new-user', { ok: true, username: user.username });
            console.log(`${user.username} joined the chat.`);
        }
    })
});

server.listen(port, () => {
    console.log(`started on port: ${port}`);
});