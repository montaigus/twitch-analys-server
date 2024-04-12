export class storedMessage {
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

export class channelAllMsg {
  channel: string;
  chatMsg: storedMessage[];
  removedMsg: storedMessage[];

  constructor(channel: string) {
    this.channel = channel;
    this.chatMsg = [];
    this.removedMsg = [];
  }
}
