export class StoredMessage {
  id: string;
  message: string;
  date: Date;
  user: string;
  upTime?: number;

  constructor(id: string, message: string, date: Date, user: string) {
    this.id = id;
    this.message = message;
    this.date = date;
    this.user = user;
  }
}

export class StreamInfos {
  id: string;
  title: string;
  type: string;
  startDate: Date;
  endDate: Date;
}

export class StreamData {
  streamInfos: StreamInfos;
  chatData: { chatMsg: StoredMessage[]; removedMsg: StoredMessage[] };

  constructor(streamInfos: StreamInfos) {
    this.streamInfos = streamInfos;
    this.chatData = { chatMsg: [], removedMsg: [] };
  }
}

export class ChannelDatas {
  channel: string;
  streamsData: StreamData[];
  banUsers: { user: string; banDate?: Date }[];

  constructor(channel: string) {
    this.channel = channel;
    this.banUsers = [];
  }
}
