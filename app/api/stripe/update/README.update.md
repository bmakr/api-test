# UPDATE 
`api/stripe/update/subscription`

## Overview
As of right now, there are just one paid plan managed via Stripe: `performer`, so there are only 2 options that are managed via stripe: subscribe and cancel. 

We only record the data when we receive an update from an action taken by a user and send ourselves the relevant information by email, so we can track what's happening with our users in real-time.

## Plan changes
When a user accesses the stripe customer portal from their profile and makes a change to their plan (cancel or renew), we receive a data object containing the relevant information from the `customer.subscription.updated` event.

## What do we do
  - We keep a record of the change in `stripe:subscriptions:[user.id]` where we can track the updates and handle any use cases as they arise.
  - We send ourselves an email


We also need `api/stripe/portal` to create a real-time link if the user is choosing to make changes to their subscription (cancel). The link to the stripe customer portal is generated on the profile page.



