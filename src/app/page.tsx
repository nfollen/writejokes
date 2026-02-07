'use client';

import Link from 'next/link';
import { Mic2, Sparkles, BarChart3, ListMusic, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 stage-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Mic2 className="w-10 h-10 text-primary" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              Write More Jokes.{' '}
              <span className="gradient-text">Get Better Faster.</span>
            </h1>

            <p className="text-xl text-muted max-w-2xl mx-auto">
              The writing tool built for standup comedians. Increase your output, 
              test new material regularly, and build stage-ready sets.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border hover:border-primary/50 text-foreground font-semibold rounded-xl transition-all"
              >
                See How It Works
              </Link>
            </div>

            <p className="text-sm text-muted">
              Free to start • No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Write More. Perform Better.</h2>
            <p className="text-muted max-w-xl mx-auto">
              Stop staring at a blank page. Start building your best material.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Daily Prompts',
                description: 'Fresh writing prompts matched to your style. Never run out of ideas.',
              },
              {
                icon: BarChart3,
                title: 'Quick Feedback',
                description: 'Get instant notes on structure, timing, and punchlines.',
              },
              {
                icon: ListMusic,
                title: 'Set Builder',
                description: 'Organize your best jokes into perfectly timed sets.',
              },
              {
                icon: Mic2,
                title: 'Performance Notes',
                description: 'Callbacks, transitions, and recovery lines for the stage.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Styles Section */}
      <section className="py-20 bg-card/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Practice Any Style</h2>
            <p className="text-muted">
              From one-liners to storytelling, we've got you covered.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['Standup', 'One-Liners', 'Observational', 'Dark Humor', 'Puns', 'Storytelling'].map(
              (style) => (
                <span
                  key={style}
                  className="px-4 py-2 rounded-full bg-card border border-border text-foreground font-medium"
                >
                  {style}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to write?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Join comedians who are writing more, getting better feedback, and building killer sets.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted">
          <p>© {new Date().getFullYear()} WriteJokes. Built for comedians who want to get better.</p>
        </div>
      </footer>
    </div>
  );
}
