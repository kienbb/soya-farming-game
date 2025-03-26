class SoyaFarming {
    constructor() {
        this.board = [];
        this.boardRows = 6;
        this.boardCols = 7;
        this.selectedCells = [];
        this.famiCount = 0;
        this.beanCount = 0;
        this.moves = 30;
        this.types = {
            basic: ['omega3', 'asam', 'xo'],
            special: ['beo-tot', 'dam-tot', 'xo-tot'],
            extra: ['fami', 'bean']
        };
        this.emojis = {
            'omega3': '💧',
            'asam': '🔮',
            'xo': '🌿',
            'beo-tot': '🌱',
            'dam-tot': '🍃',
            'xo-tot': '🍂',
            'fami': '🥛',
            'bean': '🌟'
        };
        this.titles = {
            'omega3': 'Omega 3',
            'asam': 'ASAM AMINO ESENSIAL',
            'xo': 'Xơ',
            'beo-tot': 'Béo Tốt',
            'dam-tot': 'Đạm Tốt',
            'xo-tot': 'Xơ Tốt',
            'fami': 'Sữa đậu Fami',
            'bean': 'Hạt đậu vàng'
        };
        this.shareCount = 0;
        this.maxSharesPerDay = 3;
        this.isAnimating = false;
        this.isTouchDevice = 'ontouchstart' in window;

        // Get DOM elements
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.movesDisplay = document.getElementById('moves');
        this.shareBtn = document.getElementById('share-btn');
        this.registerModal = document.getElementById('register-modal');
        this.successModal = document.getElementById('success-modal');

        this.initializeGame();
        this.setupEventListeners();
        this.createIcons();
    }

    createIcons() {
        try {
            const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
            iconSizes.forEach(size => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Draw icon background
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(0, 0, size, size);

                // Draw icon border
                ctx.strokeStyle = '#388E3C';
                ctx.lineWidth = size / 20;
                ctx.strokeRect(size/10, size/10, size*0.8, size*0.8);
                
                // Draw fami icon
                ctx.fillStyle = 'white';
                ctx.font = `${size/2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🥛', size/2, size/2);

                // Save icon
                canvas.toBlob(blob => {
                    if (blob) {
                        const iconUrl = URL.createObjectURL(blob);
                        const link = document.createElement('link');
                        link.rel = 'icon';
                        link.sizes = `${size}x${size}`;
                        link.href = iconUrl;
                        document.head.appendChild(link);
                    }
                }, 'image/png');
            });
        } catch (e) {
            console.warn('Could not create PWA icons:', e);
        }
    }

    resetGame() {
        this.moves = 30;
        this.famiCount = 0;
        this.beanCount = 0;
        this.shareCount = 0;
        this.selectedCells = [];
        this.isAnimating = false;
        this.initializeGame();
    }

    initializeGame() {
        if (this.registerModal) {
            this.registerModal.style.display = 'flex';
        }
        this.initializeBoard();
        this.renderBoard();
        this.updateUI();
    }

    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardRows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardCols; j++) {
                this.board[i][j] = this.getRandomType();
            }
        }
        
        if (!this.hasValidMoves()) {
            this.shuffleBoard();
        }
    }

    hasValidMoves() {
        // Check for possible matches of same type (horizontal)
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols - 2; j++) {
                if (this.board[i][j] === this.board[i][j+1] && 
                    this.board[i][j] === this.board[i][j+2] &&
                    this.types.basic.includes(this.board[i][j])) {
                    return true;
                }
            }
        }

        // Check for possible matches of same type (vertical)
        for (let i = 0; i < this.boardRows - 2; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                if (this.board[i][j] === this.board[i+1][j] && 
                    this.board[i][j] === this.board[i+2][j] &&
                    this.types.basic.includes(this.board[i][j])) {
                    return true;
                }
            }
        }
        
        // Count upgraded elements
        const upgradedTypes = ['beo-tot', 'dam-tot', 'xo-tot'];
        const typeCounts = {};
        upgradedTypes.forEach(type => typeCounts[type] = 0);
        
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (upgradedTypes.includes(type)) {
                    typeCounts[type]++;
                }
            }
        }
        
        // Check if all upgraded types are available
        if (upgradedTypes.every(type => typeCounts[type] > 0)) {
            return true;
        }

        // Check for possible combinations of basic elements
        const basicTypeCounts = {};
        this.types.basic.forEach(type => basicTypeCounts[type] = 0);
        
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (this.types.basic.includes(type)) {
                    basicTypeCounts[type]++;
                }
            }
        }
        
        return this.types.basic.every(type => basicTypeCounts[type] >= 3);
    }

    shuffleBoard() {
        const allCells = [];
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                allCells.push(this.board[i][j]);
            }
        }
        
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        
        let index = 0;
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                this.board[i][j] = allCells[index++];
            }
        }
        
        if (!this.hasValidMoves()) {
            this.initializeBoard();
        }
    }

    getRandomType() {
        return this.types.basic[Math.floor(Math.random() * this.types.basic.length)];
    }

    renderBoard() {
        if (!this.gameBoard) return;
        
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardCols}, var(--cell-size))`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.boardRows}, var(--cell-size))`;
        this.gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.dataset.type = this.board[i][j];
                
                const text = document.createElement('div');
                text.className = 'cell-content';
                text.innerHTML = this.emojis[this.board[i][j]];
                text.title = this.titles[this.board[i][j]] || this.board[i][j];
                cell.appendChild(text);
                this.gameBoard.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        if (!this.gameBoard) return;

        const handleInteraction = (e) => {
            if (this.isAnimating || this.moves <= 0) return;

            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const cell = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.cell');
            
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.handleCellClick(row, col);
        };

        if (this.isTouchDevice) {
            this.gameBoard.addEventListener('touchstart', handleInteraction, { passive: false });
        } else {
            this.gameBoard.addEventListener('click', handleInteraction);
        }

        if (this.shareBtn) {
            this.shareBtn.addEventListener(this.isTouchDevice ? 'touchend' : 'click', (e) => {
                e.preventDefault();
                this.handleShare();
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.registerModal) {
                    this.registerModal.style.display = 'none';
                }
            });
        }

        const exchangeBtn = document.getElementById('exchange-btn');
        if (exchangeBtn) {
            exchangeBtn.addEventListener(this.isTouchDevice ? 'touchend' : 'click', (e) => {
                e.preventDefault();
                if (this.isAnimating) return;
                
                if (this.exchangeFamiForBean()) {
                    this.showSuccessModal('exchange');
                    createConfetti();
                } else {
                    alert('Bạn cần có ít nhất 1 Sữa đậu Fami để đổi lấy Hạt đậu vàng!');
                }
            });
        }

        // Prevent zoom on double tap
        if (this.isTouchDevice) {
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            let lastTap = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTap < 300) {
                    e.preventDefault();
                }
                lastTap = now;
            }, { passive: false });
        }

        this.updateExchangeButton();
    }

    handleCellClick(row, col) {
        const type = this.board[row][col];
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell || this.selectedCells.some(c => c.row === row && c.col === col)) {
            return;
        }

        // Show hint after first selection
        if (this.selectedCells.length === 1) {
            const firstType = this.selectedCells[0].type;
            if (this.types.basic.includes(firstType)) {
                this.showSuccessModal('hint', `Chọn thêm 2 ô ${this.titles[firstType]} để tạo phần Tốt!`);
            } else if (this.types.special.includes(firstType)) {
                this.showSuccessModal('hint', 'Chọn thêm 2 phần Tốt khác để tạo Fami!');
            }
        }
        
        if (this.selectedCells.length === 0) {
            this.selectedCells.push({row, col, type});
            cell.classList.add('selected');
        } else {
            const lastCell = this.selectedCells[this.selectedCells.length - 1];
            
            if (this.isAdjacent(lastCell.row, lastCell.col, row, col)) {
                this.selectedCells.push({row, col, type});
                cell.classList.add('selected');

                if (this.selectedCells.length === 3) {
                    document.querySelectorAll('.confetti').forEach(c => c.remove());
                    this.checkMatch();
                }
            } else {
                this.clearSelection();
            }
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    checkMatch() {
        this.isAnimating = true;
        const types = this.selectedCells.map(cell => cell.type);
        
        this.selectedCells.forEach(cell => {
            const elem = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
            if (elem) {
                elem.classList.add('match-animation');
            }
        });

        const allSameType = types.every(type => type === types[0]);
        const isBasicType = this.types.basic.includes(types[0]);
        const allSpecialType = types.every(type => this.types.special.includes(type));
        const hasAllSpecialTypes = ['beo-tot', 'dam-tot', 'xo-tot'].every(type => 
            types.includes(type)
        );

        setTimeout(() => {
            if ((allSameType && isBasicType) || (allSpecialType && hasAllSpecialTypes)) {
                this.moves--;
            }
            
            if (allSameType && isBasicType) {
                let upgradedType;
                switch(types[0]) {
                    case 'omega3': upgradedType = 'beo-tot'; break;
                    case 'asam': upgradedType = 'dam-tot'; break;
                    case 'xo': upgradedType = 'xo-tot'; break;
                }
                
                this.board[this.selectedCells[0].row][this.selectedCells[0].col] = upgradedType;
                this.selectedCells.slice(1).forEach(cell => {
                    this.board[cell.row][cell.col] = this.getRandomType();
                });
                
                this.showSuccessModal('upgrade', upgradedType);
                this.renderBoard();
                this.isAnimating = false;
            } else if (allSpecialType && hasAllSpecialTypes) {
                // Create temporary Fami for animation
                this.board[this.selectedCells[0].row][this.selectedCells[0].col] = 'fami';
                createConfetti();
                
                this.renderBoard();
                
                // Animate Fami appearance and disappearance
                setTimeout(() => {
                    const famiCell = document.querySelector(`[data-row="${this.selectedCells[0].row}"][data-col="${this.selectedCells[0].col}"] .cell-content`);
                    if (famiCell) {
                        famiCell.classList.add('fami-disappearing');
                    }
                    
                    setTimeout(() => {
                        this.famiCount++;
                        // Replace Fami with random basic type
                        this.board[this.selectedCells[0].row][this.selectedCells[0].col] = this.getRandomType();
                        this.selectedCells.slice(1).forEach(cell => {
                            this.board[cell.row][cell.col] = this.getRandomType();
                        });
                        this.renderBoard();
                        this.updateUI();
                        this.isAnimating = false;

                        if (!this.hasValidMoves()) {
                            this.shuffleBoard();
                            this.renderBoard();
                            alert('Bàn chơi đã được xáo trộn để tạo các nước đi mới!');
                        }
                    }, 500);
                }, 1000);
                
                this.showSuccessModal('fami');
            } else {
                // Show specific error message based on the selected types
                const hasUpgradedTypes = types.some(type => this.types.special.includes(type));
                const allBasicTypes = types.every(type => this.types.basic.includes(type));
                
                let message = '';
                if (hasUpgradedTypes) {
                    message = 'Để tạo Fami cần kết hợp: Béo Tốt + Đạm Tốt + Xơ Tốt!';
                } else if (allBasicTypes) {
                    message = 'Kết hợp 3 ô cùng loại để tạo nên phần Tốt!';
                } else {
                    message = 'Kết hợp không hợp lệ! Hãy thử lại nhé!';
                }
                
                this.showSuccessModal('invalid');
                setTimeout(() => {
                    alert(message);
                    this.isAnimating = false;
                }, 1000);
                this.clearSelection();
                return;
            }
            
            this.clearSelection();
            this.updateUI();
            
            if (this.moves <= 0) {
                this.handleGameOver();
            }
        }, 300);
    }

    clearSelection() {
        document.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.selectedCells = [];
    }

    handleShare() {
        if (this.isAnimating) return;
        
        if (this.shareCount < this.maxSharesPerDay) {
            this.shareCount++;
            this.moves++;
            this.updateUI();
            alert('Chia sẻ thành công! Bạn nhận được thêm 1 lượt chơi.');
        } else {
            alert('Bạn đã đạt giới hạn chia sẻ trong ngày hôm nay.');
        }
    }

    handleGameOver() {
        this.isAnimating = true;
        setTimeout(() => {
            alert(`Trò chơi kết thúc!\nSữa đậu Fami: ${this.famiCount} 🥛\nHạt đậu vàng: ${this.beanCount} 🌟`);
            this.isAnimating = false;
            
            if (confirm('Bạn có muốn chơi lại không?')) {
                this.resetGame();
            }
        }, 500);
    }

    exchangeFamiForBean() {
        if (this.famiCount > 0) {
            this.famiCount--;
            this.beanCount++;
            this.updateUI();
            return true;
        }
        return false;
    }

    showSuccessModal(type, upgradedType = '') {
        if (!this.successModal) return;
        
        const rewardInfo = this.successModal.querySelector('.reward-info');
        if (!rewardInfo) return;
        
        switch(type) {
            case 'upgrade':
                rewardInfo.textContent = `🎯 Tuyệt vời! Bạn đã tạo được ${this.titles[upgradedType]}!`;
                break;
            case 'fami':
                rewardInfo.textContent = '🎉 Chúc mừng! Bạn đã tạo được Sữa đậu Fami! 🥛';
                break;
            case 'exchange':
                rewardInfo.textContent = '✨ Đã đổi thành công 1 Sữa đậu Fami lấy 1 Hạt đậu vàng!';
                break;
            default:
                rewardInfo.textContent = type === 'hint' 
                    ? upgradedType 
                    : 'Kết hợp không thành công!';
        }
        
        this.successModal.style.display = 'flex';
        setTimeout(() => {
            this.successModal.style.display = 'none';
        }, 1500);
    }

    updateExchangeButton() {
        const exchangeBtn = document.getElementById('exchange-btn');
        if (exchangeBtn) {
            exchangeBtn.disabled = this.famiCount <= 0;
        }
    }

    updateUI() {
        const famiCount = document.getElementById('fami-count');
        const beanCount = document.getElementById('bean-count');
        
        if (famiCount) famiCount.textContent = this.famiCount;
        if (beanCount) beanCount.textContent = this.beanCount;
        if (this.movesDisplay) this.movesDisplay.textContent = this.moves;
        if (this.shareBtn) this.shareBtn.disabled = this.shareCount >= this.maxSharesPerDay;
        
        this.updateExchangeButton();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoyaFarming();
});
