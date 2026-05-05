interface PageErrorProps {
  message: string
  onBack: () => void
  backLabel?: string
  accentColor?: string
}

export default function PageError({
  message,
  onBack,
  backLabel = 'Retour',
  accentColor = '#3B82F6',
}: PageErrorProps) {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-xl border-2 border-red-500 shadow-sm p-12 text-center">
        <span className="text-5xl grayscale opacity-70 block mb-4">❌</span>
        <p className="text-red-600 font-medium mb-4">{message}</p>
        <button
          onClick={onBack}
          className="font-body font-semibold px-6 py-2.5 text-white rounded-xl hover:-translate-y-0.5 transition"
          style={{ backgroundColor: accentColor }}
        >
          {backLabel}
        </button>
      </div>
    </div>
  )
}
