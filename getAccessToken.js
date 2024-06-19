const { google } = require('googleapis');
const path = require('path');
const serviceAccount = require(path.join(__dirname, './serviceAccountKey.json')); // Asegúrate de que la ruta sea correcta

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key.replace(/\\n/gm, '\n'),
    },
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse.token;
  return accessToken;
}

getAccessToken().then(token => {
  console.log('Access Token:', token);
}).catch(error => {
  console.error('Error fetching access token:', error);
});
