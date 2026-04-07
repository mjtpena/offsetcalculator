import {
  ArrowRight,
  Upload,
  Building2,
  BarChart3,
  Eye,
  CalendarDays,
  TrendingUp,
  GitCompareArrows,
  Lightbulb,
  FileText,
  LineChart,
  Users,
  DollarSign,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

interface LandingProps {
  onNavigate: (view: string) => void
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen scroll-smooth">
      {/* ─── Hero ─── */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-light rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary-light rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center">
          <span className="badge-success text-sm mb-6 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Australian mortgage brokers
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-4xl mx-auto">
            Show your clients what their offset is{' '}
            <span className="text-accent">actually doing.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Most offset calculators assume a flat balance. Real life isn't flat
            — salaries land, bills go out, balances swing daily.{' '}
            <span className="text-white font-medium">
              OffsetIQ reconstructs the real picture from actual bank data.
            </span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('calculator')}
              className="btn-accent text-lg py-3 px-8 rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:scale-105 transition-all duration-200"
            >
              Try Free Calculator
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('import')}
              className="btn-secondary text-lg py-3 px-8 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <Upload className="w-5 h-5" />
              Import Statement
            </button>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            No sign-up required · Free tier available · AU bank formats supported
          </p>
        </div>
      </section>

      {/* ─── Problem / Solution ─── */}
      <section className="py-20 sm:py-28 bg-surface-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">
              Offset calculators are{' '}
              <span className="text-danger">broken</span>
            </h2>
            <p className="section-subtitle">
              Here's why every broker needs a better tool
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LineChart,
                title: 'Static calculators lie',
                description:
                  'Traditional offset calculators ask for a single balance. But nobody keeps the same balance every day — your clients certainly don't.',
                color: 'text-danger',
                bg: 'bg-danger/10',
              },
              {
                icon: CalendarDays,
                title: 'Real balances fluctuate daily',
                description:
                  'Salary deposits, mortgage repayments, groceries, bills — an offset account balance can swing by thousands in a single week.',
                color: 'text-warning',
                bg: 'bg-warning/10',
              },
              {
                icon: BarChart3,
                title: 'OffsetIQ uses real data',
                description:
                  'Upload a bank statement and we reconstruct the daily balance history. See exactly how much interest was actually saved — not a guess.',
                color: 'text-success',
                bg: 'bg-success/10',
              },
            ].map((card) => (
              <div key={card.title} className="card-hover text-center group">
                <div
                  className={`${card.bg} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-200`}
                >
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {card.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 sm:py-28 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">
              From statement upload to actionable insight in under 60 seconds
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                icon: Upload,
                title: 'Upload Statement',
                description:
                  'Drop a CSV or PDF bank statement from any major Australian bank.',
              },
              {
                step: 2,
                icon: Building2,
                title: 'Auto-Detect Bank',
                description:
                  'We identify the bank format automatically — CBA, ANZ, Westpac, NAB, and more.',
              },
              {
                step: 3,
                icon: BarChart3,
                title: 'Reconstruct Daily Balance',
                description:
                  'Every day's closing balance is calculated from the transaction history.',
              },
              {
                step: 4,
                icon: Eye,
                title: 'See Real Savings',
                description:
                  'Visualise actual interest saved vs. projected — with charts your clients will love.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="relative mx-auto mb-5">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-200">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Key Features ─── */}
      <section className="py-20 sm:py-28 bg-surface-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">Everything a broker needs</h2>
            <p className="section-subtitle">
              Powerful analysis tools that turn transaction data into client
              conversations
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CalendarDays,
                title: 'Daily Balance Reconstruction',
                description:
                  'Calculates the closing balance for every single day from raw transactions. No more guessing averages.',
              },
              {
                icon: TrendingUp,
                title: 'Historical Interest Analysis',
                description:
                  'See exactly how much interest your client's offset account has saved over any period.',
              },
              {
                icon: LineChart,
                title: 'Forward Projections',
                description:
                  'Model future scenarios — what if they increase their offset balance by $500/month?',
              },
              {
                icon: GitCompareArrows,
                title: 'Scenario Comparison',
                description:
                  'Compare multiple what-if scenarios side by side. Different rates, balances, or extra repayments.',
              },
              {
                icon: Lightbulb,
                title: 'Auto-Generated Insights',
                description:
                  'AI-powered observations about spending patterns, optimal balance targets, and savings opportunities.',
              },
              {
                icon: FileText,
                title: 'Branded Reports',
                description:
                  'Generate professional PDF reports with your branding to share with clients or use in reviews.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card-hover group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-20 sm:py-28 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">
              The numbers speak for themselves
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                value: '17,000+',
                label: 'Active Brokers in Australia',
              },
              {
                icon: DollarSign,
                value: '$2.4M+',
                label: 'Interest savings identified',
              },
              {
                icon: FileText,
                value: '50,000+',
                label: 'Statements processed',
              },
              {
                icon: ShieldCheck,
                value: '100%',
                label: 'Data stays in your browser',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <stat.icon className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-20 sm:py-28 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="section-title">Simple, transparent pricing</h2>
            <p className="section-subtitle">
              Start free. Upgrade when you're ready to impress more clients.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                description: 'Public offset calculator',
                featured: false,
                features: [
                  'Basic offset calculator',
                  'Single scenario',
                  'No sign-up required',
                ],
                cta: 'Get Started',
                ctaView: 'calculator',
              },
              {
                name: 'Starter',
                price: '$99',
                period: '/mo',
                description: 'For individual brokers',
                featured: true,
                features: [
                  'Statement import (CSV & PDF)',
                  'Daily balance reconstruction',
                  'Up to 3 scenarios',
                  'Historical interest analysis',
                  'Basic branded reports',
                ],
                cta: 'Start Free Trial',
                ctaView: 'register',
              },
              {
                name: 'Team',
                price: '$249',
                period: '/mo',
                description: 'For growing teams',
                featured: false,
                features: [
                  'Everything in Starter',
                  'Up to 5 team members',
                  'Unlimited scenarios',
                  'Forward projections',
                  'Priority support',
                ],
                cta: 'Start Free Trial',
                ctaView: 'register',
              },
              {
                name: 'Practice',
                price: '$499',
                period: '/mo',
                description: 'For aggregator groups',
                featured: false,
                features: [
                  'Everything in Team',
                  'Unlimited team members',
                  'Auto-generated insights',
                  'Custom branding & reports',
                  'API access',
                  'Dedicated account manager',
                ],
                cta: 'Contact Sales',
                ctaView: 'contact',
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  tier.featured
                    ? 'bg-primary text-white shadow-xl shadow-primary/25 ring-2 ring-primary scale-[1.03] lg:scale-105'
                    : 'card'
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-lg font-bold ${tier.featured ? 'text-white' : 'text-text-primary'}`}
                  >
                    {tier.name}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${tier.featured ? 'text-white/70' : 'text-text-muted'}`}
                  >
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span
                    className={`text-4xl font-extrabold ${tier.featured ? 'text-white' : 'text-text-primary'}`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm ${tier.featured ? 'text-white/70' : 'text-text-muted'}`}
                  >
                    {tier.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${tier.featured ? 'text-accent' : 'text-success'}`}
                      />
                      <span
                        className={
                          tier.featured ? 'text-white/90' : 'text-text-secondary'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigate(tier.ctaView)}
                  className={`w-full py-2.5 px-5 rounded-lg font-semibold transition-all duration-200 text-center ${
                    tier.featured
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'btn-primary justify-center'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 sm:py-28 bg-surface-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary leading-tight">
            Are you a broker?{' '}
            <span className="text-primary">
              Give this to your clients.
            </span>
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            Stop using spreadsheets and static calculators. Show your clients
            the real value of their offset account — backed by their own
            transaction data.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('calculator')}
              className="btn-accent text-lg py-3 px-8 rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:scale-105 transition-all duration-200"
            >
              Try the Free Calculator
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="btn-primary text-lg py-3 px-8 rounded-xl"
            >
              Create Broker Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
