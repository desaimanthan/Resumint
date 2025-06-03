'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    title: "AI Portfolio Builder",
    description: "Accepts PDF/Word résumé or guided Q&A to generate a responsive, host-ready site (custom subdomain + exportable HTML)",
    icon: "🌐"
  },
  {
    title: "AI CV Generator",
    description: "When no résumé exists, dynamic interview prompts collect work history, skills, metrics; outputs ATS-friendly PDF/docx",
    icon: "📄"
  },
  {
    title: "AI Cover-Letter Writer",
    description: "One-click, job-specific letters using role description + user portfolio data; editable tone presets",
    icon: "✍️"
  },
  {
    title: "Résumé / Portfolio Optimizer",
    description: "Real-time score, keyword gap analysis vs. target job description, and auto-rewrite suggestions",
    icon: "⚡"
  },
  {
    title: "AI Mock Interviewer",
    description: "Role-aware question sets (technical, behavioral) with live transcript, confidence metrics, and improvement tips",
    icon: "🎤"
  },

  {
    title: "Job-Opening Alert Engine",
    description: "Users choose sources (LinkedIn, AngelList, Wellfound, company RSS, etc.), keywords, and frequency; alerts via email & in-app with 'Apply-with-Profile' shortcut",
    icon: "🔔"
  }
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        setShowLanding(true);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!showLanding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/resumint_logo.png"
              alt="Resumint Logo"
              width={140}
              height={60}
              className="rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <Image
              src="/resumint_logo.png"
              alt="Resumint Logo"
              width={120}
              height={120}
              className="mx-auto rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI-Powered
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Career Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transform your career journey with our comprehensive suite of AI tools. From building stunning portfolios to acing interviews, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Building Your Future
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform provides all the tools you need to build, optimize, and showcase your professional profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who have already elevated their careers with Resumint.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 border-0">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">

              <span className="text-xl font-bold">Resumint</span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2025 Resumint. All rights reserved.</p>
              <p className="mt-1">Empowering careers with AI technology.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
