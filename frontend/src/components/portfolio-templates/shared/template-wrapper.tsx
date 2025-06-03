'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface TemplateWrapperProps {
  children: ReactNode
  className?: string
}

export function TemplateWrapper({ children, className = '' }: TemplateWrapperProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className={`min-h-screen ${className}`}>
        {/* Print Button - Hidden in print */}
        <div className="fixed top-4 right-4 z-10 print:hidden">
          <Button onClick={handlePrint} className="shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Main Content */}
        {children}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm print:hidden">
          <p>This resume was created with Resumint</p>
        </footer>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          .border-l-2 {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  )
}
