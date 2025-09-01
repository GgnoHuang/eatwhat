'use client'

import React, { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { motion } from 'framer-motion'

interface Props {
  items: Array<{ name: string; imageUrl?: string }>
}

export default function WheelSpinner({ items }: Props) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState('')
  const [rotation, setRotation] = useState(0)
  const [animationDuration, setAnimationDuration] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [screenShake, setScreenShake] = useState(false)

  const spin = () => {
    if (items.length === 0) {
      alert('請先新增餐點！')
      return
    }

    if (isSpinning) return

    setIsSpinning(true)
    setResult('')
    setShowConfetti(false) // 重置彩帶
    setShowFireworks(false) // 重置煙火
    setScreenShake(false) // 重置震動

    // 計算隨機角度和時間
    const spins = 5 + Math.random() * 4 // 5-9圈
    const finalAngle = spins * 360 + Math.random() * 360
    const newRotation = rotation + finalAngle
    const duration = 5000 + Math.random() * 2000 // 5-7秒隨機

    setAnimationDuration(duration)
    setRotation(newRotation)

    // 隨機時間後顯示結果
    setTimeout(() => {
      const normalizedAngle = newRotation % 360
      const pointerAngle = (360 - normalizedAngle) % 360
      const itemAngle = 360 / items.length
      const selectedIndex = Math.floor(pointerAngle / itemAngle) % items.length
      const selectedItem = items[selectedIndex]

      setResult(`🎉 ${selectedItem.name}`)
      setIsSpinning(false)
      
      // 超級爆炸組合特效！
      setShowConfetti(true) // 彩帶
      setShowFireworks(true) // 煙火
      setScreenShake(true) // 螢幕震動
      
      // 階段性關閉特效
      setTimeout(() => setScreenShake(false), 800) // 0.8秒後停止震動
      setTimeout(() => setShowFireworks(false), 4000) // 4秒後關閉煙火
      setTimeout(() => setShowConfetti(false), 5000) // 5秒後關閉彩帶
    }, duration)
  }

  const colors = [
    '#7c9fb3', '#a0aec0', '#b8c4d0', '#9bb0c4',
    '#87a3b8', '#6b8a9e', '#8ea8bb', '#759097'
  ]

  return (
    <motion.div 
      className="text-center my-8 bounce-in relative"
      animate={screenShake ? { 
        x: [0, -10, 10, -10, 10, -5, 5, -5, 5, 0],
        y: [0, -5, 5, -5, 5, -2, 2, -2, 2, 0]
      } : {}}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* 彩帶特效 */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FCEA2B', '#FF9F43']}
        />
      )}
      
      {/* 煙火爆炸特效 */}
      {showFireworks && (
        <>
          {/* 多個爆炸點 */}
          {Array.from({length: 8}).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-yellow-400 rounded-full"
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0,
                opacity: 1
              }}
              animate={{
                scale: [0, 2, 4, 0],
                x: [0, (i % 4 - 1.5) * 200],
                y: [0, Math.floor(i / 4) * 150 - 100],
                opacity: [1, 1, 0.5, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              style={{
                left: '50%',
                top: '50%',
                boxShadow: '0 0 20px #FBBF24'
              }}
            />
          ))}
          
          {/* 中心爆炸光環 */}
          <motion.div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-yellow-400 via-orange-500 to-transparent rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 3, 5], opacity: [1, 0.5, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </>
      )}
      
      {/* 背景閃爍效果 + 粒子背景 */}
      {result && (
        <div className="fixed inset-0 pointer-events-none particles-bg">
          <div className={`absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-pink-500/20 to-purple-500/20 ${result ? 'animate-pulse rainbow-pulse' : ''}`}></div>
        </div>
      )}
      
      {/* 轉動時的動態背景 */}
      {isSpinning && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 animate-pulse"></div>
        </div>
      )}
      <div className="relative mx-auto w-80 h-80">
        {/* 轉動時的瘋狂光環特效 */}
        {isSpinning && (
          <>
            {/* 原有光環 */}
            <div className="absolute -inset-4 rounded-full border-4 border-yellow-400 animate-ping opacity-75"></div>
            <div className="absolute -inset-2 rounded-full border-2 border-orange-400 animate-pulse opacity-60"></div>
            <div className="absolute -inset-6 rounded-full border-8 border-red-500 animate-spin opacity-40" 
                 style={{animationDuration: '1s'}}></div>
            
            {/* 新增：多層閃電光環 */}
            <motion.div 
              className="absolute -inset-8 rounded-full border-4 border-purple-500"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity },
                opacity: { duration: 0.5, repeat: Infinity }
              }}
            />
            
            {/* 新增：電光效果 */}
            {Array.from({length: 12}).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-12 bg-gradient-to-t from-transparent via-yellow-300 to-transparent"
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: '0.5px 40px',
                  transform: `rotate(${i * 30}deg)`
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scaleY: [0.5, 1.5, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </>
        )}
        
        {/* 轉盤 */}
        <div 
          className={`relative w-full h-full rounded-full border-4 overflow-hidden ${
            isSpinning 
              ? 'transition-transform ease-out border-yellow-400 shadow-2xl shadow-yellow-400/50 rainbow-pulse lightning-strike' 
              : 'border-blue-600'
          }`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? `${animationDuration}ms` : '0ms',
            boxShadow: isSpinning ? '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4)' : ''
          }}
        >
          {items.length > 0 ? (
            <>
              {items.map((item, index) => {
                const angle = 360 / items.length
                const rotation = index * angle
                const nextRotation = (index + 1) * angle
                
                // 計算扇形的路徑點
                const radius = 150
                const centerX = 150
                const centerY = 150
                
                const x1 = centerX + radius * Math.cos((rotation - 90) * Math.PI / 180)
                const y1 = centerY + radius * Math.sin((rotation - 90) * Math.PI / 180)
                const x2 = centerX + radius * Math.cos((nextRotation - 90) * Math.PI / 180)
                const y2 = centerY + radius * Math.sin((nextRotation - 90) * Math.PI / 180)
                
                const largeArcFlag = angle > 180 ? 1 : 0
                const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
                
                // 計算文字位置
                const textAngle = rotation + angle / 2 - 90
                const textRadius = 100
                const textX = centerX + textRadius * Math.cos(textAngle * Math.PI / 180)
                const textY = centerY + textRadius * Math.sin(textAngle * Math.PI / 180)
                
                return (
                  <svg key={index} className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
                    <defs>
                      <clipPath id={`clip-${index}`}>
                        <path d={pathData} />
                      </clipPath>
                      {item.imageUrl && (
                        <pattern id={`pattern-${index}`} patternUnits="userSpaceOnUse" width="300" height="300">
                          <image 
                            href={item.imageUrl} 
                            x="0" 
                            y="0" 
                            width="300" 
                            height="300"
                            preserveAspectRatio="xMidYMid slice"
                          />
                        </pattern>
                      )}
                    </defs>
                    
                    {/* 背景扇形 */}
                    <path
                      d={pathData}
                      fill={item.imageUrl ? `url(#pattern-${index})` : colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="2"
                    />
                    
                    {/* 餐點名稱 */}
                    <g transform={`translate(${textX}, ${textY}) rotate(${textAngle + 90})`}>
                      {(() => {
                        const name = item.name
                        
                        if (name.length <= 4) {
                          // 4字以內：單行大字顯示
                          return (
                            <text
                              x="0"
                              y="0"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#FACC15"
                              fontSize="30"
                              fontWeight="bold"
                              style={{
                                fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                              }}
                            >
                              {name}
                            </text>
                          )
                        } else if (name.length <= 8) {
                          // 5-8字：分兩行顯示
                          const mid = Math.ceil(name.length / 2)
                          const line1 = name.slice(0, mid)
                          const line2 = name.slice(mid)
                          
                          return (
                            <>
                              <text
                                x="0"
                                y="-10"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="26"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line1}
                              </text>
                              <text
                                x="0"
                                y="10"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="26"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line2}
                              </text>
                            </>
                          )
                        } else if (name.length <= 12) {
                          // 9-12字：分三行顯示
                          const third = Math.ceil(name.length / 3)
                          const line1 = name.slice(0, third)
                          const line2 = name.slice(third, third * 2)
                          const line3 = name.slice(third * 2)
                          
                          return (
                            <>
                              <text
                                x="0"
                                y="-14"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="22"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line1}
                              </text>
                              <text
                                x="0"
                                y="0"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="22"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line2}
                              </text>
                              <text
                                x="0"
                                y="14"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="22"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line3}
                              </text>
                            </>
                          )
                        } else {
                          // 超過12字：分四行顯示，任意長度都不截斷
                          const quarter = Math.ceil(name.length / 4)
                          const line1 = name.slice(0, quarter)
                          const line2 = name.slice(quarter, quarter * 2)
                          const line3 = name.slice(quarter * 2, quarter * 3)
                          const line4 = name.slice(quarter * 3)
                          
                          return (
                            <>
                              <text
                                x="0"
                                y="-18"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="20"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line1}
                              </text>
                              <text
                                x="0"
                                y="-6"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="20"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line2}
                              </text>
                              <text
                                x="0"
                                y="6"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="20"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line3}
                              </text>
                              <text
                                x="0"
                                y="18"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FACC15"
                                fontSize="20"
                                fontWeight="bold"
                                style={{
                                  fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
                                  filter: 'drop-shadow(3px 3px 6px rgba(0, 0, 0, 1)) drop-shadow(0px 0px 8px rgba(0, 0, 0, 0.8))'
                                }}
                              >
                                {line4}
                              </text>
                            </>
                          )
                        }
                      })()}
                    </g>
                  </svg>
                )
              })}
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-700 text-lg">
              沒有餐點
            </div>
          )}
        </div>
        
        {/* 指針 */}
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent z-10 transition-all ${
          isSpinning 
            ? 'border-b-yellow-400 animate-pulse shadow-lg shadow-yellow-400/70' 
            : 'border-b-blue-600'
        }`}
        style={{
          filter: isSpinning ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))' : ''
        }}></div>
      </div>

      {/* 控制按鈕 */}
      <div className="relative">
        {/* 按鈕周圍的火焰效果 */}
        {isSpinning && (
          <>
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full animate-pulse opacity-60 blur-sm"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-ping opacity-40"></div>
          </>
        )}
        
        <button
          onClick={spin}
          disabled={isSpinning}
          className={`relative mt-6 px-8 py-4 text-lg font-bold text-white rounded-full shadow transition-all ${
            isSpinning 
              ? 'bg-gradient-to-r from-red-500 to-orange-500 cursor-not-allowed animate-bounce shadow-2xl shadow-red-500/50 crazy-rotate neon-glow' 
              : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-1 hover:scale-105 heartbeat cursor-pointer'
          }`}
          style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}
        >
          {isSpinning ? '🔥 轉轉中... 🔥' : '🎯 開始轉轉 🎯'}
        </button>
      </div>

      {/* 結果 */}
      {result && (
        <div className="relative">
          {/* 結果周圍的超級爆炸效果 */}
          <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-lg animate-pulse opacity-30 blur-md"></div>
          
          {/* 彩虹光環 */}
          <motion.div
            className="absolute -inset-6 border-4 rounded-lg"
            style={{ 
              borderImage: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #fcea2b, #ff9f43) 1'
            }}
            animate={{ 
              borderRadius: ['8px', '20px', '8px'],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          
          {/* 浮動星星特效 */}
          {Array.from({length: 6}).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ 
                x: Math.cos(i * 60 * Math.PI / 180) * 60,
                y: Math.sin(i * 60 * Math.PI / 180) * 60,
                opacity: 0
              }}
              animate={{
                x: Math.cos(i * 60 * Math.PI / 180) * 100,
                y: Math.sin(i * 60 * Math.PI / 180) * 100,
                opacity: [0, 1, 0],
                rotate: 360,
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {['⭐', '✨', '💫', '🌟', '⚡', '🔥'][i]}
            </motion.div>
          ))}
          
          {/* 結果文字 - 打字機效果 */}
          <motion.div 
            className="relative mt-6 text-4xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent bounce-in mega-explosion text-wave neon-glow" 
            style={{ 
              fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
            }}
            animate={{
              scale: [1, 1.1, 1],
              textShadow: [
                '0 0 20px rgba(255, 215, 0, 0.8)',
                '0 0 30px rgba(255, 215, 0, 1)',
                '0 0 20px rgba(255, 215, 0, 0.8)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎊 {result} 🎊
          </motion.div>
          
          {/* 下方慶祝文字 */}
          <motion.div
            className="mt-4 text-lg font-semibold text-purple-600"
            style={{ fontFamily: 'DFKai-SB, KaiTi, STKaiti, serif' }}
            animate={{
              y: [0, -5, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🥳 就決定是你了！ 🥳
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}