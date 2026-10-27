// environment.prod.ts

export const environment = {
  production: true,
  assistant: {
    // Public URL only, never a Cloudflare API token.
    endpoint: 'https://kasaysayan-history-assistant.kasaysayanexplorer.workers.dev/chat'
  },
  firebase: {
    apiKey: "AIzaSyCxpAKxBkWJbQqTCU56E9m56sIPSm7nhL8",
    authDomain: "kasaysayan-explorer.firebaseapp.com",
    databaseURL: "https://kasaysayan-explorer-default-rtdb.firebaseio.com/",
    projectId: "kasaysayan-explorer",
    storageBucket: "kasaysayan-explorer.firebasestorage.app",
    messagingSenderId: "343115582581",
    appId: "1:343115582581:web:ff0d6ac38b1413dc2fbc3c"
  }
};
