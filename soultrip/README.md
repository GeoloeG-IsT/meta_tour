# SoulTrip - Transformational Travel Platform

A community-first, AI-powered platform for transformational travel experiences including spiritual journeys, retreats, and conscious travel.

## 🌟 Features

### For Travelers
- **Discover Tours**: Browse curated transformational travel experiences
- **Community Connection**: Connect with like-minded travelers
- **Personal Journey Tracking**: Track your transformation progress
- **Secure Booking**: Simple, secure booking with flexible payment options

### For Organizers
- **Journey Builder**: Create beautiful tours with rich itineraries
- **Participant Management**: Complete CRM for tour management
- **Payment Processing**: Flexible payments with installment support
- **Community Tools**: Build and nurture traveler communities
- **AI Assistant**: AI-powered content creation and marketing help

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Stripe with multi-provider abstraction
- **Deployment**: Google Cloud Run
- **Testing**: Jest, React Testing Library, Playwright
- **Styling**: Tailwind CSS with custom design system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/soultrip/platform.git
   cd soultrip
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   
   # Other services
   OPENAI_API_KEY=your_openai_key
   MAILGUN_API_KEY=your_mailgun_key
   ```

4. **Setup Supabase database**
   ```bash
   npm run db:setup
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
soultrip/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── forms/          # Form components
│   │   └── features/       # Feature-specific components
│   ├── lib/                # Utilities and configurations
│   │   ├── supabase.ts     # Supabase client
│   │   ├── stripe.ts       # Stripe configuration
│   │   ├── types.ts        # TypeScript types
│   │   └── utils.ts        # Utility functions
│   └── styles/             # Global styles
├── tests/                  # Test files
├── docs/                   # Documentation
└── config/                 # Configuration files
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🎨 Design System

SoulTrip uses a custom design system built on Tailwind CSS:

- **Colors**: Earth tones, spiritual purples, nature greens
- **Typography**: Inter (body), Playfair Display (headings)
- **Components**: Accessible, responsive, and beautiful
- **Animations**: Subtle, meaningful transitions

## 📊 Quality Standards

- **Test Coverage**: >85% overall, >95% for critical paths
- **Performance**: Lighthouse score >90
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: PCI DSS Level 1 for payments

## 🚢 Deployment

### Development
```bash
npm run build
npm start
```

### Production (Google Cloud Run)
```bash
# Build and deploy
gcloud run deploy soultrip --source .
```

## 📈 Analytics & Monitoring

- **Analytics**: PostHog for product analytics
- **Error Tracking**: Sentry for error monitoring
- **Performance**: Google Cloud Monitoring
- **User Feedback**: Built-in feedback collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for all new features
- Use conventional commits
- Ensure accessibility standards
- Follow the established design system

## 📝 API Documentation

API documentation is available at `/docs/api` when running the development server.

## 🔒 Security

- All payments processed securely through Stripe
- PCI DSS Level 1 compliance
- GDPR compliant data handling
- Regular security audits and updates

## 🌍 Internationalization

Currently supported languages:
- English (en)
- Ukrainian (uk)

To add a new language, see our [i18n guide](docs/internationalization.md).

## 📞 Support

- **Documentation**: [docs.soultrip.com](https://docs.soultrip.com)
- **Community**: [Discord](https://discord.gg/soultrip)
- **Email**: support@soultrip.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love by the SoulTrip team
- Inspired by conscious travelers worldwide
- Powered by the transformational travel community

---

**Ready to transform travel? Let's build something amazing together! 🌟**