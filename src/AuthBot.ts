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
import { RootDialog } from "./dialogs/RootDialog";

// =========================================================
// Auth Bot
// =========================================================

export class AuthBot extends builder.TeamsActivityHandler {

    private dialogState: builder.StatePropertyAccessor<any>;

    constructor(
        private adapter: builder.BotFrameworkAdapter,
        private conversationState: builder.ConversationState,
        private userState: builder.UserState,
        private rootDialog: RootDialog,
    )
    {
        super();
        this.dialogState = this.conversationState.createProperty("DialogState");
        
        this.adapter.onTurnError = this.onTurnError.bind(this);

        this.onMessage(async (context, next) => {
            await this.rootDialog.run(context, this.dialogState);
            await next();
        });
    }

    public async run(context: builder.TurnContext) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    // Get the user's profile information from all the identity providers that we have tokens for
    public async getUserProfilesAsync(aadObjectId: string): Promise<any> {
        // let profiles = {};

        // let userData = await this.storage.getUserDataByAadObjectIdAsync(aadObjectId);
        // if (userData) {
        //     for (let providerName in constants.IdentityProvider) {
        //         let token = utils.getUserTokenFromUserData(userData, providerName);
        //         let provider = this.authProviders[providerName];
        //         if (token && provider) {
        //             let profile = await provider.getProfileAsync(token.accessToken);
        //             profiles[provider.displayName] = profile;
        //         }
        //     }
        // }

        // return profiles;

        return {};
    }

    protected async handleTeamsSigninVerifyState(context: builder.TurnContext, query: builder.SigninStateVerificationQuery) {
        await this.rootDialog.run(context, this.dialogState);
    }

    private async onTurnError(context: builder.TurnContext, error: Error) {
            // This check writes out errors to console log .vs. app insights.
            // NOTE: In production environment, you should consider logging this to Azure
            //       application insights.
            console.error(`\n [onTurnError] unhandled error: ${ error }`);

            // Send a trace activity, which will be displayed in Bot Framework Emulator
            await context.sendTraceActivity(
                'OnTurnError Trace',
                `${ error }`,
                'https://www.botframework.com/schemas/error',
                'TurnError'
            );

            // Send a message to the user
            await context.sendActivity('The bot encountered an error or bug.');
            await context.sendActivity('To continue to run this bot, please fix the bot source code.');

            // Clear out state
            await this.conversationState.clear(context);
    }
}
