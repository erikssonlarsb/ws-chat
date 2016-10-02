var express = require('express');
var cookieParser = require('cookie-parser')
var app = express();
var websocket = require('express-ws')(app);

var Client = require("./client.js");
var Message = require("./message.js");

var clients = [];
var messages = [];

app.use(cookieParser());
app.use(express.static('frontend'));
app.use('/node_modules', express.static('node_modules'));

app.get('/session', function(req, res){
  if(!req.cookies) {
      var randomNumber=Math.random().toString();
      randomNumber=randomNumber.substring(2,randomNumber.length);
      res.cookie('skull', randomNumber, {httpOnly:true});
  }
  res.send("yo");
});

app.post('/session', function(req, res){
  console.log('get route', req.testing);
  res.send("yo");
});

app.ws('/', function(ws, request) {
    var client = new Client(ws);
    clients.push(client);

    ws.on("headers", function(headers) {
        headers["set-cookie"] = "SESSIONID=" + crypto.randomBytes(20).toString("hex");
        console.log("handshake response cookie", headers["set-cookie"]);
    });
    ws.on("connection", function(ws) {
        console.log("connection request cookie: ", ws.upgradeReq.headers.cookie);
    });

    ws.on('message', function(message) {
        var json = JSON.parse(message);
        if(json.type == 'NEW_USER') {
            client.setName(json.name);
			console.log("new client: " + client.getId() + ", " + client.getName());
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "NEW_CONNECTION", {id: client.getId()})));
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "HISTORY", {messages: messages})));
            sendAll(new Message('SYSTEM', json.type, client.getName()));
        } else {
            var message = new Message(client.getName(), json.type, json.data);
            messages.push(message);
            sendAll(message);
        }

    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

function sendAll (message) {
    for (var i=0; i<clients.length; i++) {
        if(clients[i].getSocket().readyState == 1) {
            clients[i].getSocket().send(JSON.stringify(message));
        } else {
            clients.splice(i--, 1);
        }

    }
}
