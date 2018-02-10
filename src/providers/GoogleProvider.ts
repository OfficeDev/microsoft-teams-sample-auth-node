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

import * as request from "request-promise";
import * as config from "config";
import * as querystring from "querystring";
let uuidv4 = require("uuid/v4");
import { UserToken, IOAuth2Provider } from "./OAuth2Provider";

// =========================================================
// Google API
// =========================================================

export type PersonField = "names" | "emailAddresses" | "photos" | "urls";

const authorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const accessTokenUrl = "https://www.googleapis.com/oauth2/v4/token";
const callbackPath = "/auth/google/callback";
const meProfileUrl = "https://people.googleapis.com/v1/people/me";

// Example implementation of Google as an identity provider
// See https://developers.google.com/identity/protocols/OpenIDConnect
export class GoogleProvider implements IOAuth2Provider {

    constructor(
        private clientId: string,
        private clientSecret: string,
    )
    {
    }

    get displayName(): string {
        return "Google";
    }

    // Return the url the user should navigate to to authenticate the app
    public getAuthorizationUrl(state: string, extraParams?: any): string {
        let params = {
            response_type: "code",
            response_mode: "query",
            scope: "openid profile email",
            client_id: this.clientId,
            redirect_uri: config.get("app.baseUri") + callbackPath,
            nonce: uuidv4(),
            state: state,
        } as any;
        if (extraParams) {
            params = { ...extraParams, ...params };
        }
        return authorizationUrl + "?" + querystring.stringify(params);
    }

    // Redeem the authorization code for an access token
    public async getAccessTokenAsync(code: string): Promise<UserToken> {
        let params = {
            grant_type: "authorization_code",
            code: code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: config.get("app.baseUri") + callbackPath,
        } as any;

        let responseBody = await request.post({ url: accessTokenUrl, form: params, json: true });
        return {
            accessToken: responseBody.access_token,
            expirationTime: responseBody.expires_on * 1000,
        };
    }

    public async getProfileAsync(accessToken: string, personFields: PersonField[] = ["names"]): Promise<any> {
        let options = {
            url: `${meProfileUrl}?personFields=${personFields.join(",")}`,
            json: true,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        };
        return await request.get(options);
    }
}
