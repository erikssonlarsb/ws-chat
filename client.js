var method = Client.prototype;

function Client(socket) {
    this.socket = socket;
    randomNumber=Math.random().toString();
    this.id = randomNumber.substring(2,randomNumber.length);
    this.name = "";
}

method.getSocket = function() {
    return this.socket;
};

method.getId = function() {
    return this.id;
};

method.getName = function() {
    return this.name;
}

method.setName = function(name) {
    this.name = name;
}

module.exports = Client;
