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

export class StreamData {
  streamInfos: StreamInfos;
  chatData: { chatMsg: StoredMessage[]; removedMsg: string[] };

  constructor(
    streamInfos: StreamInfos,
    chatMsg?: StoredMessage[],
    removedMsg?: string[]
  ) {
    this.streamInfos = streamInfos;
    this.chatData = {
      chatMsg: chatMsg ? chatMsg : [],
      removedMsg: removedMsg ? removedMsg : [],
    };
  }
}

export class OrganizedInfos {
  channel: string;
  banUsers: string[];
  wildMsgs: StoredMessage[];
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
