var method = Message.prototype;

function Message(sender, type, data) {
    this.sender = sender;
    this.type = type;
    this.data = data;
    this.timestamp = Date.now();
}

method.getSender = function() {
    return this.sender;
};

method.getType = function() {
    return this.type;
};

method.getData = function() {
    return this.data;
};

method.getTimestamp = function() {
    return this.timestamp;
};

module.exports = Message;
