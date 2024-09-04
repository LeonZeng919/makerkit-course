/**
 * This is a sample billing configuration file. You should copy this file to `billing.config.ts` and then replace
 * the configuration with your own billing provider and products.
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// The billing provider to use. This should be set in the environment variables
// and should match the provider in the database. We also add it here so we can validate
// your configuration against the selected provider at build time.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  // also update config.billing_provider in the DB to match the selected
  provider,
  // products configuration
  products: [
    {
      id: 'support-tickets',
      name: 'Support Tickets',
      badge: 'Free',
      description: 'Manage your customer support tickets efficiently',
      currency: 'USD',
      features: ['Up to 50 tickets per month', '$0 per agent', 'Email support'],
      plans: [
        {
          id: 'free-plan',
          name: 'Free Plan',
          lineItems: [],
          custom: true,
          label: 'Free',
          buttonLabel: 'Get started with the free plan',
          paymentType: 'recurring',
          interval: 'month',
        },
        {
          id: 'free-plan-yearly',
          name: 'Free Plan',
          lineItems: [],
          custom: true,
          label: 'Free',
          buttonLabel: 'Get started with the free plan',
          paymentType: 'recurring',
          interval: 'year',
        },
      ],
    },
    {
      id: 'starter-plan',
      name: 'Starter Plan',
      badge: 'Popular',
      highlighted: true,
      description: 'The best plan for small teams',
      currency: 'USD',
      features: [
        'Up to 1000 tickets per month',
        'Email support',
        'Up to 5 agents',
      ],
      plans: [
        {
          id: 'starter-plan-monthly',
          name: 'Starter Plan Monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'starter-base-price',
              name: 'Base Price',
              type: 'flat',
              cost: 49,
            },
            {
              id: 'starter-per-seat',
              name: 'Per Seat',
              type: 'per_seat',
              cost: 10,
            },
          ],
        },
        {
          id: 'starter-plan-yearly',
          name: 'Starter Plan Yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'starter-base-yearly',
              name: 'Base Price',
              type: 'flat',
              cost: 490,
            },
            {
              id: 'starter-per-seat-yearly',
              name: 'Per Seat',
              type: 'per_seat',
              cost: 100,
            },
          ],
        },
      ],
    },
    {
      id: 'pro-plan',
      name: 'Pro Plan',
      description: 'The best plan for growing teams',
      currency: 'USD',
      features: [
        'Unlimited tickets per month',
        'Priority support',
        'Email and phone support',
      ],
      plans: [
        {
          id: 'pro-plan-monthly',
          name: 'Pro Plan Monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'pro-base-price-monthly',
              name: 'Base Price',
              type: 'flat',
              cost: 199,
            },
            {
              id: 'pro-per-seat-monthly',
              name: 'Per Seat',
              type: 'per_seat',
              cost: 10,
            },
          ],
        },
        {
          id: 'pro-plan-yearly',
          name: 'Pro Plan Yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'pro-base-price-yearly',
              name: 'Base Price',
              type: 'flat',
              cost: 1990,
            },
            {
              id: 'pro-per-seat-yearly',
              name: 'Per Seat',
              type: 'per_seat',
              cost: 100,
            },
          ],
        },
      ],
    },
  ],
});
