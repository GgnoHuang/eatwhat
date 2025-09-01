interface Props {
  categories: string[]
  selectedCategories: string[]
  onCategoryToggle: (category: string) => void
  onManageTags: () => void
}

export default function CategoryFilter({ categories, selectedCategories, onCategoryToggle, onManageTags }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6 fade-in">
      {categories.map(category => {
        const isSelected = selectedCategories.includes(category)
        return (
          <button
            key={category}
            onClick={() => onCategoryToggle(category)}
            className={`px-4 py-2 rounded-full border-2 font-medium transition-all hover:scale-110 cursor-pointer ${
              isSelected
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            style={{ fontFamily: 'Comic Sans MS, Microsoft JhengHei, cursive, sans-serif' }}
          >
            {category === 'all' ? '全部' : category}
          </button>
        )
      })}
      <button
        onClick={onManageTags}
        className="px-4 py-2 rounded-full border-2 border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 hover:scale-110 transition-all font-medium cursor-pointer"
        style={{ fontFamily: 'Comic Sans MS, Microsoft JhengHei, cursive, sans-serif' }}
      >
        +
      </button>
    </div>
  )
}