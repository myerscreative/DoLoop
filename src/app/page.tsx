export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-24 w-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <span className="text-4xl">🐝</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">DoLoop</h1>
        <p className="text-gray-600 mb-8">Create productive habits with recurring task loops</p>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">App is running successfully!</h2>
          <p className="text-gray-600">The basic Next.js setup is working.</p>
        </div>
      </div>
    </div>
  )
}