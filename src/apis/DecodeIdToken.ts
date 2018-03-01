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

import * as express from "express";
import * as jwt from "jsonwebtoken";

// Decode the id_token from AAD in the Authorization header
export class DecodeIdToken {

    public listen(): express.RequestHandler {
        return (req: express.Request, res: express.Response) => {
            // Get bearer token from Authorization header
            let authHeaderMatch = /^Bearer (.*)/i.exec(req.headers["authorization"]);
            if (!authHeaderMatch) {
                console.error("No Authorization header provided");
                res.sendStatus(401);
                return;
            }

            // Note that this does not validate the token, as we have middleware that does that

            // Decode token and return as response
            const encodedToken = authHeaderMatch[1];
            const decodedToken = jwt.decode(encodedToken, { complete: true });
            res.status(200).send(decodedToken.payload);
        };
    }

}
