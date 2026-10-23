# Admin page setup

Sign in from **Settings** using an existing Firebase email/password account.
The app detects whether the account is a regular user or an administrator by
checking the user's UID against the Realtime Database `admins` path. The
Settings page does not create accounts; people can continue using the app as
guests. Administrators are sent to the separate `/admin` content-management
interface and are redirected there if they try to open the regular app. Use
the admin page's **Sign out** button to return to guest access. Database
rules—not the page itself—enforce admin-only writes.

## Grant admin access

1. In Firebase Console, open **Authentication > Sign-in method** and enable
   **Email/Password**.
2. Create the administrator account in **Authentication > Users**.
3. Copy that user's UID.
4. In **Realtime Database > Data**, set `admins/<UID>` to the boolean `true`.
   Do not grant admin access by email; the rules use the Firebase UID.

## Deploy the database rules

The repository's [database.rules.json](./database.rules.json) rules allow
public reads of periods, events, figures, and places, restrict writes to those
collections to UIDs listed under `admins`, and retain authenticated access to
the existing `favorites` path.

Review the rules against any other data paths or rules already in your live
database before deploying. These rules do not grant access to any other paths.
After review, deploy from the repository root with the Firebase CLI:

```powershell
firebase deploy --only database --project kasaysayan-explorer
```

If the live database has additional paths or different favorites permissions,
merge those existing requirements into `database.rules.json` before deploying.
The administrator marker is intentionally not writable by client apps; add or
remove it through Firebase Console or another trusted administrative tool.

## Content fields

The editor stores records under the existing `periods`, `events`, `figures`,
and `places` collections. Details and references are saved as arrays of lines.
Image values should be a URL or an asset path already available to the app;
the admin page does not upload image files.
