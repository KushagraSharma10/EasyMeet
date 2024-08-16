const express = require("express");
const path = require("path");
const app = express();
const indexRouter = require("./routes/indexRouter");

const socketIO = require("socket.io")
const http = require("http")
const server = http.createServer(app);
const io = socketIO(server);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let waitingusers = [];
const rooms = {};

io.on("connection", (socket) => {
    socket.on("joinroom", ()=>{
        if(waitingusers.length > 0){
            let partner = waitingusers.shift()
            const roomname = `${socket.id}-${partner.id}`

            socket.join(roomname)
            partner.join(roomname)


            io.to(roomname).emit("joined",roomname)
        } else{
            waitingusers.push(socket)
        }
    });

    socket.on("signalingMessage", (data)=>{
       socket.broadcast.to(data.room).emit("signalingMessage",data.message)
    })

    socket.on("message", (data)=>{
        socket.broadcast.to(data.room).emit("message", data.message)
    })

    socket.on("startVideoCall", ({room})=>{
        socket.broadcast.to(room).emit("incomingCall")
    })
    socket.on("incomingCall", ({room})=>{
        socket.broadcast.to(room).emit("callAccepted")
    })
    socket.on("rejectCall", ({room})=>{
        socket.broadcast.to(room).emit("callRejected")
    })

    socket.on("disconnect", ()=>{
        let index = waitingusers.findIndex(
            (waitingUser) => waitingUser.id === socket.id
        );

        waitingusers.splice(index, 1);  
    })
})

app.use("/", indexRouter);

server.listen(8000);
