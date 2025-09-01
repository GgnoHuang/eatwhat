export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center text-blue-600">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-lg font-medium">載入中...</p>
      </div>
    </div>
  )
}