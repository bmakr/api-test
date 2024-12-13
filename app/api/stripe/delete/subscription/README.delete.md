# DELETE
`api/stripe/delete/subscription`

## Actualed Plans

Currently, we have many roles, but only one plan that is being automated as a self-service option through Stripe" `performer`

## What we listen for:

There are other events that can be added to the webhook, but we only use `customer.subscription.deleted`, which is sent when the subscription expires (at the end of the previously payment period).

## What we update
  - remove `performer` from roles

## More information

While we are only handling the deletion of the subscription from Stripe on this api endpoint, there are multiple reasons for a user's plan to cancel:
  - Card expired
  - Insufficient funds
  - Direct cancellation through the stripe customer portal

  The card number to simulate payment failures is `4000000000009995`

  TODO: we need to create a way to alert the user to a payment failure they did not intend. By properly handling the invoice.payment_failed event, we can proactively manage failed payments, reduce churn, and improve your overall payment success rate.

  ## Additional Information

  The customer may cancel their subscription with time remaining on their current pay period.

  When this happens, the event we want to listen to is `customer.subscription.updated`

  At the very least, we want to know when a customer has cancelled, so we can track our churn rate, so we can send ourselves an email notification.