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

export class StreamInfo {
  id: string;
  title: string;
  type: string;
  startDate?: Date;
}

export class ChannelDatas {
  channel: string;
  streamInfo: StreamInfo;
  chatMsg: StoredMessage[];
  removedMsg: StoredMessage[];
  banUsers: string[];

  constructor(channel: string, streamInfos?: StreamInfo) {
    this.channel = channel;
    this.streamInfo = streamInfos;
    this.chatMsg = [];
    this.removedMsg = [];
    this.banUsers = [];
  }
}
