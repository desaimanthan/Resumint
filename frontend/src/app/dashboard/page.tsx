'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSidebar } from '@/components/simple-sidebar';
import { Upload, PenTool } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DashboardPage() {
  const { user, apiCall } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [creationMethod, setCreationMethod] = useState<'scratch' | 'pdf_upload'>('pdf_upload'); // Default to PDF upload
  const [isCreating, setIsCreating] = useState(false);

  // Create new resume
  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a resume title',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const data = await apiCall('/resumes', {
        method: 'POST',
        body: JSON.stringify({ 
          title: newResumeTitle.trim(),
          creationMethod: creationMethod
        }),
      });

      toast({
        title: 'Success',
        description: 'Resume created successfully',
      });

      // Navigate based on creation method
      if (creationMethod === 'pdf_upload') {
        router.push(`/resume-builder/${data.data.resume._id}/steps/file-upload`);
      } else {
        router.push(`/resume-builder/${data.data.resume._id}/steps/personal-info`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create resume',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
      setShowCreateDialog(false);
      setNewResumeTitle('');
      setCreationMethod('pdf_upload'); // Reset to default
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SimpleSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName}! Here's what's happening with your resumes.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {user.fullName}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                  {user.lastLogin && (
                    <p><strong>Last login:</strong> {new Date(user.lastLogin).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Builder</CardTitle>
                <CardDescription>Create and manage your resumes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Start building your professional resume with our AI-powered tools.
                </p>
                <Button className="w-full" onClick={() => setShowCreateDialog(true)}>
                  Create New Resume
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Get intelligent recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Analyze your resume and get personalized suggestions for improvement.
                </p>
                <Button className="w-full" variant="outline">
                  Analyze Resume
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Welcome to Resumint! Here's how to get started:</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Create Your Profile</h3>
                    <p className="text-sm text-gray-600">Add your personal information and work experience</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Build Your Resume</h3>
                    <p className="text-sm text-gray-600">Use our templates to create professional resumes</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Get AI Insights</h3>
                    <p className="text-sm text-gray-600">Optimize your resume with intelligent suggestions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SimpleSidebar>
  );
}
