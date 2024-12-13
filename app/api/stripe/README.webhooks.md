# Webhooks

We have two webhooks on Stripe that connect with our api through events:
  - `api/stripe/create/subscription` - add the `performer` role to user.roles and a stripeCustomerId
  - `api/stripe/delete/subscription` - remove the `performer` role from user.roles 

### Roles
Roles provide authorization to use view inside the authenticated of the app, mainly `/create` which is the main area where we incur costs through the use of AI.

### Plans
A plan is correlated to a product and price on Stripe. The product name is the same as the plan name on Actual. The price is determined by the interval of payment, i.e., one-time, monthly, annually.

The only plan we offer right now is `performer`. (TODO: update the ids before we go live):
- Free (no plan and no interaction with Stripe)
- Performer `prod_R2fKyZoJX14GHc`
  -- $899.00 Annual `price_1QAa0JCgzhWoiiPe8r6xjjG5`
  -- $99.00 Monthly `price_1QAa0mCgzhWoiiPeYfQbGYtQ`


### Webhooks
We have set up two webhooks to manage:
- Signup `api/stripe/create/subscription`
- Cancellation `api/stripe/delete/subscription`

### Additional Information

Inside each of the `api/stripe/*` folders, we explore in more detail the mechanics of each endpoint in a README.
