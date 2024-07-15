export class StoredMessage {
  id: string;
  message: string;
  date: Date;
  user: string;
  channel: string;
  streamId?: string;
  upTime?: number;

  constructor(
    id: string,
    message: string,
    date: Date,
    user: string,
    channel: string,
    streamId?: string,
    streamStart?: Date
  ) {
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

export class StreamInfos {
  id: string;
  title: string;
  type: string;
  startDate: Date;
  endDate: Date;
  channel: string;
}

export class channelData {
  name: string;
  currentStreamId: string;
  banUsers: string[];

  constructor(name: string) {
    this.name = name;
    this.currentStreamId = null;
    this.banUsers = [];
  }
}

class ReadableStreamInfos {
  title: string;
  type: string;
  startDate: string;

  constructor(data: StreamInfos) {
    this.title = data.title;
    this.type = data.type;
    this.startDate = data.startDate.toString();
  }
}

export class StreamData {
  streamInfos: ReadableStreamInfos;
  chatData: { chatMsg: ReadableMsgData[]; removedMsg: string[] };

  constructor(
    streamInfos: StreamInfos,
    chatMsg?: ReadableMsgData[],
    removedMsg?: string[]
  ) {
    this.streamInfos = new ReadableStreamInfos(streamInfos);
    this.chatData = {
      chatMsg: chatMsg ? chatMsg : [],
      removedMsg: removedMsg ? removedMsg : [],
    };
  }
}

function millisToMinutesAndSeconds(millis: number) {
  var minutes = Math.floor(millis / 60000);
  var seconds = (millis % 60000) / 1000;
  return seconds == 60
    ? minutes + 1 + ":00"
    : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

export class ReadableMsgData {
  message: string;
  date: string;
  user: string;
  upTime?: string;

  constructor(data: StoredMessage) {
    this.message = data.message;
    this.date = data.date.toLocaleTimeString();
    this.user = data.user;
    this.upTime = data.upTime ? millisToMinutesAndSeconds(data.upTime) : "0";
  }
}

export class OrganizedInfos {
  channel: string;
  banUsers: string[];
  wildMsgs: ReadableMsgData[];
  allStreams: StreamData[];

  constructor(channel: string, banUsers: string[]) {
    this.channel = channel;
    this.banUsers = banUsers;
    this.wildMsgs = [];
    this.allStreams = [];
  }
}

// export class ChannelDatas {
//   channel: string;
//   streamsData: StreamData[];
//   banUsers: { user: string; banDate?: Date }[];

//   constructor(channel: string) {
//     this.channel = channel;
//     this.banUsers = [];
//   }
//}
