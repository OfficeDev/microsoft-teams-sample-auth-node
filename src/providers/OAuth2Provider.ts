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

// =========================================================
// OAuth2 Provider
// =========================================================

// User token
export interface UserToken {
    // Access token
    accessToken: string;
    // Approximate expiration time of the access token, expressed as a number of milliseconds from midnight, January 1, 1970 Universal Coordinated Time (UTC)
    expirationTime: number;
    // Verification code
    verificationCode?: string;
    // Has the verification code been validated?
    verificationCodeValidated?: boolean;
    // Expiration time of verification code, expressed as a number of milliseconds from midnight, January 1, 1970 Universal Coordinated Time (UTC)
    verificationCodeExpirationTime?: number;
}

// Generic OAuth2 provider interface
export interface IOAuth2Provider {

    // Display name to use for the provider
    readonly displayName: string;

    // Return the url the user should navigate to to authenticate the app
    getAuthorizationUrl(state: string, extraParams?: any): string;

    // Redeem the authorization code for an access token
    getAccessTokenAsync(code: string): Promise<UserToken>;

}
