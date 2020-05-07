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
import { AzureADDialog, AZUREAD_DIALOG } from "./AzureADDialog";
import { AzureADv1Provider, LinkedInProvider } from "../providers";
import { LinkedInDialog, LINKEDIN_DIALOG } from "./LinkedInDialog";

const ROOT_DIALOG = "RootDialog";
const CHOICE_PROMPT = "ChoicePrompt";
const MAIN_WATERFALL_DIALOG = "MainWaterfallDialog";

export class RootDialog extends dialogs.ComponentDialog {

    constructor() {
        super(ROOT_DIALOG);

        this.addDialog(new dialogs.ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new dialogs.WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.chooseAuthProviderStep.bind(this),
            this.startAuthProviderDialogStep.bind(this),
            this.restartDialogStep.bind(this),
        ]));
        this.addDialog(new AzureADDialog("AzureADv2", new AzureADv1Provider(null, null)));
        this.addDialog(new LinkedInDialog("LinkedIn", new LinkedInProvider(null, null)));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     */
    public async run(context: builder.TurnContext, accessor: builder.StatePropertyAccessor<dialogs.DialogState>) {
        const dialogSet = new dialogs.DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === dialogs.DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    private async chooseAuthProviderStep(step: dialogs.WaterfallStepContext) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: "Select an identity provider",
            choices: dialogs.ChoiceFactory.toChoices(["Azure AD", "LinkedIn"])
        });
    }

    private async startAuthProviderDialogStep(step: dialogs.WaterfallStepContext) {
        const choice = step.result.value;
        switch (choice) {
            case "Azure AD":
                return await step.beginDialog(AZUREAD_DIALOG);

            case "LinkedIn":
                return await step.beginDialog(LINKEDIN_DIALOG);

            default:
                await step.context.sendActivity(`"I didn't recognize your choice '${choice}'`);
                return await step.replaceDialog(MAIN_WATERFALL_DIALOG);
        }
    }

    private restartDialogStep(stepContext: dialogs.WaterfallStepContext) {
        return stepContext.replaceDialog(MAIN_WATERFALL_DIALOG);
    }
}
