"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelAllMsg = exports.StoredMessage = void 0;
class StoredMessage {
    constructor(id, message, date, user) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
    }
}
exports.StoredMessage = StoredMessage;
class ChannelAllMsg {
    constructor(channel) {
        this.channel = channel;
        this.chatMsg = [];
        this.removedMsg = [];
    }
}
exports.ChannelAllMsg = ChannelAllMsg;
//# sourceMappingURL=types.js.map