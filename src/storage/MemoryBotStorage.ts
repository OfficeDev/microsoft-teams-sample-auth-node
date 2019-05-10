// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as builder from "botbuilder";
import { IBotExtendedStorage } from "./BotExtendedStorage";

export class MemoryBotStorage implements builder.IBotStorage, IBotExtendedStorage {
    private userStore: { [id: string]: string; } = {};
    private conversationStore: { [id: string]: string; } = {};

    public getData(context: builder.IBotStorageContext, callback: (err: Error, data: builder.IBotStorageData) => void): void {
        let data: builder.IBotStorageData = {};
        if (context.userId) {
            // Read userData
            if (context.persistUserData) {
                if (this.userStore.hasOwnProperty(context.userId)) {
                    data.userData = JSON.parse(this.userStore[context.userId]);
                } else {
                    data.userData = null;
                }
            }
            if (context.conversationId) {
                // Read privateConversationData
                let key = context.userId + ":" + context.conversationId;
                if (this.conversationStore.hasOwnProperty(key)) {
                    data.privateConversationData = JSON.parse(this.conversationStore[key]);
                } else {
                    data.privateConversationData = null;
                }
            }
        }
        if (context.persistConversationData && context.conversationId) {
            // Read conversationData
            if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                data.conversationData = JSON.parse(this.conversationStore[context.conversationId]);
            } else {
                data.conversationData = null;
            }
        }
        callback(null, data);
    }

    public saveData(context: builder.IBotStorageContext, data: builder.IBotStorageData, callback?: (err: Error) => void): void {
        if (context.userId) {
            // Write userData
            if (context.persistUserData) {
                this.userStore[context.userId] = JSON.stringify(data.userData || {});
            }
            if (context.conversationId) {
                // Write privateConversationData
                let key = context.userId + ":" + context.conversationId;
                this.conversationStore[key] = JSON.stringify(data.privateConversationData || {});
            }
        }
        if (context.persistConversationData && context.conversationId) {
            // Write conversationData
            this.conversationStore[context.conversationId] = JSON.stringify(data.conversationData || {});
        }
        callback(null);
    }

    public deleteData(context: builder.IBotStorageContext): void {
        if (context.userId && this.userStore.hasOwnProperty(context.userId)) {
            if (context.conversationId) {
                // Delete specified conversation
                if (this.conversationStore.hasOwnProperty(context.conversationId)) {
                    delete this.conversationStore[context.conversationId];
                }
            } else {
                // Delete user and all their conversations
                delete this.userStore[context.userId];
                for (let key in this.conversationStore) {
                    if (key.indexOf(context.userId + ":") === 0) {
                        delete this.conversationStore[key];
                    }
                }
            }
        }
    }

    // Lookup user data by AAD object id
    public async getUserDataByAadObjectIdAsync(aadObjectId: string): Promise<any> {
        for (let key in this.userStore) {
            let userData = JSON.parse(this.userStore[key]);
            if (userData.aadObjectId === aadObjectId) {
                return userData;
            }
        }
        return null;
    }

    public getAAdObjectId(userData: any): string {
        // This implementation sets the AAD object ID directly on userData
        return userData.aadObjectId;
    }

    public setAAdObjectId(userData: any, aadObjectId: string): void {
        // This implementation sets the AAD object ID directly on userData
        userData.aadObjectId = aadObjectId;
    }
}
