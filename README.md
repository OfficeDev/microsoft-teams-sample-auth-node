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
description: 'This sample demonstrates authentication in Microsoft Teams apps.'
urlFragment: microsoft-teams-auth
extensions:
    contentType: samples
    createdDate: '2/8/2018 5:06:47 PM'
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

-   Environment variable overrides are defined in `config\custom-environment-variables.json`. You can set these environment variables when running node. If you are using Visual Studio Code, you can set these in your `launch.json` file.
-   Alternatively, you can specify local modifications in `config\local.json`.

The instructions below assume that you're using environment variables to configure the app, and will specify the name of the variable to set.

### [Using Azure AD](#using-azure-ad)

Registering a bot with the Microsoft Bot Framework automatically creates a corresponding Azure AD application with the same name and ID.

1. Go to the [Application Registration Portal](https://aka.ms/appregistrations) and sign in with the same account that you used to register your bot.
1. Find your application in the list and click on the name to edit.
1. Navigate to **Authentication** under **Manage** and add the following redirect URLs:

    - `https://<your_ngrok_url>/auth/azureADv1/callback`
    - `https://<your_ngrok_url>/tab/simple-end`
    - `https://<your_ngrok_url>/tab/silent-end`
    - `https://token.botframework.com/.auth/web/redirect`

1. Additionally, under the **Implicit grant** subsection select **Access tokens** and **ID tokens**

1. Click on **Expose an API** under **Manage**. Select the Set link to generate the Application ID URI in the form of api://{AppID}. Insert your fully qualified domain name (with a forward slash "/" appended to the end) between the double forward slashes and the GUID. The entire ID should have the form of: api://<your_ngrok_url>/{AppID}
1. Select the **Add a scope** button. In the panel that opens, enter `access_as_user` as the **Scope name**.
1. Set Who can consent? to Admins and users
1. Fill in the fields for configuring the admin and user consent prompts with values that are appropriate for the `access_as_user` scope. Suggestions:
    - **Admin consent title:** Teams can access the user’s profile
    - **Admin consent description**: Allows Teams to call the app’s web APIs as the current user.
    - **User consent title**: Teams can access your user profile and make requests on your behalf
    - **User consent description:** Enable Teams to call this app’s APIs with the same rights that you have
1. Ensure that **State** is set to **Enabled**
1. Select **Add scope**
    - Note: The domain part of the **Scope name** displayed just below the text field should automatically match the **Application ID** URI set in the previous step, with `/access_as_user` appended to the end; for example:
        - `api://<your_ngrok_url>/c6c1f32b-5e55-4997-881a-753cc1d563b7/access_as_user`
1. In the **Authorized client applications** section, you identify the applications that you want to authorize to your app’s web application. Each of the following IDs needs to be entered:
    - `1fec8e78-bce4-4aaf-ab1b-5451cc387264` (Teams mobile/desktop application)
    - `5e3ce6c0-2b1f-4285-8d4b-75ee78787346` (Teams web application)
1. Navigate to **API Permissions**, and make sure to add the follow permissions:
    - User.Read (enabled by default)
    - email
    - offline_access
    - openid
    - profile
1. Scroll to the bottom of the page and click on "Save".

1. The bot uses `MICROSOFT_APP_ID` and `MICROSOFT_APP_PASSWORD`, so these should already be set.

#### Update your Microsoft Teams application manifest

1. Add new properties to your Microsoft Teams manifest:

    - **WebApplicationInfo** - The parent of the following elements.
    - **Id** - The client ID of the application. This is an application ID that you obtain as part of registering the application with Azure AD 1.0 endpoint.
    - **Resource** - The domain and subdomain of your application. This is the same URI (including the `api://` protocol) that you used when registering the app in AAD. The domain part of this URI should match the domain, including any subdomains, used in the URLs in the section of your Teams application manifest.

    ```json
    "webApplicationInfo": {
    "id": "<application_GUID here>",
    "resource": "<web_API resource here>"
    }
    ```

1. Add permissions and update validDomains to allow token endpoint used by bot framework. Teams will only show the sign-in popup if its from a whitelisted domain.

    ```json
    "permissions": [
        "messageTeamMembers",
        "identity"
    ],
    "validDomains": [
        "<<BASE_URI_DOMAIN>>",
        "token.botframework.com"
    ],
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

The Azure Bot Service v4 SDK facilitates the development of bots that can access online resources that require authentication. Your bot does not need to manage authentication tokens. Azure does it for you using OAuth2 to generate a token, based on each user's credentials. Your bot uses the token generated by Azure to access those resources. In this way, the user does not have to provide ID and password to the bot to access a secured resource but only to a trusted identity provider.

For an overview of how the Bot Framework handles authentication, see [Bot authentication](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0).

For the bot authentication to work you will need:

1. An Azure Active Directory (AD) application to register a bot resource in Azure. This application allows the bot to access an external secured resource, such as Microsoft Graph. It also allows the user to communicate with the bot via several channels such as Web Chat.
2. A separate Azure AD application that functions as the identity provider. This application provides the credentials needed to establish an OAuth connection between the bot and the secured resource. Notice that this article uses Active Directory as an identity provider. Many other providers are also supported.

Follow the documentation [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=aadv2%2Cjavascript#create-the-azure-bot-application) to:

1. [Create the Azure bot application](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=aadv2%2Cjavascript#create-the-azure-bot-application)
1. [Create the Azure AD identity application](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=aadv2%2Cjavascript#create-the-azure-ad-identity-application) - You don't need to do this step. We will reuse the same applicationId we created earlier in the [Using Azure AD](#using-azure-ad) section
1. [Register the Azure AD OAuth application with the bot](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=aadv2%2Cjavascript#tabpanel_CeZOj-G++Q_aadv2)
1. Set the appropriate environment variables `LINKEDIN_CONNECTIONNAME`, `GOOGLE_CONNECTIONNAME` and/or `AZUREAD_CONNECTIONNAME` to `<oauth_connection_name>`. (The same name(s) that you set in the **OAuth Connection Settings** for the bot channel registration in the previous step.)

### Testing the connection

1. Open the [Bot Channel Registrations](https://ms.portal.azure.com/#blade/HubsExtension/BrowseResourceBlade/resourceType/Microsoft.BotService%2FbotServices) blade on the Azure Portal
1. Navigate to your bot channel registration resource
1. Click on **Test in Web Chat**. If the connection is successful you should be able to see a chat window. This is essentially a Bot Emulator window. You can even test the bot here if its configured and running.

### Security notes

-   The verification code mechanism prevents a potential ["man in the middle" attack](https://hueniverse.com/explaining-the-oauth-session-fixation-attack-aa759250a0e7) by requiring evidence that the user who authorized the bot in the browser is the same person as the user who is chatting with the bot. **Don't** remove the need for a verification code without understanding what it is protecting against, and weighing the risk against your use case and threat model.
-   Don't use the `signin/verifyState` message to pass sensitive data (e.g., access tokens) directly to your bot in plaintext. The `state` value should not be usable without additional information that's available only to your bot.
-   The Teams app sends the `signin/verifyState` invoke message in a way that's equivalent to the user typing a message to your bot. This means that although the user information in the message is not falsifiable, a malicious user **can** tamper with the payload, or send additional invoke messages that were not initiated by your app.
-   Store your users’ access tokens in such a way that they are encrypted at rest, especially if you are also storing refresh tokens. Consider, based on your use case and threat model, how often to rotate the encryption key. (The sample uses an in-memory store for simplicity; do not do this in your production app!)
-   If you are using OAuth, remember that the `state` parameter in the authentication request must contain a unique session token to prevent request forgery attacks. The sample uses a randomly-generated GUID.

### Mobile clients

As of April 2019, Microsoft Teams mobile clients support the `signin` action protocol (that is, mobile clients work the same way as the desktop/web clients). It does require an updated version of the [Microsoft Teams JavaScript library](https://www.npmjs.com/package/@microsoft/teams-js) (1.4.1 or later). The way it used to work is described [here](fallbackUrl.md).
