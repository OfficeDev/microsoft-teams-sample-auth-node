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
import * as dialogs from "botbuilder-dialogs";
import { LinkedInProvider } from "../providers";

export const LINKEDIN_DIALOG = "LinkedInDialog";
const CHOICE_PROMPT = "ChoicePrompt";
const OAUTH_PROMPT = "OAuthPrompt";
const MAIN_WATERFALL_DIALOG = "MainWaterfallDialog";
const SHOWPROFILE_FLOW = "ShowProfileFlow";
const SIGNIN_FLOW = "SigninFlow";
const SIGNOUT_FLOW = "SignoutFlow";
const MAINLOOP_FLOW = "MainLoopFlow";

export class LinkedInDialog extends dialogs.ComponentDialog {

    constructor(
        private connectionName: string,
        private provider: LinkedInProvider)
    {
        super(LINKEDIN_DIALOG);

        this.addDialog(new dialogs.OAuthPrompt(OAUTH_PROMPT, {
            connectionName,
            text: "Please sign in so I can show you your profile.",
            title: "Sign in",
            timeout: 300000
        }));
        this.addDialog(new dialogs.ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new dialogs.WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.getTokenStep.bind(this),
            this.showProfileStep.bind(this),
            this.restartMainLoopStep.bind(this),
        ]));
        this.addDialog(new dialogs.WaterfallDialog(MAINLOOP_FLOW, [
            this.chooseActionStep.bind(this),
            this.processActionStep.bind(this),
            this.restartMainLoopStep.bind(this),
        ]));
        this.addDialog(new dialogs.WaterfallDialog(SHOWPROFILE_FLOW, [
            this.getTokenStep.bind(this),
            this.showProfileStep.bind(this),
        ]));
        this.addDialog(new dialogs.WaterfallDialog(SIGNOUT_FLOW, [
            this.signOutStep.bind(this),
        ]));
        this.addDialog(new dialogs.WaterfallDialog(SIGNIN_FLOW, [
            this.signOutStep.bind(this),
            this.getTokenStep.bind(this),
            this.showProfileStep.bind(this),
        ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    private getTokenStep(stepContext: dialogs.WaterfallStepContext) {
        return stepContext.beginDialog(OAUTH_PROMPT);
    }

    private async showProfileStep(stepContext: dialogs.WaterfallStepContext) {
        const tokenResponse: builder.TokenResponse = stepContext.result;
        if (tokenResponse) {
            let profile = await this.provider.getProfileAsync(tokenResponse.token);
            const card = builder.CardFactory.thumbnailCard(
                `${this.getPreferredLocalizedString(profile.firstName)} ${this.getPreferredLocalizedString(profile.lastName)}`,
                [
                    { url: profile.profilePicture["displayImage~"].elements[0].identifiers[0].identifier }
                ],
                [
                ]);
            await stepContext.context.sendActivity({ 
                text: `Here's your profile in ${this.provider.displayName}`,
                attachments: [ card ],
            });
            return await stepContext.next();
        } else {
            await stepContext.context.sendActivity("Please sign in so I can show you your profile.");
            return await stepContext.replaceDialog(MAIN_WATERFALL_DIALOG);
        }
    }

    private async chooseActionStep(stepContext: dialogs.WaterfallStepContext) {
        const adapter = stepContext.context.adapter as builder.BotFrameworkAdapter;
        const tokenResponse = await adapter.getUserToken(stepContext.context, this.connectionName);

        let choices = [];
        if (tokenResponse && tokenResponse.token) {
            choices = [ "Show profile", "Sign out", "Back" ];
        } else {
            choices = [ "Sign in", "Back" ];
        }

        return await stepContext.prompt(CHOICE_PROMPT, {
            choices: dialogs.ChoiceFactory.toChoices(choices),
        });
    }

    private async processActionStep(stepContext: dialogs.WaterfallStepContext) {
        const choice = stepContext.result.value;
        switch (choice) {
            case "Show profile":
                return await stepContext.beginDialog(SHOWPROFILE_FLOW);

            case "Sign out":
                return await stepContext.beginDialog(SIGNOUT_FLOW);

            case "Sign in":
                return await stepContext.beginDialog(SIGNIN_FLOW, { silent: true });

            case "Back":
                return await stepContext.endDialog();

            default:
                await stepContext.context.sendActivity(`"I didn't recognize your choice '${choice}'.`);
                return await stepContext.next();
        }
    }

    private async signOutStep(stepContext: dialogs.WaterfallStepContext<any>) {
        const adapter = stepContext.context.adapter as builder.BotFrameworkAdapter;
        await adapter.signOutUser(stepContext.context, this.connectionName);
        if (!stepContext.options.silent) {
            await stepContext.context.sendActivity(`You're now signed out of ${this.provider.displayName}.`);
        }
        return await stepContext.next();
    }

    private restartMainLoopStep(stepContext: dialogs.WaterfallStepContext) {
        return stepContext.replaceDialog(MAINLOOP_FLOW);
    }

    private getPreferredLocalizedString(localizedString: any): string {
        const preferredLocale = `${localizedString.preferredLocale.language}_${localizedString.preferredLocale.country}`;
        return localizedString.localized[preferredLocale];
    }
}
