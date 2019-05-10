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
import * as msteams from "botbuilder-teams";
import * as constants from "../constants";
import { AzureADv1Provider } from "../providers";
import { BaseIdentityDialog } from "./BaseIdentityDialog";

// Dialog that handles dialogs for AzureADv1 provider
export class AzureADv1Dialog extends BaseIdentityDialog
{
    constructor() {
        super(constants.IdentityProvider.azureADv1, constants.DialogId.AzureADv1);
    }

    // Get an authorization url for Azure AD
    protected getAuthorizationUrl(session: builder.Session, state: string): string {
        // For AzureAD, we need to generate an authorization URL specific to the current tenant.
        // This is important for guest users, so we get an access token for the correct organization
        // (i.e., the current tenant, not the home tenant of the guest user).
        let azureADApi = this.authProvider as AzureADv1Provider;
        let tenantId = msteams.TeamsMessage.getTenantId(session.message);
        return azureADApi.getAuthorizationUrl(state, null, tenantId);
    }

    // Show user profile
    protected async showUserProfile(session: builder.Session): Promise<void> {
        let azureADApi = this.authProvider as AzureADv1Provider;
        let userToken = this.getUserToken(session);

        if (userToken) {
            let profile = await azureADApi.getProfileAsync(userToken.accessToken);
            let profileCard = new builder.ThumbnailCard()
                .title(profile.displayName)
                .subtitle(profile.userPrincipalName)
                .text(`<b>E-mail</b>: ${profile.mail}<br/>
                       <b>Title</b>: ${profile.jobTitle}<br/>
                       <b>Office location</b>: ${profile.officeLocation}`);
            session.send(new builder.Message().addAttachment(profileCard));
        } else {
            session.send("Please sign in to AzureAD so I can access your profile.");
        }

        await this.promptForAction(session);
    }
}
