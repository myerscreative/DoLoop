import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className=\"flex items-center justify-center\">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-yellow-200 border-t-yellow-500',
          sizeClasses[size],
          className
        )}
      />
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50\">
      <div className=\"text-center space-y-4\">
        {/* Bee mascot */}
        <div className=\"mx-auto h-16 w-16 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce\">
          <span className=\"text-2xl\">🐝</span>
        </div>
        
        <div className=\"space-y-2\">
          <h2 className=\"text-xl font-semibold text-gray-900\">DoLoop</h2>
          <LoadingSpinner size=\"lg\" />
        </div>
        
        <p className=\"text-gray-600 text-sm\">
          Getting your loops ready...
        </p>
      </div>
    </div>
  )
}