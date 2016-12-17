var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)
const bodyParser = require("body-parser");
const userData = require("./data/user");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

server.listen(3000)
app.post('/login', function(req,res){
  let email = req.body.email;
  let password = req.body.password;
  userData.login(email, password).then((user)=>{
    res.json({status: 'succ', data: user, msg: 'succ'});
  }).catch((err)=> {
    res.json({status: 'err', msg: err});
  });
});

app.post('/register', function(req,res){
  let email = req.body.email;
  let password = req.body.password;
  let nickname = req.body.nickname;
  userData.createUser(email, nickname, password).then((user)=> {
    console.log(user);
    res.json({status: 'succ', data: user, msg: 'succ'});
  }).catch((err)=> {
    res.json({status: 'err', msg: err});
  });
});

app.get('/logout', function(req,res){

});

app.get('/rooms', function(req, res) {
  var roomList = Object.keys(rooms).map(function(key) {
    return rooms[key]
  })
  res.send(roomList)
})

var rooms = {}

io.on('connection', function(socket) {

  socket.on('create_room', function(room) {
    if (!room.key) {
      return
    }
    console.log('create room:', room)
    var roomKey = room.key
    rooms[roomKey] = room
    socket.roomKey = roomKey
    socket.join(roomKey)
  })

  socket.on('close_room', function(roomKey) {
    console.log('close room:', roomKey)
    delete rooms[roomKey]
  })

  socket.on('disconnect', function() {
    console.log('disconnect:', socket.roomKey)
    if (socket.roomKey) {
      delete rooms[socket.roomKey]
    }
  })

  socket.on('join_room', function(roomKey) {
    console.log('join room:', roomKey)
    socket.join(roomKey)
  })

  socket.on('upvote', function(roomKey) {
    console.log('upvote:', roomKey)
    io.to(roomKey).emit('upvote')
  })

  socket.on('gift', function(data) {
    console.log('gift:', data)
    io.to(data.roomKey).emit('gift', data)
  })

  socket.on('comment', function(data) {
    console.log('comment:', data)
    io.to(data.roomKey).emit('comment', data)
  })

})

console.log('listening on port 3000...')