---
page_type: sample
products:
- office
- office-teams
- office-365
languages:
- typescript
- javascript
- html
description: "This sample demonstrates authentication in Microsoft Teams apps."
urlFragment: microsoft-teams-auth
extensions:
  contentType: samples
  createdDate: "2/8/2018 5:06:47 PM"
---

# Microsoft Teams Authentication Sample

This sample demonstrates authentication in Microsoft Teams apps.

There is a version of this app running on Microsoft Azure that you can try yourself. Download the [AuthBot.zip](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/raw/master/manifest/AuthBot.zip) app package and then [upload it into Microsoft Teams](https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/apps/apps-upload). Then start a chat with `@authbot`.

## Getting started
Start by following the setup instructions in the [Microsoft Teams Sample (Node.JS)](https://github.com/OfficeDev/microsoft-teams-sample-complete-node), under [Steps to see the full app in Microsoft Teams](https://github.com/OfficeDev/microsoft-teams-sample-complete-node#steps-to-see-the-full-app-in-microsoft-teams), applying it to the code in this sample. The instructions in that project walk you through the following steps:
1. Set up a tunneling service such as [ngrok](https://ngrok.com/).
1. Register a bot in [Microsoft Bot Framework](https://dev.botframework.com/).
1. Configure the app so it runs as the registered bot.
1. Create an app manifest (follow the "Manual" instructions) and sideload the app into Microsoft Teams.


## Setup
To be able to use an identity provider, first you have to register your application.

### Changing app settings
This project uses the [config](https://www.npmjs.com/package/config) package. The default configuration is in `config\default.json`.
 - Environment variable overrides are defined in `config\custom-environment-variables.json`. You can set these environment variables when running node. If you are using Visual Studio Code, you can set these in your `launch.json` file.
 - Alternatively, you can specify local modifications in `config\local.json`.

The instructions below assume that you're using environment variables to configure the app, and will specify the name of the variable to set.

### Using Azure AD
Registering a bot with the Microsoft Bot Framework automatically creates a corresponding Azure AD application with the same name and ID.
1. Go to the [Application Registration Portal](https://aka.ms/appregistrations) and sign in with the same account that you used to register your bot.
1. Find your application in the list and click on the name to edit.
1. Navigate to **Authentication** under **Manage** and add the following redirect URLs:
     * `https://<your_ngrok_url>/auth/azureADv1/callback`
     * `https://<your_ngrok_url>/tab/simple-end`
     * `https://<your_ngrok_url>/tab/silent-end`

1. Additionally, under the **Implicit grant** subsection select **Access tokens** and **ID tokens**

1. Click on **Expose an API** under **Manage**. Select the Set link to generate the Application ID URI in the form of api://{AppID}. Insert your fully qualified domain name (with a forward slash "/" appended to the end) between the double forward slashes and the GUID. The entire ID should have the form of: api://<your_ngrok_url>/{AppID}
1. Select the **Add a scope** button. In the panel that opens, enter `access_as_user` as the **Scope name**.
1. Set Who can consent? to Admins and users
1. Fill in the fields for configuring the admin and user consent prompts with values that are appropriate for the `access_as_user` scope. Suggestions:
    * **Admin consent title:** Teams can access the user’s profile
    * **Admin consent description**: Allows Teams to call the app’s web APIs as the current user.
    * **User consent title**: Teams can access your user profile and make requests on your behalf
    * **User consent description:** Enable Teams to call this app’s APIs with the same rights that you have
1. Ensure that **State** is set to **Enabled**
1. Select **Add scope**
    * Note: The domain part of the **Scope name** displayed just below the text field should automatically match the **Application ID** URI set in the previous step, with `/access_as_user` appended to the end; for example:
        * `api://<your_ngrok_url>/c6c1f32b-5e55-4997-881a-753cc1d563b7/access_as_user`
1. In the **Authorized client applications** section, you identify the applications that you want to authorize to your app’s web application. Each of the following IDs needs to be entered:
    * `1fec8e78-bce4-4aaf-ab1b-5451cc387264` (Teams mobile/desktop application)
    * `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` (Teams web application)
1. Navigate to **API Permissions**, and make sure to add the follow permissions:
    * User.Read (enabled by default)
    * email
    * offline_access
    * openid
    * profile
1. Scroll to the bottom of the page and click on "Save".

1. The bot uses `MICROSOFT_APP_ID` and `MICROSOFT_APP_PASSWORD`, so these should already be set. No further changes needed!


#### Update your Microsoft Teams application manifest

Add new properties to your Microsoft Teams manifest:

* **WebApplicationInfo** - The parent of the following elements.
* **Id** - The client ID of the application. This is an application ID that you obtain as part of registering the application with Azure AD 1.0 endpoint.
* **Resource** - The domain and subdomain of your application. This is the same URI (including the `api://` protocol) that you used when registering the app in AAD. The domain part of this URI should match the domain, including any subdomains, used in the URLs in the section of your Teams application manifest.

```json
"webApplicationInfo": {
  "id": "<application_GUID here>",
  "resource": "<web_API resource here>"
}
```

### Using LinkedIn
1. Follow the instructions in [Step 1 — Configuring your LinkedIn application](https://developer.linkedin.com/docs/oauth2) to create and configure a LinkedIn application for OAuth 2.
1. In "Authorized Redirect URLs", add `https://<your_ngrok_url>/auth/linkedIn/callback`.
1. Note your app's "Client ID" and "Client Secret".
1. Set the environment variables (or equivalent config) `LINKEDIN_CLIENT_ID` = `<your_client_id>`, and `LINKEDIN_CLIENT_SECRET` = `<your_client_secret>`.

### Using Google
1. Obtain OAuth2 client credentials from the [Google API Console](https://console.developers.google.com). Enable access to the [Google People API](https://developers.google.com/people/).
1. In "Authorized redirect URLs", add `https://<your_ngrok_url>/auth/google/callback`.
1. Note your app's "Client ID" and "Client Secret".
1. Set the environment variables (or equivalent config) `GOOGLE_CLIENT_ID` = `<your_client_id>`, and `GOOGLE_CLIENT_SECRET` = `<your_client_secret>`.


## Bot authentication flow
![Bot auth sequence diagram](https://aosolis.github.io/bot-auth/bot_auth_sequence.png)

1. The user sends a message to the bot.
1. The bot determines if the user needs to sign in.
    * In the example, the bot stores the access token in its user data store. It asks the user to log in if it doesn't have a validated token for the selected identity provider. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/src/utils/AuthenticationUtils.ts#L58-L76))
1. The bot constructs the URL to the start page of the auth flow, and sends a card to the user with a `signin` action. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/src/dialogs/BaseIdentityDialog.ts#L160-L190))
    * Like other application auth flows in Teams, the start page must be on a domain that's in your `validDomains` list, and on the same domain as the post-login redirect page.
1. When the user clicks on the button, Teams opens a popup window and navigates it to the start page.
1. The start page redirects the user to the identity provider's `authorize` endpoint. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/public/html/auth-start.html#L51-L56))
1. On the provider's site, the user signs in and grants access to the bot.
1. The provider takes the user to the bot's OAuth redirect page, with an authorization code.
1. The bot redeems the authorization code for an access token, and **provisionally** associates the token with the user that initiated the signin flow.
    * In the example, the bot uses information in the OAuth `state` parameter to determine the id of the user that started the signin process. Before proceeding, it checks `state` against the expected value, to detect forged requests. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/src/AuthBot.ts#L70-L99))
    * **IMPORTANT**: The bot puts the token in user's data store, but it is marked as "pending validation". The token is not used while in this state. The user has to "complete the loop" first by sending a verification code in Teams. This is to ensure that the user who authorized the bot with the identity provider is the same user who is chatting in Teams. This guards against "man-in-the-middle" attacks. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/src/AuthBot.ts#L100-L113))
1. The OAuth callback renders a page that calls `notifySuccess("<verification code>")`. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/master/src/views/oauth-callback-success.hbs))
1. Teams closes the popup and sends the string given to `notifySuccess()` back to the bot. The bot receives an invoke message with `name` = ` signin/verifyState`.
1. The bot checks the incoming verification code against the code stored in the user's provisional token. ([View code](https://github.com/OfficeDev/microsoft-teams-sample-auth-node/blob/469952a26d618dbf884a3be53c7d921cc580b1e2/src/dialogs/BaseIdentityDialog.ts#L127-L140))
1. If they match, the bot marks the token as validated and ready for use. Otherwise, the auth flow fails, and the bot deletes the provisional token.


### Security notes

* The verification code mechanism prevents a potential ["man in the middle" attack](https://hueniverse.com/explaining-the-oauth-session-fixation-attack-aa759250a0e7) by requiring evidence that the user who authorized the bot in the browser is the same person as the user who is chatting with the bot. **Don't** remove the need for a verification code without understanding what it is protecting against, and weighing the risk against your use case and threat model.
* Don't use the `signin/verifyState` message to pass sensitive data (e.g., access tokens) directly to your bot in plaintext. The `state` value should not be usable without additional information that's available only to your bot.
* The Teams app sends the `signin/verifyState` invoke message in a way that's equivalent to the user typing a message to your bot. This means that although the user information in the message is not falsifiable, a malicious user **can** tamper with the payload, or send additional invoke messages that were not initiated by your app.
* Store your users’ access tokens in such a way that they are encrypted at rest, especially if you are also storing refresh tokens. Consider, based on your use case and threat model, how often to rotate the encryption key. (The sample uses an in-memory store for simplicity; do not do this in your production app!)
* If you are using OAuth, remember that the `state` parameter in the authentication request must contain a unique session token to prevent request forgery attacks. The sample uses a randomly-generated GUID.

### Mobile clients

As of April 2019, Microsoft Teams mobile clients support the `signin` action protocol (that is, mobile clients work the same way as the desktop/web clients). It does require an updated version of the [Microsoft Teams JavaScript library](https://www.npmjs.com/package/@microsoft/teams-js) (1.4.1 or later). The way it used to work is described [here](fallbackUrl.md).
