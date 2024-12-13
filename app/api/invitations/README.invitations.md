**Send an Invitation to a friend Flow**

**/share**
- [ ]  `/share` screen - inviter enters invitee(s) info in form to send emails
- [ ]  TODO: add text messaging
- [ ]  `/api/invitations/[userId]`

***Save Invitee data***
- [ ]  Lookup `users:emails:[email]`to find their user id if they have one

**If they do not have a userId**
- [ ]  **generate a new user with userId** called inviteeId to distinguish from userID/inviterId and save to `users:[inviteeId]` with the value 
```
{ 
  id: inviteeId,
  createdAt: timestamp,
  invitedAts: timestamp[],
  invitedBys: number[],
  name: [name], 
  email?: [email], 
  phone?: [phone] 
}
```
- [ ]  Save `users:emails:[email]` 

- [ ]  **If they already have a user id**,
- [ ]  Update the `users[inviteeId]` with `invitedBys.push(inviterId)` and `invitedAts.push(nowInSeconds())`
- [ ]  Save/update `users:[inviteeId]:actionIds`
- [ ]  Save `users:[inviteeeId]:invitations:received`
- [ ]  Save `users:[inviteeId]:notifications` 
`{ actionId: number, userId: number, isRead: boolean }`
- [ ]  Increment `users:[inviteeId]:hasUnreadNotifications` number
- [ ]  Save/update `users:[inviterId]:actions`

**Save inviter data**

- [ ]  Check `users:[inviterId]:invitations:sent` and invitesSentAt to track how many invitations this user has sent in the past week, restrict number to 50 per week (send email to admin if they go over this number)
- [ ]  Update `users:[inviterId]:invitations:sent`
- [ ]  Save `actions:[actionId]` as a single source of truth for a single action
```
{
  id: number,
  createdAt,
  type: ‘invite’ | 'completion',
  inviteeId: number,
  deckId?: number,
  email? string,
  phone?: string,
  name: string[],
  roles: ['free',...]
}
```
- [ ]  Save/update `feed:[teamId]:actionIds` as zset with 
```
{
  score: timestamp,
  body: number
}
```
to populate \/feed
- [ ]  Update `users:[inviterId]:actionIds`
- [ ]  Save/update `users:[inviterId]:notifications` 
```
{
   score: timestamp
   value: {  actionId: number, isRead: boolean }
}
```

**Communication with Invitee**
- [ ]  Create email template with deck design
- [ ]  Send email
- [ ]  Include a link which directs the user to a browser: `actual.so/invitation/[action-id]`
- [ ]  **When the invitee clicks on the link**
- [ ]  Create `/invitation/[actionId]`
- [ ]  Web app determines what type of device they are on and looks up the actions:[actionId]
- [ ]  Welcome to Actual, [name] enter your email to verify your identity
- [ ]  Create `/api/invitations/verify`
- [ ]  If there’s a match and the timestamp has not expired (1 day) open new session
- [ ]  Allow resend if invite has expired
- [ ]  **If they are on desktop,**
- [ ]  After verification, open `/invite/[id]`
- [ ]  If `Platform.OS === ‘web’`
- [ ]  Open modal on /invite/[id] if  letting the person know that the app is available on iOS and Android
- [ ]  For next steps on native, we need to set up deep linking: see [Set up deep linking]()