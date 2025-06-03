'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const slides = [
    {
      gradient: 'from-blue-600 via-indigo-600 to-purple-700',
      icon: (
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      title: 'Beautiful Design',
      subtitle: 'Experience the power of modern design',
      testimonial: {
        quote: 'We went from spinning wheels to focused execution, and honestly, this platform has 4x-ed our productivity across the board.',
        author: 'Jasmin Koller',
        role: 'Operations Lead at Launch Collective'
      }
    },
    {
      gradient: 'from-purple-600 via-pink-600 to-red-600',
      icon: (
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      title: 'Proven Results',
      subtitle: 'Join successful professionals worldwide',
      testimonial: {
        quote: 'The AI-powered insights helped me land my dream job. The resume optimization suggestions were spot-on and made all the difference.',
        author: 'Michael Rodriguez',
        role: 'Software Engineer at Google'
      }
    },
    {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      icon: (
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      ),
      title: 'Lightning Fast',
      subtitle: 'Build professional resumes in minutes',
      testimonial: {
        quote: 'I created a professional resume in under 10 minutes. The templates are modern and the customization options are endless.',
        author: 'Emily Watson',
        role: 'Marketing Director at Startup Inc'
      }
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      toast({
        title: 'Success',
        description: 'Login successful! Welcome back.',
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Login failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Logo in top left corner */}
      <div className="absolute top-8 left-8 z-10">
        <Image
          src="/resumint_logo.png"
          alt="Resumint Logo"
          width={180}
          height={60}
          priority
          className="h-auto"
        />
      </div>
      
      <div className="flex min-h-screen">
        {/* Left Section - Form (60% width) */}
        <div className="w-3/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">

            {/* Welcome Text */}
            <div className="space-y-2 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back to Resumint</h1>
              <p className="text-gray-600">Log in to access your mission control</p>
            </div>



            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@example.com"
                  className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="h-12 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Forgot password
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="text-black hover:text-gray-700 font-medium underline"
                >
                  Create one for free
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Section - Image Carousel (40% width) */}
        <div className="w-2/5 relative bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-8">
          {/* Image Slider */}
          <div className="w-full h-full relative rounded-lg overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                } bg-gradient-to-br ${slide.gradient}`}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                
                {/* Slide content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {slide.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{slide.title}</h3>
                    <p className="text-sm opacity-90">{slide.subtitle}</p>
                  </div>
                </div>

                {/* Testimonial Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-8">
                  <blockquote className="text-white">
                    <p className="text-lg font-medium mb-4">
                      "{slide.testimonial.quote}"
                    </p>
                    <footer className="text-sm">
                      <div className="font-medium">{slide.testimonial.author}</div>
                      <div className="opacity-75">{slide.testimonial.role}</div>
                    </footer>
                  </blockquote>
                </div>
              </div>
            ))}

            {/* Navigation arrows */}
            <button 
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Slide indicators */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
