var express = require('express');
var cookieParser = require('cookie-parser')
var app = express();
var websocket = require('express-ws')(app);
var args = require('minimist')(process.argv.slice(2), {
    default: {
        port: '3000',
        path: '',
        ws: '/ws'
    }
});
if(args.path.length > 0 && args.path.substring(0,1) != '/') {
    args.path = '/' + args.path;
};
if(args.path.length > 0 && args.path.substring(0,1) != '/') {
    args.path = '/' + args.path;
};

var Client = require("./client.js");
var Message = require("./message.js");

var clients = {};
var messages = [];

app.use(cookieParser());
app.use(args.path, express.static('frontend'));
app.use(args.path + '/node_modules', express.static('node_modules'));

app.get(args.path + '/session', function(req, res){
    console.log("requesting cookie");

    if(!req.cookies.WSSESSIONID) {
        var randomNumber=Math.random().toString();
        randomNumber=randomNumber.substring(2,randomNumber.length);
        res.cookie('WSSESSIONID', randomNumber, {httpOnly:true});
        console.log("created new cookie: " + randomNumber);
    }
    res.send({
        path: args.path,
        port: args.port,
        ws: args.ws
    });
});

app.ws(args.path + args.ws, function(ws, request) {
    var client;
    if(clients[request.cookies.WSSESSIONID]) {
        client = clients[request.cookies.WSSESSIONID];
        client.setSocket(ws);
        if(client.getName()) {
            console.log("existing registered session: " + client.getId() + ":" + client.getName());
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "EXISTING_CONNECTION", {name: client.getName()})));
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "HISTORY", {messages: messages})));
            for (var id in clients) {
                if(clients[id].getImage()) {
                    client.getSocket().send(JSON.stringify(new Message(clients[id].getName(), "IMAGE", clients[id].getImage())));
                }
            }

        } else {
            console.log("existing unregistered session: " + client.getId());
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "NEW_CONNECTION")));
        }
    } else {
        client = new Client(ws, request.cookies.WSSESSIONID);
        console.log("new session: " + client.getId());
        clients[request.cookies.WSSESSIONID] = client;
        client.getSocket().send(JSON.stringify(new Message('SYSTEM', "NEW_CONNECTION", {id: client.getId()})));
    }

    ws.on('message', function(message) {
        var json = JSON.parse(message);
        if(json.type == 'NEW_USER') {
            client.setName(json.name);
			console.log("client login: " + client.getId() + ":" + client.getName());
            client.getSocket().send(JSON.stringify(new Message('SYSTEM', "HISTORY", {messages: messages})));
            for (var id in clients) {
                if(clients[id].getImage()) {
                    client.getSocket().send(JSON.stringify(new Message(clients[id].getName(), "IMAGE", clients[id].getImage())));
                }
            }
            sendAll(new Message('SYSTEM', json.type, 'User ' + client.getName() + ' joined.'));
        } else if(json.type == 'CHAT') {
            var message = new Message(client.getName(), json.type, json.data);
            messages.push(message);
            sendAll(message);
        } else if(json.type == 'IMAGE') {
            client.setImage(json.data);
            var message = new Message(client.getName(), json.type, json.data);
            sendAll(message);
        }
    });
});

app.listen(args.port, function () {
    console.log('ws-chat deployed at: ' + args.path + ' port: ' + args.port);
});

function sendAll (message) {
    for (var id in clients) {
        if(clients[id].getSocket().readyState == 1 && clients[id].getName()) {
            clients[id].getSocket().send(JSON.stringify(message));
        } /* else if(clients[id].getSocket().readyState == 3) {
            console.log("remove: " + clients[id].getId());
            delete clients[id];
        } */
    }
}
