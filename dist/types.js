"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelDatas = exports.StreamData = exports.StreamInfos = exports.StoredMessage = void 0;
class StoredMessage {
    constructor(id, message, date, user) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
    }
}
exports.StoredMessage = StoredMessage;
class StreamInfos {
}
exports.StreamInfos = StreamInfos;
class StreamData {
    constructor(streamInfos) {
        this.streamInfos = streamInfos;
        this.chatData = { chatMsg: [], removedMsg: [] };
    }
}
exports.StreamData = StreamData;
class ChannelDatas {
    constructor(channel) {
        this.channel = channel;
        this.banUsers = [];
    }
}
exports.ChannelDatas = ChannelDatas;
//# sourceMappingURL=types.js.map