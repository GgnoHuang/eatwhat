'use client'

import React, { useState } from 'react'

interface Props {
  categories: string[]
  onAddTag: (name: string) => Promise<boolean>
  onUpdateTag: (oldName: string, newName: string) => Promise<boolean>
  onDeleteTag: (name: string) => Promise<boolean>
  onClose: () => void
}

export default function TagManagementModal({ categories, onAddTag, onUpdateTag, onDeleteTag, onClose }: Props) {
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) {
      alert('請輸入標籤名稱！')
      return
    }

    if (categories.includes(newTagName.trim())) {
      alert('這個標籤已經存在了！')
      return
    }

    const success = await onAddTag(newTagName.trim())
    if (success) {
      setNewTagName('')
    }
  }

  const handleDelete = async (tagName: string) => {
    if (confirm(`確定要刪除標籤 "${tagName}" 嗎？觸發器會自動從所有餐點中移除此標籤。`)) {
      await onDeleteTag(tagName)
    }
  }

  const startEditing = (tagName: string) => {
    setEditingTag(tagName)
    setEditingName(tagName)
  }

  const cancelEditing = () => {
    setEditingTag(null)
    setEditingName('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingName.trim() || !editingTag) return

    if (editingName.trim() === editingTag) {
      // 名稱沒有改變
      cancelEditing()
      return
    }

    const success = await onUpdateTag(editingTag, editingName.trim())
    if (success) {
      cancelEditing()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-lg scale-in">
        {/* 標題 */}
        <div className="bg-blue-500 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-semibold">標籤管理</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
            ×
          </button>
        </div>

        <div className="p-5 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 新增標籤 */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="新增標籤名稱"
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              新增標籤
            </button>
          </form>

          {/* 現有標籤列表 */}
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category} className="p-3 bg-white border border-gray-200 rounded-lg border-l-4 border-l-blue-500">
                {editingTag === category ? (
                  // 編輯模式
                  <form onSubmit={handleUpdate} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-gray-900"
                      style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors cursor-pointer"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  // 顯示模式
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800" style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}>
                      {category}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(category)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors cursor-pointer"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center text-gray-700 py-8">
              還沒有任何標籤
            </div>
          )}
        </div>
      </div>
    </div>
  )
}