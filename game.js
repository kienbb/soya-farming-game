class SoyaFarming {
    constructor() {
        this.board = [];
        this.boardSize = 6;
        this.selectedCells = [];
        this.score = 0;
        this.moves = 20;
        this.types = ['beo-tot', 'xo-tot', 'dam-tot'];
        this.shareCount = 0;
        this.maxSharesPerDay = 3;

        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.movesDisplay = document.getElementById('moves');
        this.shareBtn = document.getElementById('share-btn');
        this.registerModal = document.getElementById('register-modal');
        this.successModal = document.getElementById('success-modal');

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Show registration first
        this.registerModal.style.display = 'flex';
        
        // Initialize the game board
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = this.getRandomType();
            }
        }
        
        this.renderBoard();
        this.updateUI();
    }

    getRandomType() {
        return this.types[Math.floor(Math.random() * this.types.length)];
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Use emoji/text placeholders instead of images
                const text = document.createElement('div');
                text.className = 'cell-content';
                switch(this.board[i][j]) {
                    case 'beo-tot':
                        text.innerHTML = '🌱';
                        text.title = 'Béo Tốt';
                        break;
                    case 'xo-tot':
                        text.innerHTML = '🌿';
                        text.title = 'Xơ Tốt';
                        break;
                    case 'dam-tot':
                        text.innerHTML = '🍃';
                        text.title = 'Đạm Tốt';
                        break;
                }
                cell.appendChild(text);
                this.gameBoard.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        this.gameBoard.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell || this.moves <= 0) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col);
        });

        this.shareBtn.addEventListener('click', () => this.handleShare());

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerModal.style.display = 'none';
        });
    }

    handleCellClick(row, col) {
        const type = this.board[row][col];
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.selectedCells.length === 0) {
            this.selectedCells.push({row, col, type});
            cell.classList.add('selected');
        } else {
            // Check if cells are adjacent and of same type
            const lastCell = this.selectedCells[this.selectedCells.length - 1];
            if (this.isAdjacent(lastCell.row, lastCell.col, row, col) && lastCell.type === type) {
                this.selectedCells.push({row, col, type});
                cell.classList.add('selected');

                if (this.selectedCells.length === 3) {
                    this.handleMatch();
                }
            } else {
                // Reset selection
                this.clearSelection();
            }
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }

    handleMatch() {
        // Add match animation
        this.selectedCells.forEach(cell => {
            const elem = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
            elem.classList.add('match-animation');
        });

        setTimeout(() => {
            // Update score and board
            this.score += 10;
            this.moves--;
            
            // Replace matched cells with new ones
            this.selectedCells.forEach(cell => {
                this.board[cell.row][cell.col] = this.getRandomType();
            });
            
            this.clearSelection();
            this.renderBoard();
            this.updateUI();
            
            // Show success modal
            this.showSuccessModal();
            
            // Check game over
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

    showSuccessModal() {
        const modal = document.getElementById('success-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 1500);
    }

    handleShare() {
        if (this.shareCount < this.maxSharesPerDay) {
            // In real implementation, this would integrate with Zalo's sharing API
            this.shareCount++;
            this.moves++;
            this.updateUI();
            alert('Chia sẻ thành công! Bạn nhận được thêm 1 lượt chơi.');
        } else {
            alert('Bạn đã đạt giới hạn chia sẻ trong ngày hôm nay.');
        }
    }

    handleGameOver() {
        setTimeout(() => {
            alert(`Trò chơi kết thúc! Điểm của bạn: ${this.score}`);
            // Here you would typically send the score to server and check for rewards
        }, 500);
    }

    updateUI() {
        this.scoreDisplay.textContent = this.score;
        this.movesDisplay.textContent = this.moves;
        this.shareBtn.disabled = this.shareCount >= this.maxSharesPerDay;
    }
}

// Start game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SoyaFarming();
});
