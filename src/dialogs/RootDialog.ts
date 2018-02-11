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
import * as constants from "../constants";
import { LinkedInDialog } from "./LinkedInDialog";
import { AzureADv1Dialog } from "./AzureADv1Dialog";
import { GoogleDialog } from "./GoogleDialog";

// Root dialog provides choices in identity providers
export class RootDialog extends builder.IntentDialog
{
    constructor() {
        super();
    }

    // Register the dialog with the bot
    public register(bot: builder.UniversalBot): void {
        bot.dialog(constants.DialogId.Root, this);

        this.onBegin((session, args, next) => { this.onDialogBegin(session, args, next); });
        this.onDefault((session) => { this.onMessageReceived(session); });

        new LinkedInDialog().register(bot, this);
        new AzureADv1Dialog().register(bot, this);
        new GoogleDialog().register(bot, this);
        this.matches(/linkedIn/i, constants.DialogId.LinkedIn);
        this.matches(/azureADv1/i, constants.DialogId.AzureADv1);
        this.matches(/google/i, constants.DialogId.Google);
    }

    // Handle resumption of dialog
    public dialogResumed<T>(session: builder.Session, result: builder.IDialogResult<T>): void {
        this.promptForIdentityProvider(session);
    }

    // Handle start of dialog
    private async onDialogBegin(session: builder.Session, args: any, next: () => void): Promise<void> {
        session.dialogData.isFirstTurn = true;
        this.promptForIdentityProvider(session);
        next();
    }

    // Handle message
    private async onMessageReceived(session: builder.Session): Promise<void> {
        if (!session.dialogData.isFirstTurn) {
            // Unrecognized input
            session.send("I didn't understand that.");
            this.promptForIdentityProvider(session);
        } else {
            delete session.dialogData.isFirstTurn;
        }
    }

    // Prompt the user to pick an identity provider
    private promptForIdentityProvider(session: builder.Session): void {
        let msg = new builder.Message(session)
            .addAttachment(new builder.ThumbnailCard(session)
                .title("Select an identity provider")
                .buttons([
                    builder.CardAction.imBack(session, "LinkedIn", "LinkedIn"),
                    builder.CardAction.messageBack(session, "{}", "AzureAD (v1)")
                        .displayText("AzureAD (v1)")
                        .text("AzureADv1"),
                    builder.CardAction.imBack(session, "Google", "Google"),
                ]));
        session.send(msg);
    }
}
