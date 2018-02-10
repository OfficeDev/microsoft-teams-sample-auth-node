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
import { GoogleProvider } from "../providers";
import { BaseIdentityDialog } from "./BaseIdentityDialog";

// Dialog that handles dialogs for Google provider
export class GoogleDialog extends BaseIdentityDialog
{
    constructor() {
        super(constants.IdentityProviders.google, constants.DialogId.Google);
    }

    // Show user profile
    protected async showUserProfile(session: builder.Session): Promise<void> {
        let linkedInApi = this.authProvider as GoogleProvider;
        let userToken = this.getUserToken(session);

        if (userToken) {
            let profile = await linkedInApi.getProfileAsync(userToken.accessToken, [ "names", "emailAddresses", "photos", "urls" ]);

            let name = this.findPrimaryValue(profile.names);
            let email = this.findPrimaryValue(profile.emailAddresses);
            let photo = this.findPrimaryValue(profile.photos);
            let profileUrl = this.findPrimaryValue(profile.urls);

            let profileCard = new builder.ThumbnailCard()
                .title(name.displayName)
                .subtitle(email.value)
                .buttons([
                    builder.CardAction.openUrl(session, profileUrl.value, "View on Google"),
                ])
                .images([
                    new builder.CardImage()
                        .url(photo.url)
                        .alt(name.displayName),
                ]);
            session.send(new builder.Message().addAttachment(profileCard));
        } else {
            session.send("Please sign in to Google so I can access your profile.");
        }

        await this.promptForAction(session);
    }

    // Find the value marked as primary
    private findPrimaryValue(values: any[]): any {
        values = values || [];
        return values.find(value => value.metadata.primary);
    }
}
