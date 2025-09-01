interface Props {
  categories: string[]
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  onManageTags: () => void
  disabled?: boolean
}

export default function CategoryFilter({ categories, selectedCategories, onCategoryToggle, onManageTags, disabled = false }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6 fade-in">
      {categories.map(category => {
        const isSelected = selectedCategories.includes(category)
        return (
          <button
            key={category}
            onClick={() => !disabled && onCategoryToggle(category)}
            disabled={disabled}
            className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
              disabled 
                ? 'cursor-not-allowed opacity-50 bg-gray-200 text-gray-400 border-gray-300'
                : isSelected
                  ? 'bg-blue-500 text-white border-blue-500 hover:scale-110 cursor-pointer'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:scale-110 cursor-pointer'
            }`}
            style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}
          >
            {category === 'all' ? '全部' : category}
          </button>
        )
      })}
      <button
        onClick={() => !disabled && onManageTags()}
        disabled={disabled}
        className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
          disabled
            ? 'cursor-not-allowed opacity-50 bg-gray-200 text-gray-400 border-gray-300'
            : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:scale-110 cursor-pointer'
        }`}
        style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}
      >
        +
      </button>
    </div>
  )
}