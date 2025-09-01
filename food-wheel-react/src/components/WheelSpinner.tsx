'use client'

import React, { useState } from 'react'

interface Props {
  items: Array<{ name: string }>
}

export default function WheelSpinner({ items }: Props) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState('')
  const [rotation, setRotation] = useState(0)

  const spin = () => {
    if (items.length === 0) {
      alert('請先新增餐點！')
      return
    }

    if (isSpinning) return

    setIsSpinning(true)
    setResult('')

    // 計算隨機角度
    const spins = 3 + Math.random() * 3 // 3-6圈
    const finalAngle = spins * 360 + Math.random() * 360
    const newRotation = rotation + finalAngle

    setRotation(newRotation)

    // 4秒後顯示結果
    setTimeout(() => {
      const normalizedAngle = newRotation % 360
      const pointerAngle = (360 - normalizedAngle) % 360
      const itemAngle = 360 / items.length
      const selectedIndex = Math.floor(pointerAngle / itemAngle) % items.length
      const selectedItem = items[selectedIndex]

      setResult(`🎉 ${selectedItem.name}`)
      setIsSpinning(false)
    }, 4000)
  }

  const colors = [
    '#7c9fb3', '#a0aec0', '#b8c4d0', '#9bb0c4',
    '#87a3b8', '#6b8a9e', '#8ea8bb', '#759097'
  ]

  return (
    <div className="text-center my-8">
      <div className="relative mx-auto w-80 h-80">
        {/* 轉盤 */}
        <div 
          className={`relative w-full h-full rounded-full border-4 border-blue-600 overflow-hidden ${
            isSpinning ? 'transition-transform duration-[4000ms] ease-out' : ''
          }`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {items.length > 0 ? (
            <svg className="w-full h-full" viewBox="0 0 300 300">
              {items.map((item, index) => {
                const angle = 360 / items.length
                const startAngle = index * angle - 90
                const endAngle = startAngle + angle
                
                const x1 = 150 + 140 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 150 + 140 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 150 + 140 * Math.cos((endAngle * Math.PI) / 180)
                const y2 = 150 + 140 * Math.sin((endAngle * Math.PI) / 180)
                
                const textAngle = startAngle + angle / 2
                const textX = 150 + 80 * Math.cos((textAngle * Math.PI) / 180)
                const textY = 150 + 80 * Math.sin((textAngle * Math.PI) / 180)
                
                return (
                  <g key={index}>
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                      fill={colors[index % colors.length]}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {item.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-500 text-lg">
              沒有餐點
            </div>
          )}
        </div>
        
        {/* 指針 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-blue-600 z-10"></div>
      </div>

      {/* 控制按鈕 */}
      <button
        onClick={spin}
        disabled={isSpinning}
        className={`mt-6 px-8 py-4 text-lg font-bold text-white rounded-full shadow-lg transition-all ${
          isSpinning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-1'
        }`}
      >
        {isSpinning ? '轉轉中...' : '開始轉轉'}
      </button>

      {/* 結果 */}
      {result && (
        <div className="mt-6 text-2xl font-bold text-blue-600">
          {result}
        </div>
      )}
    </div>
  )
}