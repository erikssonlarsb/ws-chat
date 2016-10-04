var express = require('express');
var cookieParser = require('cookie-parser')
var app = express();
var websocket = require('express-ws')(app);
var args = require('minimist')(process.argv.slice(2), {
    default: {
        port: '3000',
        path: '',
    }
});

var Client = require("./client.js");
var Message = require("./message.js");

var clients = {};
var messages = [];

app.use(cookieParser());
app.use('/'+args.path, express.static('frontend'));
app.use('/'+args.path+'/node_modules', express.static('node_modules'));

app.get('/'+args.path+'/session', function(req, res){
  if(!req.cookies.WSSESSIONID) {
      var randomNumber=Math.random().toString();
      randomNumber=randomNumber.substring(2,randomNumber.length);
      res.cookie('WSSESSIONID', randomNumber, {httpOnly:true});
  }
  res.send({
      path: args.path,
      port: args.port
  });
});

app.ws('/chat', function(ws, request) {
    var client;
    if(clients[request.cookies.WSSESSIONID]) {

        client = clients[request.cookies.WSSESSIONID];
        console.log("existing session: " + client.getId() + ":" + client.getName());
        client.setSocket(ws);
        client.getSocket().send(JSON.stringify(new Message('SYSTEM', "EXISTING_CONNECTION", {name: client.getName()})));
        client.getSocket().send(JSON.stringify(new Message('SYSTEM', "HISTORY", {messages: messages})));
    } else {
        client = new Client(ws, request.cookies.WSSESSIONID);
        console.log("new session: " + client.getId());
        clients[request.cookies.WSSESSIONID] = client;
        client.getSocket().send(JSON.stringify(new Message('SYSTEM', "NEW_CONNECTION")))
    }

    ws.on('message', function(message) {
        var json = JSON.parse(message);
        if(json.type == 'NEW_USER') {
            client.setName(json.name);
			console.log("client login: " + client.getId() + ":" + client.getName());
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "HISTORY", {messages: messages})));
            sendAll(new Message('SYSTEM', json.type, client.getName()));
        } else {
            var message = new Message(client.getName(), json.type, json.data);
            messages.push(message);
            sendAll(message);
        }

    });
});

app.listen(args.port, function () {
    console.log('ws-chat deployed at: ' + args.path + ' port: ' + args.port);
});

function sendAll (message) {
    for (var id in clients) {
        if(clients[id].getSocket().readyState == 1) {
            clients[id].getSocket().send(JSON.stringify(message));
        } else {
            console.log("remove: " + clients[id].getId());
            delete clients[id];
        }

    }
}
