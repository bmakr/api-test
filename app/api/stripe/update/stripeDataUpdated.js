/*
  Webook gets triggered when a 
  customer.subscription.updated event
  occurs on Stripe

  we save some of the data to users:[id]:stripe as an zset with nowInSeconds as the score to keep a record of the users stripe activity over time
  
  data.object.id - subscription id
  data.object.created
  data.object.customer
  data.object.items - subscription items[]
    [0].data.plan.id - new price id
    [0].data.plan.amount - example 89900 === $899
    [0].data.plan.product - product id
    [0].data.price.recurring: {
      interval: 'year',
      interval_count: 1,
    }
*/

const stripeReturnData = {
  "id": "evt_1QACZmCgzhWoiiPekT8Jx0hA",
  "object": "event",
  "api_version": "2023-08-16",
  "created": 1729005741,
  "data": {
    "object": {
      "id": "sub_1QACQeCgzhWoiiPeq1uUyuRK",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "enabled": true,
        "liability": {
          "type": "self"
        }
      },
      "billing_cycle_anchor": 1729005740,
      "billing_cycle_anchor_config": null,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1729005176,
      "currency": "usd",
      "current_period_end": 1760541740,
      "current_period_start": 1729005740,
      "customer": "cus_R2Gypqoy4zwMOz",
      "days_until_due": null,
      "default_payment_method": "pm_1QACQcCgzhWoiiPepPLfRR3N",
      "default_source": null,
      "default_tax_rates": [
      ],
      "description": null,
      "discount": null,
      "discounts": [
      ],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_R2GyC8Ez4nDE2P",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1729005177,
            "discounts": [
            ],
            "metadata": {
            },
            "plan": {
              "id": "price_1Q9tOjCgzhWoiiPeChKgQWyp",
              "object": "plan",
              "active": true,
              "aggregate_usage": null,
              "amount": 89900,
              "amount_decimal": "89900",
              "billing_scheme": "per_unit",
              "created": 1728932021,
              "currency": "usd",
              "interval": "year",
              "interval_count": 1,
              "livemode": false,
              "metadata": {
              },
              "meter": null,
              "nickname": null,
              "product": "prod_R1xJrD57EmC7VJ",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Q9tOjCgzhWoiiPeChKgQWyp",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1728932021,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {
              },
              "nickname": null,
              "product": "prod_R1xJrD57EmC7VJ",
              "recurring": {
                "aggregate_usage": null,
                "interval": "year",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 89900,
              "unit_amount_decimal": "89900"
            },
            "quantity": 1,
            "subscription": "sub_1QACQeCgzhWoiiPeq1uUyuRK",
            "tax_rates": [
            ]
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1QACQeCgzhWoiiPeq1uUyuRK"
      },
      "latest_invoice": "in_1QACZkCgzhWoiiPeftZo3BCg",
      "livemode": false,
      "metadata": {
      },
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Q9tOjCgzhWoiiPeChKgQWyp",
        "object": "plan",
        "active": true,
        "aggregate_usage": null,
        "amount": 89900,
        "amount_decimal": "89900",
        "billing_scheme": "per_unit",
        "created": 1728932021,
        "currency": "usd",
        "interval": "year",
        "interval_count": 1,
        "livemode": false,
        "metadata": {
        },
        "meter": null,
        "nickname": null,
        "product": "prod_R1xJrD57EmC7VJ",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1729005176,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    },
    "previous_attributes": {
      "billing_cycle_anchor": 1729005411,
      "current_period_end": 1731683811,
      "current_period_start": 1729005411,
      "items": {
        "data": [
          {
            "id": "si_R2GyC8Ez4nDE2P",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1729005177,
            "discounts": [
            ],
            "metadata": {
            },
            "plan": {
              "id": "price_1Q9tVGCgzhWoiiPeo5ckFu9c",
              "object": "plan",
              "active": true,
              "aggregate_usage": null,
              "amount": 9900,
              "amount_decimal": "9900",
              "billing_scheme": "per_unit",
              "created": 1728932426,
              "currency": "usd",
              "interval": "month",
              "interval_count": 1,
              "livemode": false,
              "metadata": {
              },
              "meter": null,
              "nickname": null,
              "product": "prod_R1xJrD57EmC7VJ",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Q9tVGCgzhWoiiPeo5ckFu9c",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1728932426,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {
              },
              "nickname": null,
              "product": "prod_R1xJrD57EmC7VJ",
              "recurring": {
                "aggregate_usage": null,
                "interval": "month",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 9900,
              "unit_amount_decimal": "9900"
            },
            "quantity": 1,
            "subscription": "sub_1QACQeCgzhWoiiPeq1uUyuRK",
            "tax_rates": [
            ]
          }
        ]
      },
      "latest_invoice": "in_1QACURCgzhWoiiPeS05CoLvC",
      "plan": {
        "id": "price_1Q9tVGCgzhWoiiPeo5ckFu9c",
        "amount": 9900,
        "amount_decimal": "9900",
        "created": 1728932426,
        "interval": "month"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 2,
  "request": {
    "id": null,
    "idempotency_key": "f118e11c-c5f6-4d46-aa0d-9eabd3652b58"
  },
  "type": "customer.subscription.updated"
}