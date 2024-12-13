/*
  After a user signs up for on Stripe with a one-time payment, the `payment_intent.succeeded` event delivers a request from Stripe to `/api/stripe/create` with the following data.

  We want to extract these fields:
  data.created
  data.object.id - payment intent id
  data.object.amount
*/

const data = {
  "id": "evt_3QAaGgCgzhWoiiPe1v1uH2dM",
  "object": "event",
  "api_version": "2023-08-16",
  "created": 1729096815,
  "data": {
    "object": {
      "id": "pi_3QAaGgCgzhWoiiPe1PrfsOAP",
      "object": "payment_intent",
      "amount": 499900,
      "amount_capturable": 0,
      "amount_details": {
        "tip": {
        }
      },
      "amount_received": 499900,
      "application": null,
      "application_fee_amount": null,
      "automatic_payment_methods": null,
      "canceled_at": null,
      "cancellation_reason": null,
      "capture_method": "automatic_async",
      "client_secret": "pi_3QAaGgCgzhWoiiPe1PrfsOAP_secret_TDujA8Pnm2SXz80A2zHH0lUGF",
      "confirmation_method": "automatic",
      "created": 1729096814,
      "currency": "usd",
      "customer": null,
      "description": null,
      "invoice": null,
      "last_payment_error": null,
      "latest_charge": "ch_3QAaGgCgzhWoiiPe1KYFzW51",
      "livemode": false,
      "metadata": {
      },
      "next_action": null,
      "on_behalf_of": null,
      "payment_method": "pm_1QAaGeCgzhWoiiPenHYdK1bh",
      "payment_method_configuration_details": null,
      "payment_method_options": {
        "card": {
          "installments": null,
          "mandate_options": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "processing": null,
      "receipt_email": null,
      "review": null,
      "setup_future_usage": null,
      "shipping": null,
      "source": null,
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "succeeded",
      "transfer_data": null,
      "transfer_group": null
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_Q87lPwityh5ddr",
    "idempotency_key": "c267d8de-c05f-4148-b00e-bf52899afd3b"
  },
  "type": "payment_intent.succeeded"
}