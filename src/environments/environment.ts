// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  assistant: {
    // Paste the deployed Cloudflare Worker URL followed by /chat here.
    // For local Worker development, use http://localhost:8787/chat.
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.