"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelAllMsg = exports.storedMessage = void 0;
class storedMessage {
    constructor(id, message, date, user) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
    }
}
exports.storedMessage = storedMessage;
class channelAllMsg {
    constructor(channel) {
        this.channel = channel;
        this.chatMsg = [];
        this.removedMsg = [];
    }
}
exports.channelAllMsg = channelAllMsg;
//# sourceMappingURL=types.js.map