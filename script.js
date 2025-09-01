class WheelOfFood {
    constructor() {
        this.items = [
            { name: '牛肉麵', tags: ['麵', '熱食'], price: '$$', taste: '好吃', dateAdded: Date.now() - 7000000 },
            { name: '雞湯', tags: ['湯', '熱食'], price: '$', taste: 'ok', dateAdded: Date.now() - 6000000 },
            { name: '炒飯', tags: ['飯', '熱食'], price: '$', taste: '好吃', dateAdded: Date.now() - 5000000 },
            { name: '拉麵', tags: ['麵', '熱食'], price: '$$', taste: '讚', dateAdded: Date.now() - 4000000 },
            { name: '玉米濃湯', tags: ['湯', '熱食'], price: '$', taste: 'ok', dateAdded: Date.now() - 3000000 },
            { name: '滷肉飯', tags: ['飯', '熱食'], price: '$', taste: '好吃', dateAdded: Date.now() - 2000000 },
            { name: '義大利麵', tags: ['麵', '熱食'], price: '$$', taste: '讚', dateAdded: Date.now() - 1000000 },
            { name: '漢堡', tags: ['其他', '熱食'], price: '$$', taste: 'ok', dateAdded: Date.now() }
        ];
        this.categories = ['湯', '麵', '飯', '其他']; // 預設分類
        this.currentCategory = 'all';
        this.isSpinning = false;
        this.sortBy = 'name'; // 預設按名稱排序
        this.sortOrder = 'asc'; // 預設遞增排序
        
        // 載入儲存的資料
        this.loadData();
        
        this.initializeElements();
        this.bindEvents();
        this.updateCategoryButtons();
        this.updateModalTagsCheckboxes();
        this.setupPriceSelectors();
        this.updateWheel();
        this.updateItemsList();
    }
    
    initializeElements() {
        this.wheel = document.getElementById('wheel');
        this.spinBtn = document.getElementById('spinBtn');
        this.result = document.getElementById('result');
        this.addItemModal = document.getElementById('addItemModal');
        this.modalItemName = document.getElementById('modalItemName');
        this.modalTagsCheckboxes = document.getElementById('modalTagsCheckboxes');
        this.modalAddBtn = document.getElementById('modalAddBtn');
        this.closeAddItemBtn = document.getElementById('closeAddItemBtn');
        this.itemsList = document.getElementById('itemsList');
        this.sortBySelect = document.getElementById('sortBy');
        this.sortOrderBtn = document.getElementById('sortOrder');
        this.categoryButtons = document.getElementById('categoryButtons');
        this.categoryModal = document.getElementById('categoryModal');
        this.newCategoryName = document.getElementById('newCategoryName');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.categoriesList = document.getElementById('categoriesList');
        this.closeCategoryManagementBtn = document.getElementById('closeCategoryManagementBtn');
    }
    
    bindEvents() {
        this.spinBtn.addEventListener('click', () => this.spin());
        this.modalAddBtn.addEventListener('click', () => this.addItemFromModal());
        this.closeAddItemBtn.addEventListener('click', () => this.hideAddItemModal());
        this.modalItemName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItemFromModal();
        });
        
        // 分類管理事件將通過動態添加的按鈕處理
        this.closeCategoryManagementBtn.addEventListener('click', () => this.hideCategoryModal());
        
        // 點擊彈窗背景關閉
        this.categoryModal.addEventListener('click', (e) => {
            if (e.target === this.categoryModal) {
                this.hideCategoryModal();
            }
        });
        
        this.addItemModal.addEventListener('click', (e) => {
            if (e.target === this.addItemModal) {
                this.hideAddItemModal();
            }
        });
        
        // ESC 鍵關閉彈窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.categoryModal.style.display === 'flex') {
                    this.hideCategoryModal();
                }
                if (this.addItemModal.style.display === 'flex') {
                    this.hideAddItemModal();
                }
            }
        });
        this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        this.newCategoryName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });
        
        // 排序控件事件
        this.sortBySelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.updateItemsList();
        });
        
        this.sortOrderBtn.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.sortOrderBtn.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
            this.sortOrderBtn.dataset.order = this.sortOrder;
            this.updateItemsList();
        });
    }
    
    getFilteredItems() {
        if (this.currentCategory === 'all') {
            return this.items;
        }
        return this.items.filter(item => item.tags && item.tags.includes(this.currentCategory));
    }
    
    updateWheel() {
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            this.wheel.innerHTML = '<div class="no-items">沒有餐點</div>';
            return;
        }
        
        const colors = [
            '#7c9fb3', '#a0aec0', '#b8c4d0', '#9bb0c4',
            '#87a3b8', '#6b8a9e', '#8ea8bb', '#759097',
            '#a5b8c7', '#94a9bc', '#6f8a9d', '#8ba4b7'
        ];
        
        // 創建 SVG 轉盤
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 300 300');
        
        const centerX = 150;
        const centerY = 150;
        const radius = 140;
        const itemAngle = 360 / filteredItems.length;
        
        console.log('轉盤結構：');
        filteredItems.forEach((item, index) => {
            const startAngle = index * itemAngle;
            const endAngle = startAngle + itemAngle;
            const centerAngle = startAngle + itemAngle / 2;
            
            console.log(`${item.name}: 起始=${startAngle.toFixed(1)}° 結束=${endAngle.toFixed(1)}° 中心=${centerAngle.toFixed(1)}° (調整後中心=${(centerAngle-90).toFixed(1)}°)`);
            
            // 轉換為弧度
            const startRadians = (startAngle - 90) * Math.PI / 180;
            const endRadians = (endAngle - 90) * Math.PI / 180;
            
            // 計算弧形路徑點
            const x1 = centerX + radius * Math.cos(startRadians);
            const y1 = centerY + radius * Math.sin(startRadians);
            const x2 = centerX + radius * Math.cos(endRadians);
            const y2 = centerY + radius * Math.sin(endRadians);
            
            const largeArcFlag = itemAngle > 180 ? 1 : 0;
            
            // 創建扇形路徑
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            
            svg.appendChild(path);
            
            // 添加文字
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const textAngle = startAngle + itemAngle / 2;
            const textRadius = radius * 0.6;
            const textRadians = (textAngle - 90) * Math.PI / 180;
            const textX = centerX + textRadius * Math.cos(textRadians);
            const textY = centerY + textRadius * Math.sin(textRadians);
            
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', this.getContrastColor(colors[index % colors.length]));
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('transform', `rotate(${textAngle}, ${textX}, ${textY})`);
            text.textContent = item.name;
            
            svg.appendChild(text);
        });
        
        this.wheel.innerHTML = '';
        this.wheel.appendChild(svg);
    }
    
    getContrastColor(hexcolor) {
        // 移除 # 符號
        hexcolor = hexcolor.replace('#', '');
        
        // 轉換為 RGB
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        
        // 計算亮度
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    
    spin() {
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            alert('請先新增餐點！');
            return;
        }
        
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.spinBtn.textContent = '轉轉中...';
        this.result.textContent = '';
        
        // 生成隨機的最終角度
        const spins = 3 + Math.random() * 3; // 3-6圈
        const randomFinalAngle = spins * 360 + Math.random() * 360;
        
        // 先暫時移除 transition 來重置位置
        this.wheel.style.transition = 'none';
        this.wheel.style.transform = 'rotate(0deg)';
        
        // 強制重新繪製
        this.wheel.offsetHeight;
        
        // 恢復 transition
        this.wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        const itemAngle = 360 / filteredItems.length;
        const finalAngle = randomFinalAngle;
        
        // 應用轉換
        setTimeout(() => {
            this.wheel.style.transform = `rotate(${finalAngle}deg)`;
        }, 10);
        
        // 4秒後顯示結果
        setTimeout(() => {
            // 計算轉盤停止後實際指向的項目
            const finalAngleNormalized = finalAngle % 360;
            
            // 正確的角度計算：
            // 1. 轉盤生成時，第一個項目從0度開始，但經過-90度調整後實際在270度位置（12點）
            // 2. 指針固定在12點方向（0度位置）
            // 3. 轉盤順時針旋轉了finalAngleNormalized度
            // 4. 指針相對於轉盤的角度需要考慮到轉盤初始偏移
            
            // 將指針位置（0度）轉換為相對於轉盤起始位置的角度
            // 指針指向的角度 = 轉盤的負旋轉角度 + 90度偏移
            let pointerRelativeAngle = (90 - finalAngleNormalized + 360) % 360;
            
            // 根據相對角度計算指向哪個項目
            const actualPointingIndex = Math.floor(pointerRelativeAngle / itemAngle) % filteredItems.length;
            const actualPointingItem = filteredItems[actualPointingIndex];
            
            // 顯示實際指向的項目
            this.result.textContent = `🎉 ${actualPointingItem.name}`;
            this.result.style.color = '#7c9fb3';
            
            // 調試信息（臨時）
            console.log(`最終角度: ${finalAngle.toFixed(2)}度`);
            console.log(`正規化最終角度: ${finalAngleNormalized.toFixed(2)}度`);
            console.log(`指針相對角度: ${pointerRelativeAngle.toFixed(2)}度`);
            console.log(`每個項目角度: ${itemAngle.toFixed(2)}度`);
            console.log(`計算索引: ${actualPointingIndex}`);
            console.log(`實際指向項目: ${actualPointingItem.name}`);
            console.log('---');
            
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.spinBtn.textContent = '開始轉轉';
        }, 4000);
    }
    
    showAddItemModal() {
        this.addItemModal.style.display = 'flex';
        this.updateModalTagsCheckboxes();
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            this.modalItemName.focus();
        }, 300);
    }
    
    hideAddItemModal() {
        this.addItemModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.modalItemName.value = '';
        // 清除所有勾選
        const checkboxes = this.modalTagsCheckboxes.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('selected');
        });
        // 重置價格選擇為 $
        const priceOptions = this.addItemModal.querySelectorAll('.price-option');
        priceOptions.forEach(option => option.classList.remove('selected'));
        const firstPriceRadio = this.addItemModal.querySelector('input[name="modal-price"][value="$"]');
        if (firstPriceRadio) {
            firstPriceRadio.checked = true;
            firstPriceRadio.parentElement.classList.add('selected');
        }
        
        // 重置好吃程度選擇為 ok
        const tasteOptions = this.addItemModal.querySelectorAll('.taste-option');
        tasteOptions.forEach(option => option.classList.remove('selected'));
        const firstTasteRadio = this.addItemModal.querySelector('input[name="modal-taste"][value="ok"]');
        if (firstTasteRadio) {
            firstTasteRadio.checked = true;
            firstTasteRadio.parentElement.classList.add('selected');
        }
    }
    
    setupPriceSelectors() {
        // 為新增餐點彈窗的價格選擇器添加事件監聽
        const modalPriceOptions = this.addItemModal.querySelectorAll('input[name="modal-price"]');
        modalPriceOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const priceOptions = this.addItemModal.querySelectorAll('.price-option');
                priceOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });
        
        // 為新增餐點彈窗的好吃程度選擇器添加事件監聽
        const modalTasteOptions = this.addItemModal.querySelectorAll('input[name="modal-taste"]');
        modalTasteOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const tasteOptions = this.addItemModal.querySelectorAll('.taste-option');
                tasteOptions.forEach(option => option.classList.remove('selected'));
                e.target.parentElement.classList.add('selected');
            });
        });
    }

    addItemFromModal() {
        const name = this.modalItemName.value.trim();
        const selectedTags = [];
        
        // 收集選中的標籤
        const checkboxes = this.modalTagsCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selectedTags.push(cb.value);
        });
        
        // 收集選中的價格和好吃程度
        const selectedPriceRadio = this.addItemModal.querySelector('input[name="modal-price"]:checked');
        const selectedTasteRadio = this.addItemModal.querySelector('input[name="modal-taste"]:checked');
        const selectedPrice = selectedPriceRadio ? selectedPriceRadio.value : '$';
        const selectedTaste = selectedTasteRadio ? selectedTasteRadio.value : 'ok';
        
        if (!name) {
            alert('請輸入餐點名稱！');
            return;
        }
        
        if (selectedTags.length === 0) {
            alert('請至少選擇一個標籤！');
            return;
        }
        
        // 檢查是否已存在
        if (this.items.some(item => item.name === name)) {
            alert('這個餐點已經存在了！');
            return;
        }
        
        this.items.push({ name, tags: selectedTags, price: selectedPrice, taste: selectedTaste, dateAdded: Date.now() });
        
        this.updateWheel();
        this.updateItemsList();
        this.saveData();
        this.hideAddItemModal();
    }
    
    deleteItem(index) {
        if (confirm(`確定要刪除 "${this.items[index].name}" 嗎？`)) {
            this.items.splice(index, 1);
            this.updateWheel();
            this.updateItemsList();
            this.saveData();
        }
    }
    
    getSortedItems() {
        const sortedItems = [...this.items];
        
        sortedItems.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name, 'zh-TW');
                    break;
                case 'date':
                    comparison = (a.dateAdded || 0) - (b.dateAdded || 0);
                    break;
                case 'tags':
                    comparison = (a.tags?.length || 0) - (b.tags?.length || 0);
                    break;
                case 'price':
                    // 價格排序：$ < $$ < $$$
                    const priceOrder = { '$': 1, '$$': 2, '$$$': 3 };
                    const priceA = priceOrder[a.price || '$'] || 1;
                    const priceB = priceOrder[b.price || '$'] || 1;
                    comparison = priceA - priceB;
                    break;
                case 'taste':
                    // 好吃程度排序：ok < 好吃 < 讚
                    const tasteOrder = { 'ok': 1, '好吃': 2, '讚': 3 };
                    const tasteA = tasteOrder[a.taste || 'ok'] || 1;
                    const tasteB = tasteOrder[b.taste || 'ok'] || 1;
                    comparison = tasteA - tasteB;
                    break;
                default:
                    comparison = a.name.localeCompare(b.name, 'zh-TW');
            }
            
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return sortedItems;
    }
    
    updateItemsList() {
        this.itemsList.innerHTML = '';
        
        // 首先添加「+」新增卡片
        this.addNewItemCard();
        
        if (this.items.length === 0) {
            return;
        }
        
        const sortedItems = this.getSortedItems();
        
        sortedItems.forEach((item, index) => {
            // 找到原始索引位置
            const originalIndex = this.items.findIndex(originalItem => 
                originalItem.name === item.name && 
                originalItem.dateAdded === item.dateAdded
            );
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            // 創建標籤顯示
            const tagsHtml = item.tags ? item.tags.map(tag => 
                `<span class="item-tag">${tag}</span>`
            ).join('') : '';
            
            itemCard.innerHTML = `
                <div class="item-info">
                    <div class="item-header">
                        <div class="item-name">
                            ${item.name}
                            <span class="item-price">${item.price || '$'}</span>
                            <span class="item-taste">${item.taste || 'ok'}</span>
                        </div>
                        <div class="item-mini-actions">
                            <button class="mini-btn edit" onclick="wheel.editItemTags(${index}, ${originalIndex})" title="編輯標籤">✏️</button>
                            <button class="mini-btn delete" onclick="wheel.deleteItem(${originalIndex})" title="刪除">🗑️</button>
                        </div>
                    </div>
                    <div class="item-tags">${tagsHtml}</div>
                </div>
            `;
            
            this.itemsList.appendChild(itemCard);
        });
    }
    
    addNewItemCard() {
        const addCard = document.createElement('div');
        addCard.className = 'item-card add-item-card';
        addCard.innerHTML = `
            <div class="add-item-content">
                <div class="add-item-icon">+</div>

            </div>
        `;
        
        addCard.addEventListener('click', () => this.showAddItemModal());
        
        this.itemsList.appendChild(addCard);
    }
    
    editItemTags(displayIndex, originalIndex) {
        // 禁用所有其他項目的編輯和刪除按鈕（跳過第一個「+」卡片）
        this.disableOtherItemButtons(displayIndex + 1);
        
        const itemCard = this.itemsList.children[displayIndex + 1];
        const itemInfo = itemCard.querySelector('.item-info');
        const tagsDiv = itemInfo.querySelector('.item-tags');
        const actions = itemCard.querySelector('div[style*="display: flex"]');
        
        // 創建標籤編輯器
        const tagEditor = document.createElement('div');
        tagEditor.className = 'tag-editor';
        
        // 添加價格選擇器
        const priceSelector = document.createElement('div');
        priceSelector.className = 'price-selector';
        priceSelector.innerHTML = `
            <label>價格等級：</label>
            <div class="price-options">
                <label class="price-option ${this.items[originalIndex].price === '$' ? 'selected' : ''}">
                    <input type="radio" name="price-${displayIndex}" value="$" ${this.items[originalIndex].price === '$' ? 'checked' : ''}>
                    $
                </label>
                <label class="price-option ${this.items[originalIndex].price === '$$' ? 'selected' : ''}">
                    <input type="radio" name="price-${displayIndex}" value="$$" ${this.items[originalIndex].price === '$$' ? 'checked' : ''}>
                    $$
                </label>
                <label class="price-option ${this.items[originalIndex].price === '$$$' ? 'selected' : ''}">
                    <input type="radio" name="price-${displayIndex}" value="$$$" ${this.items[originalIndex].price === '$$$' ? 'checked' : ''}>
                    $$$
                </label>
            </div>
        `;
        
        // 為價格選項添加事件監聽器
        priceSelector.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // 移除所有選中狀態
                priceSelector.querySelectorAll('.price-option').forEach(option => {
                    option.classList.remove('selected');
                });
                // 添加選中狀態到當前選項
                e.target.parentElement.classList.add('selected');
            });
        });
        
        tagEditor.appendChild(priceSelector);
        
        // 添加好吃程度選擇器
        const tasteSelector = document.createElement('div');
        tasteSelector.className = 'taste-selector';
        tasteSelector.innerHTML = `
            <label>好吃程度：</label>
            <div class="taste-options">
                <label class="taste-option ${this.items[originalIndex].taste === 'ok' ? 'selected' : ''}">
                    <input type="radio" name="taste-${displayIndex}" value="ok" ${this.items[originalIndex].taste === 'ok' ? 'checked' : ''}>
                    ok
                </label>
                <label class="taste-option ${this.items[originalIndex].taste === '好吃' ? 'selected' : ''}">
                    <input type="radio" name="taste-${displayIndex}" value="好吃" ${this.items[originalIndex].taste === '好吃' ? 'checked' : ''}>
                    好吃
                </label>
                <label class="taste-option ${this.items[originalIndex].taste === '讚' ? 'selected' : ''}">
                    <input type="radio" name="taste-${displayIndex}" value="讚" ${this.items[originalIndex].taste === '讚' ? 'checked' : ''}>
                    讚
                </label>
            </div>
        `;
        
        // 為好吃程度選項添加事件監聽器
        tasteSelector.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // 移除所有選中狀態
                tasteSelector.querySelectorAll('.taste-option').forEach(option => {
                    option.classList.remove('selected');
                });
                // 添加選中狀態到當前選項
                e.target.parentElement.classList.add('selected');
            });
        });
        
        tagEditor.appendChild(tasteSelector);
        
        this.categories.forEach(category => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.id = `edit-tag-${displayIndex}-${category}`;
            checkbox.checked = this.items[originalIndex].tags && this.items[originalIndex].tags.includes(category);
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = category;
            label.className = 'tag-checkbox';
            if (checkbox.checked) {
                label.classList.add('selected');
            }
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
            
            label.appendChild(checkbox);
            tagEditor.appendChild(label);
        });
        
        // 添加管理分類的「+」按鈕
        const addLabel = document.createElement('label');
        addLabel.className = 'tag-checkbox';
        addLabel.textContent = '+';
        addLabel.title = '管理標籤';
        addLabel.style.cursor = 'pointer';
        addLabel.addEventListener('click', () => {
            this.showCategoryModal();
            // 當分類管理彈窗關閉後，更新編輯器的標籤選項
            const originalHideCategoryModal = this.hideCategoryModal.bind(this);
            this.hideCategoryModal = () => {
                originalHideCategoryModal();
                // 重新建立編輯器以包含新的標籤
                this.editItemTags(displayIndex, originalIndex);
                // 恢復原本的 hideCategoryModal 方法
                this.hideCategoryModal = originalHideCategoryModal;
            };
        });
        
        tagEditor.appendChild(addLabel);
        
        // 替換標籤顯示為編輯器
        tagsDiv.style.display = 'none';
        itemInfo.appendChild(tagEditor);
        
        // 隱藏原有按鈕，添加編輯按鈕
        const miniActions = itemCard.querySelector('.item-mini-actions');
        miniActions.innerHTML = `
            <button class="mini-btn save" onclick="wheel.saveItemTags(${displayIndex}, ${originalIndex})" title="保存">✅</button>
            <button class="mini-btn cancel" onclick="wheel.cancelEditItemTags(${displayIndex})" title="取消">❌</button>
        `;
    }
    
    saveItemTags(displayIndex, originalIndex) {
        const itemCard = this.itemsList.children[displayIndex];
        const tagEditor = itemCard.querySelector('.tag-editor');
        const checkedBoxes = tagEditor.querySelectorAll('input[type="checkbox"]:checked');
        const selectedPriceRadio = tagEditor.querySelector('input[name^="price-"]:checked');
        const selectedTasteRadio = tagEditor.querySelector('input[name^="taste-"]:checked');
        
        const selectedTags = Array.from(checkedBoxes).map(cb => cb.value);
        const selectedPrice = selectedPriceRadio ? selectedPriceRadio.value : '$';
        const selectedTaste = selectedTasteRadio ? selectedTasteRadio.value : 'ok';
        
        if (selectedTags.length === 0) {
            alert('請至少選擇一個標籤！');
            return;
        }
        
        this.items[originalIndex].tags = selectedTags;
        this.items[originalIndex].price = selectedPrice;
        this.items[originalIndex].taste = selectedTaste;
        this.enableAllItemButtons(); // 恢復所有按鈕
        this.updateWheel();
        this.updateItemsList();
        this.saveData();
    }
    
    cancelEditItemTags(index) {
        this.enableAllItemButtons(); // 恢復所有按鈕
        this.updateItemsList(); // 重新渲染列表以取消編輯
    }
    
    disableOtherItemButtons(editingIndex) {
        // 禁用所有其他項目的編輯和刪除按鈕（跳過第一個「+」卡片）
        Array.from(this.itemsList.children).forEach((itemCard, index) => {
            if (index !== editingIndex && index > 0) { // 跳過第一個「+」卡片
                const buttons = itemCard.querySelectorAll('.mini-btn');
                buttons.forEach(btn => {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = '請先完成其他項目的編輯';
                });
            }
        });
    }
    
    enableAllItemButtons() {
        // 恢復所有項目的編輯和刪除按鈕（跳過第一個「+」卡片）
        Array.from(this.itemsList.children).forEach((itemCard, index) => {
            if (index > 0) { // 跳過第一個「+」卡片
                const buttons = itemCard.querySelectorAll('.mini-btn');
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    // 恢復原本的 title
                    if (btn.classList.contains('edit')) {
                        btn.title = '編輯標籤';
                    } else if (btn.classList.contains('delete')) {
                        btn.title = '刪除';
                    }
                });
            }
        });
    }
    
    // 分類管理方法
    updateCategoryButtons() {
        this.categoryButtons.innerHTML = '';
        
        this.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category;
            btn.dataset.category = category;
            btn.addEventListener('click', (e) => {
                this.filterCategory(e.target.dataset.category);
            });
            
            if (this.currentCategory === category) {
                btn.classList.add('active');
            }
            
            this.categoryButtons.appendChild(btn);
        });
        
        // 添加管理分類的「+」按鈕
        const addBtn = document.createElement('button');
        addBtn.className = 'category-btn category-add-btn';
        addBtn.textContent = '+';
        addBtn.title = '管理標籤';
        addBtn.addEventListener('click', () => this.showCategoryModal());
        
        this.categoryButtons.appendChild(addBtn);
    }
    
    updateModalTagsCheckboxes() {
        this.modalTagsCheckboxes.innerHTML = '';
        
        this.categories.forEach(category => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = category;
            checkbox.id = `modal-tag-${category}`;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = category;
            label.className = 'tag-checkbox';
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
            
            label.appendChild(checkbox);
            this.modalTagsCheckboxes.appendChild(label);
        });
        
        // 添加管理分類的「+」按鈕
        const addLabel = document.createElement('label');
        addLabel.className = 'tag-checkbox';
        addLabel.textContent = '+';
        addLabel.title = '管理標籤';
        addLabel.style.cursor = 'pointer';
        addLabel.addEventListener('click', () => {
            this.showCategoryModal();
            // 當分類管理彈窗關閉後，更新新增餐點彈窗的標籤選項
            const originalHideCategoryModal = this.hideCategoryModal.bind(this);
            this.hideCategoryModal = () => {
                originalHideCategoryModal();
                // 重新更新新增餐點彈窗的標籤選項
                this.updateModalTagsCheckboxes();
                // 恢復原本的 hideCategoryModal 方法
                this.hideCategoryModal = originalHideCategoryModal;
            };
        });
        
        this.modalTagsCheckboxes.appendChild(addLabel);
    }
    
    showCategoryModal() {
        this.categoryModal.style.display = 'flex';
        this.updateCategoriesManagementList();
        // 防止背景滾動
        document.body.style.overflow = 'hidden';
        // 自動聚焦到新增標籤輸入框
        setTimeout(() => {
            this.newCategoryName.focus();
        }, 300);
    }
    
    hideCategoryModal() {
        this.categoryModal.style.display = 'none';
        // 恢復背景滾動
        document.body.style.overflow = 'auto';
        // 清空輸入框
        this.newCategoryName.value = '';
    }
    
    addCategory() {
        const name = this.newCategoryName.value.trim();
        
        if (!name) {
            alert('請輸入分類名稱！');
            return;
        }
        
        if (this.categories.includes(name)) {
            alert('這個分類已經存在了！');
            return;
        }
        
        this.categories.push(name);
        this.newCategoryName.value = '';
        
        this.updateCategoryButtons();
        this.updateModalTagsCheckboxes();
        this.updateCategoriesManagementList();
        this.updateItemsList();
        this.saveData();
    }
    
    editCategory(index, newName) {
        if (!newName || newName.trim() === '') {
            alert('分類名稱不能為空！');
            return false;
        }
        
        if (this.categories.includes(newName) && this.categories[index] !== newName) {
            alert('這個分類名稱已經存在！');
            return false;
        }
        
        const oldName = this.categories[index];
        this.categories[index] = newName.trim();
        
        // 更新所有使用此標籤的餐點
        this.items.forEach(item => {
            if (item.tags && item.tags.includes(oldName)) {
                const tagIndex = item.tags.indexOf(oldName);
                item.tags[tagIndex] = newName.trim();
            }
        });
        
        this.updateCategoryButtons();
        this.updateModalTagsCheckboxes();
        this.updateCategoriesManagementList();
        this.updateWheel();
        this.updateItemsList();
        this.saveData();
        
        return true;
    }
    
    deleteCategory(index) {
        const categoryName = this.categories[index];
        const itemsWithTag = this.items.filter(item => item.tags && item.tags.includes(categoryName));
        
        if (itemsWithTag.length > 0) {
            const confirmMessage = `標籤 "${categoryName}" 還在 ${itemsWithTag.length} 個餐點中使用。\n確定要刪除這個標籤嗎？`;
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // 從所有使用此標籤的餐點中移除
            this.items.forEach(item => {
                if (item.tags && item.tags.includes(categoryName)) {
                    item.tags = item.tags.filter(tag => tag !== categoryName);
                    // 如果餐點沒有任何標籤了，加上"其他"標籤
                    if (item.tags.length === 0) {
                        item.tags = ['其他'];
                    }
                }
            });
        } else {
            if (!confirm(`確定要刪除標籤 "${categoryName}" 嗎？`)) {
                return;
            }
        }
        
        this.categories.splice(index, 1);
        
        // 確保至少有一個"其他"分類
        if (!this.categories.includes('其他')) {
            this.categories.push('其他');
        }
        
        this.updateCategoryButtons();
        this.updateModalTagsCheckboxes();
        this.updateCategoriesManagementList();
        this.updateWheel();
        this.updateItemsList();
        this.saveData();
    }
    
    updateCategoriesManagementList() {
        this.categoriesList.innerHTML = '';
        
        this.categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            
            categoryItem.innerHTML = `
                <input type="text" value="${category}" disabled data-original="${category}">
                <div class="category-actions">
                    <button class="edit-btn" onclick="wheel.startEditCategory(${index})">編輯</button>
                    <button class="delete-btn" onclick="wheel.deleteCategory(${index})">刪除</button>
                </div>
            `;
            
            this.categoriesList.appendChild(categoryItem);
        });
    }
    
    startEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        const actions = categoryItem.querySelector('.category-actions');
        
        input.disabled = false;
        input.focus();
        input.select();
        
        actions.innerHTML = `
            <button class="save-btn" onclick="wheel.saveEditCategory(${index})">保存</button>
            <button class="cancel-btn" onclick="wheel.cancelEditCategory(${index})">取消</button>
        `;
    }
    
    saveEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        const newName = input.value.trim();
        
        if (this.editCategory(index, newName)) {
            // 編輯成功，重新載入列表
            this.updateCategoriesManagementList();
        }
    }
    
    cancelEditCategory(index) {
        const categoryItem = this.categoriesList.children[index];
        const input = categoryItem.querySelector('input');
        
        input.value = input.dataset.original;
        input.disabled = true;
        
        const actions = categoryItem.querySelector('.category-actions');
        actions.innerHTML = `
            <button class="edit-btn" onclick="wheel.startEditCategory(${index})">編輯</button>
            <button class="delete-btn" onclick="wheel.deleteCategory(${index})">刪除</button>
        `;
    }
    
    filterCategory(category) {
        this.currentCategory = category;
        
        // 更新按鈕樣式
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category || (category === 'all' && btn.textContent === '全部')) {
                btn.classList.add('active');
            }
        });
        
        this.updateWheel();
        this.result.textContent = '';
    }
    
    saveData() {
        localStorage.setItem('wheelOfFoodItems', JSON.stringify(this.items));
        localStorage.setItem('wheelOfFoodCategories', JSON.stringify(this.categories));
    }
    
    loadData() {
        const savedItems = localStorage.getItem('wheelOfFoodItems');
        const savedCategories = localStorage.getItem('wheelOfFoodCategories');
        
        if (savedItems) {
            this.items = JSON.parse(savedItems);
            // 遷移舊資料格式：將 category 轉換為 tags
            this.items.forEach((item, index) => {
                if (item.category && !item.tags) {
                    item.tags = [item.category];
                    delete item.category;
                }
                // 確保每個餐點都有 tags 陣列
                if (!item.tags) {
                    item.tags = ['其他'];
                }
                // 確保每個餐點都有價格
                if (!item.price) {
                    item.price = '$';
                }
                // 確保每個餐點都有好吃程度
                if (!item.taste) {
                    item.taste = 'ok';
                }
                // 為沒有時間戳的舊資料添加時間戳
                if (!item.dateAdded) {
                    item.dateAdded = Date.now() - (this.items.length - index) * 100000;
                }
            });
        }
        
        if (savedCategories) {
            this.categories = JSON.parse(savedCategories);
        }
        
        // 確保有基本標籤
        if (!this.categories.includes('熱食')) {
            this.categories.push('熱食');
        }
    }
}

// 初始化轉盤
const wheel = new WheelOfFood();