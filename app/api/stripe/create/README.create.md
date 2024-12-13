# CREATE 
`api/stripe/create/subscription`

## Actualed Plans

Currently, we have many roles, but only one plan that is being automated as a self-service option through Stripe" `performer`

## Plan Types
Stripe offers at least two plan types:
  - one time payment
  - subscription

Stripe sends different events for these two that do not overlap, so if we were to add a one time payment option in the future, we would need to listen for 2 events.

## What we listen for:

There are other events that can be added to the webhook, but we only use `checkout.session.completed`, which will pass us the `client_reference_id` we need to access the user session and their user.id

## What we update
  - update roles with `performer`
  - add `user.stripeCustomerId` to the user object 
  - add `users:[userId]:stripeCustomerId`: [stripeCustomerId] index
  - add `stripe.[stripeCustomerId].userId`: [userId] index

## More Information
We differentiate between the following event types (Multiple Stripe events are triggered when a user signs up for a plan, and we choose the ones we listen to through the webhook interface):
  - `checkout.session.completed` - we can access the needed data from the Stripe data object: `client_reference_id` which we passed to Stripe via query param in the payment link as `?client_reference_id=[sessionId]`. From the sessionId, we get the user.
  - `customer.subscription.created` - we don' use this event because it does not pass us the `client_reference_id`
  







