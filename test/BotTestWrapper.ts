import * as builder from "botbuilder";
import * as constants from "../src/constants";

// Helper class for getting the next message from the bot
export class BotTestWrapper {
    // Waiters get the next message from a bot, and returns true if it has been fulfilled
    private waiters: {(msg: builder.IMessage): boolean}[] = [];

    constructor(private bot: builder.UniversalBot) {
        bot.on("send", (msg: builder.IMessage) => {
            this.waiters = this.waiters.filter(waiter => !waiter(msg));
        });
    }

    // Returns a promise the resolves to the next message sent by the bot whose type is specified in the filter
    public getNextMessageAsync(filter: string[] = [constants.messageType]): Promise<builder.IMessage> {
        return new Promise((resolve, reject) => {
            this.waiters.push((msg) => {
                if (filter.find(type => (msg.type === type))) {
                    resolve(msg);
                    return true;
                }
                return false;
            });
        });
    }

    // Returns a promise the resolves to the next message sent by the bot whose type is specified in the filter
    // tslint:disable-next-line:typedef
    public getNextMessagesAsync(count = 1, filter: string[] = [constants.messageType]): Promise<builder.IMessage[]> {
        return new Promise((resolve, reject) => {
            let messages = [];
            this.waiters.push((msg) => {
                if (filter.find(type => (msg.type === type))) {
                    messages.push(msg);
                    count--;
                    if (count <= 0) {
                        resolve(messages);
                        return true;
                    }
                }
                return false;
            });
        });
    }

    // Sends a message to the bot
    public sendEventToBot(events: builder.IEvent|builder.IEvent[]): void {
        this.bot.receive(events);
    }

    // Sends a text message to bot
    public sendMessageToBot(line: string): void {
        let msg = new builder.Message()
            .address({
                serviceUrl: "https://example.com/fake-service-url",
                channelId: "console",
                user: { id: "user", name: "User1" },
                bot: { id: "bot", name: "Bot" },
                conversation: { id: "Convo1" },
            } as builder.IAddress)
            .sourceEvent({
                console: {
                    tenant: { id: "TenantId" },
                },
            })
            .timestamp()
            .text(line);
        this.sendEventToBot(msg.toMessage());
    }
}
