"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelDatas = exports.StreamInfo = exports.StoredMessage = void 0;
class StoredMessage {
    constructor(id, message, date, user) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
    }
}
exports.StoredMessage = StoredMessage;
class StreamInfo {
}
exports.StreamInfo = StreamInfo;
class ChannelDatas {
    constructor(channel) {
        this.channel = channel;
        this.chatMsg = [];
        this.removedMsg = [];
        this.banUsers = [];
    }
}
exports.ChannelDatas = ChannelDatas;
//# sourceMappingURL=types.js.map