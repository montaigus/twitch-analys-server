"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelDatas = exports.StreamData = exports.channelData = exports.StreamInfos = exports.StoredMessage = void 0;
class StoredMessage {
    constructor(id, message, date, user, channel, streamId, streamStart) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
        this.channel = channel;
        this.streamId = streamId ? streamId : null;
        this.upTime = streamStart.getMilliseconds() - date.getMilliseconds();
    }
}
exports.StoredMessage = StoredMessage;
class StreamInfos {
}
exports.StreamInfos = StreamInfos;
class channelData {
    constructor(name) {
        this.name = name;
        this.currentStreamId = null;
        this.banUsers = [];
    }
}
exports.channelData = channelData;
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