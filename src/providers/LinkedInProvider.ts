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
import { UserToken, IOAuth2Provider } from "./OAuth2Provider";

// =========================================================
// LinkedIn API
// =========================================================

export type ProfileField = "id" |
    "first-name" | "last-name" | "maiden-name" | "formatted-name" |
    "headline" | "location" | "industry" |
    "current-share" | "num-connections" | "num-connections-capped" |
    "summary" | "specialties" | "positions" |
    "picture-url" | "public-profile-url";

const apiBaseUrl = "https://api.linkedin.com/v1";
const authorizationUrl = "https://www.linkedin.com/oauth/v2/authorization";
const accessTokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
const callbackPath = "/auth/linkedIn/callback";

// Example implementation of LinkedIn OAuth2 client
// See https://developer.linkedin.com/docs/oauth2
export class LinkedInProvider implements IOAuth2Provider {

    constructor(
        private clientId: string,
        private clientSecret: string,
    )
    {
    }

    get displayName(): string {
        return "LinkedIn";
    }

    // Return the url the user should navigate to to authenticate the app
    public getAuthorizationUrl(state: string, extraParams?: any): string {
        let params = {
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: config.get("app.baseUri") + callbackPath,
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
            expirationTime: Date.now() + (responseBody.expires_in * 1000),
        };
    }

    public async getProfileAsync(accessToken: string, fields?: ProfileField[]): Promise<any> {
        let fieldsString = "";
        if (fields && fields.length) {
            fieldsString = `:(${fields.join(",")})`;
        }

        let options = {
            url: `${apiBaseUrl}/people/~${fieldsString}?format=json`,
            json: true,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        };
        return await request.get(options);
    }
}
