import type { SavedBlueprint } from './types';

export const DEMO_MARKDOWN = `# E-commerce purchase journey

> End-to-end mapping of the customer experience purchasing a product from an e-commerce platform — from discovery through post-delivery support.

## Discovery & awareness

### Task
Find a product that meets their need through search or browsing.

### Mindset
Curious and exploratory — scanning quickly, comparing options, forming first impressions about brand trust.

### Frontstage
- Homepage hero banner and featured collections
- Search bar with autocomplete suggestions
- Product listing pages with filter and sort controls
- Social media ads and retargeting banners
- Email newsletter with curated picks

### Backstage
- Search ranking algorithm processes query
- Personalisation engine surfaces relevant products
- A/B testing framework serves variant layouts
- CDN delivers assets within 200ms target

### Actors
- Customer
- Marketing team
- Data science team

### Systems
- Search and indexing engine (Elasticsearch)
- Personalisation platform (Segment + internal ML)
- CMS for homepage content
- Email marketing platform (Klaviyo)

### Data
- Search query logs
- Click-through rate per listing
- Session source and UTM parameters
- Previous purchase and browse history

### KPIs
- Search result click-through rate — > 12%
- Homepage bounce rate — < 45%
- Time to first product view — < 30 seconds
- Email open rate — > 24%

## Product evaluation

### Task
Assess product quality, fit, and value before committing to purchase.

### Mindset
Cautious and analytical — reading reviews, checking sizing, comparing prices, looking for trust signals.

### Frontstage
- Product detail page with images, video, and description
- Size guide and fit recommendation tool
- Customer review section with verified badges
- Live chat widget for product questions
- Related products and bundle recommendations

### Backstage
- Review aggregation service pulls and ranks reviews
- Inventory check confirms stock availability in real time
- Price comparison engine monitors competitor pricing
- Image CDN serves zoomable photography

### Actors
- Customer
- Customer service agent
- Merchandising team

### Systems
- Product information management (PIM)
- Review platform (Yotpo)
- Live chat (Intercom)
- Inventory management system

### Data
- Time on product page
- Scroll depth and image-zoom interactions
- Review helpfulness votes
- Add-to-cart conversion rate

### KPIs
- PDP to add-to-cart rate — > 8%
- Average reviews per product — > 12
- Chat first response time — < 30 seconds

## Cart & checkout

### Task
Select final items, apply discounts, and complete the transaction securely.

### Mindset
Goal-oriented but friction-sensitive — any unexpected cost, slow page, or confusing step risks abandonment.

### Frontstage
- Shopping cart summary with editable quantities
- Promo code and loyalty points redemption field
- Multi-step checkout flow (address, shipping, payment)
- Express checkout buttons (Apple Pay, Google Pay)
- Order review screen with shipping estimate

### Backstage
- Cart persistence service syncs across devices
- Fraud detection engine scores transaction in real time
- Payment gateway processes card or wallet charge
- Tax and shipping calculation service
- Inventory hold placed on selected items

### Actors
- Customer
- Fraud analyst
- Finance team

### Systems
- Checkout platform (custom)
- Payment gateway (Stripe)
- Fraud detection (Signifyd)
- Tax engine (Avalara)

### Data
- Cart abandonment funnel events
- Payment method distribution
- Promo code usage and lift
- Address validation success rate

### KPIs
- Cart-to-purchase conversion — > 68%
- Checkout completion time — < 90 seconds
- Payment failure rate — < 2%
- Fraud catch rate — > 95%

## Order confirmation & fulfilment

### Task
Receive confirmation that the order was placed and track its progress toward delivery.

### Mindset
Relieved but expectant — wants immediate confirmation, clear timeline, and proactive status updates.

### Frontstage
- Order confirmation page with order number and summary
- Confirmation email with estimated delivery date
- SMS notification when order is picked and shipped
- Order tracking page with live carrier status
- Account order history view

### Backstage
- OMS creates order record and triggers warehouse pick list
- Warehouse management system (WMS) routes to correct facility
- Carrier API assigns tracking number and updates status
- Notifications service triggers email and SMS on milestones

### Actors
- Customer
- Warehouse operator
- Fulfilment manager
- Carrier dispatcher

### Systems
- Order management system (OMS)
- Warehouse management system (WMS)
- Carrier integrations (FedEx, UPS, DHL)
- Notification platform

### Data
- Pick and pack time per order
- Carrier handoff timestamp
- Shipping cost per order
- Status update latency

### KPIs
- Order confirmation delivery — < 60 seconds
- Pick and pack time — < 4 hours
- On-time shipment rate — > 96%

## Delivery & unboxing

### Task
Receive the physical product and assess whether it matches expectations.

### Mindset
Excited but evaluative — the unboxing moment is a critical emotional peak that shapes loyalty and social sharing intent.

### Frontstage
- Physical package and unboxing experience
- Branded tissue paper, insert card, and thank-you note
- QR code on insert linking to care guide or loyalty programme
- Delivery confirmation email with care tips
- Post-purchase review request after 5 days

### Backstage
- Carrier marks delivery event and updates tracking API
- Delivery confirmation triggers post-purchase email sequence
- Quality control team audits packaging samples weekly
- Customer feedback loop into merchandising

### Actors
- Customer
- Last-mile delivery driver
- Packaging design team
- QA inspector

### Systems
- Carrier tracking webhooks
- Post-purchase email automation
- Quality audit dashboard

### Data
- Delivery date vs. promise gap
- Package condition reports
- Unboxing video mentions on social
- Review submission rate

### KPIs
- On-time delivery rate — > 94%
- Unboxing NPS — > 70
- Review submission rate — > 18%

## Post-purchase support

### Task
Resolve any issues — returns, exchanges, warranty claims, or general questions.

### Mindset
Frustrated or uncertain — the quality of this experience determines whether the customer becomes loyal or churns.

### Frontstage
- Self-service returns portal with pre-paid label
- Help centre with searchable FAQ articles
- Live chat and email ticketing
- Refund status tracker in account
- Loyalty programme communications

### Backstage
- Support ticket prioritisation engine
- Returns warehouse receives, inspects, and restocks
- Refund processing via payment gateway
- Customer health score feeds retention models

### Actors
- Customer
- Support agent
- Returns warehouse operator
- Retention team

### Systems
- Helpdesk (Zendesk)
- Returns management system
- Knowledge base (Helpjuice)

### Data
- Ticket resolution time
- Return reason taxonomy
- Refund issued amounts
- Customer satisfaction (CSAT) score

### KPIs
- First contact resolution — > 72%
- Refund processing time — < 48 hours
- Post-resolution CSAT — > 4.6 / 5
`;

export const DEMO_BLUEPRINTS: SavedBlueprint[] = [
  {
    id: 'ecom-purchase',
    title: 'E-commerce purchase journey',
    description: 'End-to-end customer journey from discovery to post-purchase support.',
    stageCount: 6,
    lastEdited: '2 hours ago',
    owner: 'You',
    status: 'Published',
    markdown: DEMO_MARKDOWN,
  },
  {
    id: 'patient-onboarding',
    title: 'New patient onboarding',
    description: 'First-visit experience for a telehealth platform — from referral to follow-up.',
    stageCount: 5,
    lastEdited: 'Yesterday',
    owner: 'Priya M.',
    status: 'Draft',
  },
  {
    id: 'enterprise-trial',
    title: 'Enterprise trial activation',
    description: 'Sales-assisted trial from first call to paid contract.',
    stageCount: 7,
    lastEdited: '3 days ago',
    owner: 'Devon K.',
    status: 'Published',
  },
  {
    id: 'restaurant-pickup',
    title: 'Restaurant pickup order',
    description: 'Mobile-first ordering and pickup flow for a quick-service restaurant chain.',
    stageCount: 4,
    lastEdited: 'Last week',
    owner: 'You',
    status: 'Draft',
  },
];
