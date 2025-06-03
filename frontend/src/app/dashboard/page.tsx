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
import { FileText, Mail, Mic, ArrowRight } from 'lucide-react';
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
        
        {/* Marketing Cards Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Resume Builder Card */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-bl-full"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Resume Builder</CardTitle>
                    <CardDescription className="text-gray-600">AI-Powered Professional Resumes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Create stunning, ATS-friendly resumes with our intelligent builder. Choose from professional templates and get AI-powered suggestions.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Professional templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>ATS optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>AI content suggestions</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 group-hover:bg-blue-700 transition-colors"
                  onClick={() => router.push('/resume-builder')}
                >
                  Start Building Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Cover Letter Card */}
            <Card className="relative overflow-hidden border-2 hover:border-green-300 transition-all duration-300 hover:shadow-lg group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-bl-full"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Cover Letter</CardTitle>
                    <CardDescription className="text-gray-600">Personalized & Compelling</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Generate personalized cover letters that complement your resume. Our AI crafts compelling narratives tailored to each job application.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Job-specific customization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Professional tone</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Instant generation</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 group-hover:bg-green-700 transition-colors"
                  onClick={() => router.push('/cover-letter')}
                >
                  Create Cover Letter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Mock Interview Card */}
            <Card className="relative overflow-hidden border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-bl-full"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mic className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Mock Interview</CardTitle>
                    <CardDescription className="text-gray-600">AI-Powered Practice Sessions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Practice with our AI interviewer and get real-time feedback. Build confidence and improve your interview skills with personalized coaching.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Real-time AI feedback</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Industry-specific questions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Performance analytics</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 group-hover:bg-purple-700 transition-colors"
                  onClick={() => router.push('/mock-interview')}
                >
                  Start Mock Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Resume Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you'd like to create your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resume-title">Resume Title</Label>
              <Input
                id="resume-title"
                placeholder="e.g., Software Engineer Resume"
                value={newResumeTitle}
                onChange={(e) => setNewResumeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Creation Method</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="pdf_upload"
                    name="creationMethod"
                    value="pdf_upload"
                    checked={creationMethod === 'pdf_upload'}
                    onChange={(e) => setCreationMethod(e.target.value as 'scratch' | 'pdf_upload')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="pdf_upload" className="text-sm font-normal">
                    Upload existing PDF resume (recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="scratch"
                    name="creationMethod"
                    value="scratch"
                    checked={creationMethod === 'scratch'}
                    onChange={(e) => setCreationMethod(e.target.value as 'scratch' | 'pdf_upload')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="scratch" className="text-sm font-normal">
                    Start from scratch
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateResume} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Resume'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SimpleSidebar>
  );
}
