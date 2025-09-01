'use client'

import React, { useState } from 'react'
import { useFoodData } from '@/hooks/useFoodData'
import LoadingSpinner from './LoadingSpinner'
import WheelSpinner from './WheelSpinner'
import CategoryFilter from './CategoryFilter'
import FoodList from './FoodList'
import AddFoodModal from './AddFoodModal'
import EditFoodModal from './EditFoodModal'
import TagManagementModal from './TagManagementModal'

export default function FoodWheel() {
  const { 
    items, 
    categories, 
    loading, 
    error, 
    addFood, 
    updateFood, 
    deleteFood, 
    addTag, 
    deleteTag,
    reload 
  } = useFoodData()

  const [currentCategory, setCurrentCategory] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingItem, setEditingItem] = useState<typeof items[0] | null>(null)

  // 篩選項目
  const filteredItems = currentCategory === 'all' 
    ? items 
    : items.filter(item => item.tags.includes(currentCategory))

  // 排序項目
  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'zh-TW')
        break
      case 'date':
        comparison = a.dateAdded - b.dateAdded
        break
      case 'price':
        const priceOrder = { '$': 1, '$$': 2, '$$$': 3 }
        comparison = (priceOrder[a.price as keyof typeof priceOrder] || 1) - 
                    (priceOrder[b.price as keyof typeof priceOrder] || 1)
        break
      case 'taste':
        const tasteOrder = { '🩷': 1, '🩷🩷': 2, '🩷🩷🩷': 3 }
        comparison = (tasteOrder[a.taste as keyof typeof tasteOrder] || 1) - 
                    (tasteOrder[b.taste as keyof typeof tasteOrder] || 1)
        break
      default:
        comparison = a.name.localeCompare(b.name, 'zh-TW')
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleEdit = (item: typeof items[0]) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`確定要刪除 "${name}" 嗎？`)) {
      await deleteFood(id)
    }
  }

  const handleAddFood = async (foodData: Parameters<typeof addFood>[0]) => {
    const success = await addFood(foodData)
    if (success) {
      setShowAddModal(false)
    }
  }

  const handleUpdateFood = async (foodData: Parameters<typeof addFood>[0]) => {
    if (!editingItem) return
    const success = await updateFood(editingItem.id, foodData)
    if (success) {
      setShowEditModal(false)
      setEditingItem(null)
    }
  }

  if (loading && items.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-blue-100 p-5">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl p-5 shadow-lg fade-in">
        <h1 className="text-4xl font-bold text-center text-gray-700 mb-5 text-focus-in" style={{ fontFamily: 'Comic Sans MS, Microsoft JhengHei, cursive, sans-serif' }}>
          吃啥？
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <CategoryFilter
          categories={['all', ...categories]}
          currentCategory={currentCategory}
          onCategoryChange={setCurrentCategory}
          onManageTags={() => setShowTagModal(true)}
        />

        <WheelSpinner items={filteredItems} />

        <FoodList
          items={sortedItems}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          onAddFood={() => setShowAddModal(true)}
          onEditFood={handleEdit}
          onDeleteFood={handleDelete}
          loading={loading}
        />

        {/* 模態框 */}
        {showAddModal && (
          <AddFoodModal
            categories={categories}
            onSubmit={handleAddFood}
            onClose={() => setShowAddModal(false)}
            onManageTags={() => setShowTagModal(true)}
          />
        )}

        {showEditModal && editingItem && (
          <EditFoodModal
              categories={categories}
              initialData={editingItem}
              onSubmit={handleUpdateFood}
              onClose={() => {
                setShowEditModal(false)
                setEditingItem(null)
              }}
              onDelete={() => handleDelete(editingItem.id, editingItem.name)}
              onManageTags={() => setShowTagModal(true)}
            />
        )}

        {showTagModal && (
          <TagManagementModal
            categories={categories}
            onAddTag={addTag}
            onDeleteTag={deleteTag}
            onClose={() => setShowTagModal(false)}
          />
        )}
      </div>
    </div>
  )
}