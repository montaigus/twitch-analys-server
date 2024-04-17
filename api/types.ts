export class StoredMessage {
  id: string;
  message: string;
  date: Date;
  user: string;

  constructor(id: string, message: string, date: Date, user: string) {
    this.id = id;
    this.message = message;
    this.date = date;
    this.user = user;
  }
}

export class ChannelAllMsg {
  channel: string;
  chatMsg: StoredMessage[];
  removedMsg: StoredMessage[];

  constructor(channel: string) {
    this.channel = channel;
    this.chatMsg = [];
    this.removedMsg = [];
  }
}
