# WriteJokes 🎤

AI-powered comedy writing app for comedians. Get creative prompts, instant feedback, and build killer set lists.

## Features

- **AI Prompts**: Get personalized joke prompts based on your style and favorite comedians
- **Instant Grading**: Every joke is scored 1-10 with specific improvement tips
- **Set List Builder**: Drag-and-drop jokes into perfectly timed sets
- **Performance Notes**: AI-generated callbacks, stage directions, and recovery lines
- **Stats Dashboard**: Track your progress and identify your strongest styles

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Drag & Drop**: dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Stripe account

### 1. Clone and Install

```bash
git clone <repo-url>
cd writejokes
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Google OAuth in Authentication > Providers
4. Add your app URL to Authentication > URL Configuration

### 4. Set Up Stripe

1. Create products for monthly ($10) and yearly ($99) subscriptions
2. Copy the price IDs to your `.env.local`
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Enable events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

For local development:
```bash
npm run stripe:listen
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   ├── dashboard/         # Main dashboard
│   ├── write/             # Joke writing
│   ├── history/           # Joke history
│   ├── setlists/          # Set list manager
│   ├── stats/             # Statistics
│   └── settings/          # User settings
├── components/
│   ├── ui/                # Base UI components
│   ├── jokes/             # Joke-related components
│   ├── setlists/          # Set list components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & clients
│   ├── supabase/         # Supabase clients
│   ├── openai.ts         # OpenAI integration
│   ├── stripe.ts         # Stripe integration
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript types
```

## Database Schema

- **users**: User profiles, preferences, subscription status
- **jokes**: All jokes with prompts, scores, tips, metadata
- **set_lists**: Named set lists with venue notes
- **set_list_jokes**: Junction table for set list ordering
- **set_notes**: AI-generated performance notes
- **prompt_history**: Track used prompts for variety

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/prompts/generate` | POST | Generate new joke prompt |
| `/api/jokes/grade` | POST | Grade a joke |
| `/api/ai/generate-set` | POST | Generate optimized set list |
| `/api/ai/generate-notes` | POST | Generate performance notes |
| `/api/user/stats` | GET | Get user statistics |
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/stripe/portal` | POST | Open billing portal |

## Subscription Tiers

### Free
- 15 jokes per month
- 3 set lists maximum
- Basic AI prompts and grading

### Pro ($10/mo or $99/yr)
- Unlimited jokes
- Unlimited set lists
- AI set list generation
- Performance notes and callbacks
- Advanced analytics

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

---

Built for comedians, by comedy fans. 🎭
