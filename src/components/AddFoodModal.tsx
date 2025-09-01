'use client'

import React, { useState, useRef } from 'react'
import { uploadImage, compressImage } from '@/utils/imageUpload'

interface Props {
  categories: string[]
  onSubmit: (data: {
    name: string
    imageUrl?: string
    price: string
    taste: string
    tagNames: string[]
  }) => void
  onClose: () => void
  onManageTags: () => void
}

export default function AddFoodModal({ categories, onSubmit, onClose, onManageTags }: Props) {
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [price, setPrice] = useState('$')
  const [taste, setTaste] = useState('🩷')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('請輸入餐點名稱！')
      return
    }
    // 標籤可以為空，移除這個驗證

    setIsUploading(true)
    let finalImageUrl = ''

    try {
      // 如果有選擇檔案，先上傳圖片
      if (selectedFile) {
        const compressedFile = await compressImage(selectedFile)
        const uploadedUrl = await uploadImage(compressedFile)
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        } else {
          throw new Error('圖片上傳失敗')
        }
      }

      onSubmit({
        name: name.trim(),
        imageUrl: finalImageUrl || undefined,
        price,
        taste,
        tagNames: selectedTags
      })

      // 重置表單
      resetForm()
    } catch (error) {
      console.error('提交失敗:', error)
      const errorMessage = error instanceof Error ? error.message : '提交失敗，請稍後再試！'
      alert(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSelectedFile(null)
    setPreviewUrl('')
    setPrice('$')
    setTaste('🩷')
    setSelectedTags([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查檔案大小 (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert('圖片檔案不能超過 5MB')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      // 檢查檔案類型
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']
      
      if (!file.type.startsWith('image/') && !validExtensions.includes(fileExtension || '')) {
        alert('請選擇圖片檔案 (支援 JPG, PNG, GIF, WebP, HEIC 格式)')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      setSelectedFile(file)
      
      // 創建預覽圖
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-lg scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div className="bg-blue-500 text-white p-5 flex justify-between items-center">
          <h3 className="text-xl font-semibold">新增餐點</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 餐點名稱 */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入餐點名稱"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder:text-gray-600"
            />
          </div>

          {/* 圖片上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">餐點圖片：</label>
            
            {/* 預覽區域 */}
            {previewUrl && (
              <div className="relative mb-3 w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                <img 
                  src={previewUrl} 
                  alt="預覽" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-red-600 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* 上傳按鈕 */}
            <div className="flex gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleFileSelect}
                className="hidden"
                id="imageUpload"
              />
              <label
                htmlFor="imageUpload"
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors text-center font-medium"
              >
                {selectedFile ? `已選擇: ${selectedFile.name}` : '上傳圖片'}
              </label>
            </div>

            {/* 移除 URL 輸入，只支援檔案上傳 */}
          </div>

          {/* 價格等級 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">價格等級：</label>
            <div className="flex gap-2">
              {['$', '$$', '$$$'].map(priceOption => (
                <label key={priceOption} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                  price === priceOption ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="price"
                    value={priceOption}
                    checked={price === priceOption}
                    onChange={(e) => setPrice(e.target.value)}
                    className="hidden"
                  />
                  {priceOption}
                </label>
              ))}
            </div>
          </div>

          {/* 好吃度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">好吃度：</label>
            <div className="flex gap-2">
              {['🩷', '🩷🩷', '🩷🩷🩷'].map(tasteOption => (
                <label key={tasteOption} className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                  taste === tasteOption ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="taste"
                    value={tasteOption}
                    checked={taste === tasteOption}
                    onChange={(e) => setTaste(e.target.value)}
                    className="hidden"
                  />
                  {tasteOption}
                </label>
              ))}
            </div>
          </div>

          {/* 標籤選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇標籤：</label>
            <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-300 rounded-lg">
              {categories.map(category => (
                <label
                  key={category}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    selectedTags.includes(category)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(category)}
                    onChange={() => toggleTag(category)}
                    className="hidden"
                  />
                  {category}
                </label>
              ))}
              <button
                type="button"
                onClick={onManageTags}
                className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* 提交按鈕 */}
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
            }`}
          >
            {isUploading ? '上傳中...' : '新增餐點'}
          </button>
        </form>
      </div>
    </div>
  )
}