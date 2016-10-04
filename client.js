var method = Client.prototype;

function Client(socket, id) {
    this.socket = socket;
    this.id = id;
}

method.getSocket = function() {
    return this.socket;
};

method.setSocket = function(socket) {
     this.socket = socket;
};

method.getId = function() {
    return this.id;
};

method.setId = function(id) {
    this.id = id;
};

method.getName = function() {
    return this.name;
}

method.setName = function(name) {
    this.name = name;
}

module.exports = Client;
