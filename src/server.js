let express = require('express')
let app = express();

let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 8080;

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('new-message', (message) => io.emit('new-message', message));
    socket.on('new-user', (user) => console.log(`${user.username} joined the chat.`));
});

server.listen(port, () => {
    console.log(`started on port: ${port}`);
});