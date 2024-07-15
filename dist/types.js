"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizedInfos = exports.StreamData = exports.channelData = exports.StreamInfos = exports.StoredMessage = void 0;
class StoredMessage {
    constructor(id, message, date, user, channel, streamId, streamStart) {
        this.id = id;
        this.message = message;
        this.date = date;
        this.user = user;
        this.channel = channel;
        this.streamId = streamId ? streamId : null;
        streamStart
            ? (this.upTime = streamStart.getMilliseconds() - date.getMilliseconds())
            : (this.upTime = 0);
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
    constructor(streamInfos, chatMsg, removedMsg) {
        this.streamInfos = streamInfos;
        this.chatData = {
            chatMsg: chatMsg ? chatMsg : [],
            removedMsg: removedMsg ? removedMsg : [],
        };
    }
}
exports.StreamData = StreamData;
class OrganizedInfos {
    constructor(channel, banUsers) {
        this.channel = channel;
        this.banUsers = banUsers;
        this.wildMsgs = [];
        this.allStreams = [];
    }
}
exports.OrganizedInfos = OrganizedInfos;
// export class ChannelDatas {
//   channel: string;
//   streamsData: StreamData[];
//   banUsers: { user: string; banDate?: Date }[];
//   constructor(channel: string) {
//     this.channel = channel;
//     this.banUsers = [];
//   }
//}
//# sourceMappingURL=types.js.map