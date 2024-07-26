let broadcasters = [];

module.exports = (server) => {

    const io = require("socket.io")(server, {
        cors: {
            origin: '*',
        }
    });

    io.sockets.on("error", e => console.log(e));

    io.sockets.on("connection", socket => {

        socket.emit("streams", Object.values(broadcasters));

        socket.on("broadcaster", (name) => {

            broadcasters[socket.id] = { id: socket.id, name };

            socket.broadcast.emit("streams", Object.values(broadcasters));


        });

        socket.on("disconnect", () => {

            console.log(`${socket.id} disconnected`);

            delete broadcasters[socket.id];

            socket.broadcast.emit("streams", Object.values(broadcasters));

        });

        socket.on("watcher", (id) => {

            console.log(`${socket.id} watching ${id}`);

            socket.to(id).emit("watcher", socket.id);

        });

        socket.on("offer", (id, message) => {

            socket.to(id).emit("offer", socket.id, message);

        });

        socket.on("answer", (id, message) => {

            socket.to(id).emit("answer", socket.id, message);

        });

        socket.on("candidate", (id, message) => {

            socket.to(id).emit("candidate", socket.id, message);

        });

    });

}