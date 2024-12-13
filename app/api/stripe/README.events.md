# Stripe General Usage
See below for how we handle stripe events for users who signup, make updates, or cancel their plan through Stripe.

## Subscription Creation
When a user signs up for a subscription on Stripe, several events are available to listen for through webhooks, but we only listen for: `checkout.session.completed` because it passes the `client_reference_id` we need to get the user object from their session.

## Missed payments
When a user misses a payment, the `invoice.payment_failed` event is fired. TODO: add this functionality

## Direct Cancellation

First of all, we want to handle the use case when a user cancels the plan.

  - When the user cancels the plan, the `customer.subscription.updated` event is fired
  - When the period covered by the previous payment expires, the `customer.subscription.deleted` event is fired

  So, the absolute need is to update user.roles when we receive the `customer.subscription.deleted` object

## Failed Payment

Inside the `customer.subscription.deleted` data object, we can use the cancellation_details.reason field to determine if the cancellation was due to a user request `cancellation_requested` or payment issues `payment_failed`.

We can also break out the functionality into separate events using `invoice.payment_failed`

### invoice.payment_failed event

Listen for `invoice.payment_failed` to:
  - Detect when a payment attempt fails.
  - Implement retry logic or notify the customer about the failed payment.
  - Take proactive measures to prevent subscription cancellation.

Handling:
  - Notify the customer about the failed payment.
  - Prompt them to update their payment method.
  - Implement a retry strategy for the failed payment.

### customer.subscription.deleted

Listen for customer.subscription.deleted to:
  - Detect when a subscription is actually cancelled5.
  - Update your app's internal state to reflect the cancelled subscription.
  - Take appropriate actions like revoking access to paid features.
Handling:
  - Update the user's subscription status in your database.
  - Revoke access to premium features.
  - Notify the customer about the cancellation.

By listening to both events, we can create a robust system that handles failed payments proactively and manages subscription cancellations effectively, providing a smooth experience for our users.

### Additional Information

Inside each of the `api/stripe/*` folders, we explore in more detail the mechanics of each endpoint in a README.