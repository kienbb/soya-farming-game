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
        
        // Thêm biến cho tính năng gợi ý
        this.hintTimer = null;
        this.hintTimeout = 15000; // 15 giây
        this.hintCells = [];
        this.lastInteractionTime = Date.now();
        
        // Thêm biến cho việc đếm số lần scramble liên tiếp để tránh vòng lặp vô hạn
        this.consecutiveScrambles = 0;
        this.maxConsecutiveScrambles = 5;

        // Get DOM elements
        this.gameBoard = document.getElementById('game-board');
        this.scoreDisplay = document.getElementById('score');
        this.movesDisplay = document.getElementById('moves');
        this.shareBtn = document.getElementById('share-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.registerModal = document.getElementById('register-modal');
        this.successModal = document.getElementById('success-modal');

        this.initializeGame();
        this.setupEventListeners();
        this.createIcons();
        this.startHintTimer();
    }

    createIcons() {
        console.log('Game icons loaded from assets/icons directory');
        // Các biểu tượng đã được cung cấp dưới dạng file tĩnh
        // Nếu trong trường hợp cần thiết, chúng ta có thể tạo thêm các biểu tượng động
        // nhưng ưu tiên sử dụng các biểu tượng tĩnh
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
        // Kiểm tra xem có kết hợp 3 ô cùng loại basic không
        const basicTypeMatches = this.findBasicTypeMatches();
        if (basicTypeMatches.length > 0) {
            return true;
        }
        
        // Kiểm tra xem có đủ 3 loại special để tạo Fami không
        const specialTypes = {
            'beo-tot': [],
            'dam-tot': [],
            'xo-tot': []
        };
        
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (this.types.special.includes(type)) {
                    specialTypes[type].push({row: i, col: j});
                }
            }
        }
        
        // Kiểm tra xem có ít nhất một ô của mỗi loại special không
        if (specialTypes['beo-tot'].length > 0 && 
            specialTypes['dam-tot'].length > 0 && 
            specialTypes['xo-tot'].length > 0) {
            
            // Kiểm tra xem các ô special có liền kề nhau không
            for (let beo of specialTypes['beo-tot']) {
                for (let dam of specialTypes['dam-tot']) {
                    if (this.isAdjacent(beo.row, beo.col, dam.row, dam.col)) {
                        for (let xo of specialTypes['xo-tot']) {
                            if (this.isAdjacent(dam.row, dam.col, xo.row, xo.col) ||
                                this.isAdjacent(beo.row, beo.col, xo.row, xo.col)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }

    findBasicTypeMatches() {
        const matches = [];
        
        // Kiểm tra theo hàng ngang
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols - 2; j++) {
                // Kiểm tra 3 ô liên tiếp theo hàng ngang
                if (this.board[i][j] === this.board[i][j+1] && 
                    this.board[i][j] === this.board[i][j+2] &&
                    this.types.basic.includes(this.board[i][j])) {
                    matches.push([
                        {row: i, col: j},
                        {row: i, col: j+1},
                        {row: i, col: j+2}
                    ]);
                }
            }
        }
        
        // Kiểm tra theo hàng dọc
        for (let i = 0; i < this.boardRows - 2; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                // Kiểm tra 3 ô liên tiếp theo hàng dọc
                if (this.board[i][j] === this.board[i+1][j] && 
                    this.board[i][j] === this.board[i+2][j] &&
                    this.types.basic.includes(this.board[i][j])) {
                    matches.push([
                        {row: i, col: j},
                        {row: i+1, col: j},
                        {row: i+2, col: j}
                    ]);
                }
            }
        }
        
        // Kiểm tra 3 ô liên kết (không nhất thiết phải thẳng hàng)
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (!this.types.basic.includes(type)) continue;
                
                // Tìm tất cả các ô liền kề
                const neighbors = this.getAdjacentCells(i, j);
                
                // Lọc ra các ô có cùng loại
                const sameTypeNeighbors = neighbors.filter(n => this.board[n.row][n.col] === type);
                
                // Với mỗi ô liền kề cùng loại, tìm một ô khác liền kề với nó
                for (let n1 of sameTypeNeighbors) {
                    const neighborsOfN1 = this.getAdjacentCells(n1.row, n1.col);
                    
                    // Lọc ra các ô có cùng loại nhưng không phải ô ban đầu
                    const thirdCells = neighborsOfN1.filter(n2 => 
                        this.board[n2.row][n2.col] === type && 
                        !(n2.row === i && n2.col === j)
                    );
                    
                    // Nếu tìm thấy, thêm vào danh sách matches
                    if (thirdCells.length > 0) {
                        matches.push([
                            {row: i, col: j},
                            {row: n1.row, col: n1.col},
                            {row: thirdCells[0].row, col: thirdCells[0].col}
                        ]);
                    }
                }
            }
        }
        
        return matches;
    }

    getAdjacentCells(row, col) {
        const adjacent = [];
        
        // Ô bên trên
        if (row > 0) adjacent.push({row: row-1, col});
        
        // Ô bên dưới
        if (row < this.boardRows - 1) adjacent.push({row: row+1, col});
        
        // Ô bên trái
        if (col > 0) adjacent.push({row, col: col-1});
        
        // Ô bên phải
        if (col < this.boardCols - 1) adjacent.push({row, col: col+1});
        
        return adjacent;
    }

    findSpecialTypeMatches() {
        const matches = [];
        const specialTypes = {
            'beo-tot': [],
            'dam-tot': [],
            'xo-tot': []
        };
        
        // Thu thập tất cả các ô special
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (this.types.special.includes(type)) {
                    specialTypes[type].push({row: i, col: j});
                }
            }
        }
        
        // Kiểm tra xem các ô special có liền kề nhau không
        for (let beo of specialTypes['beo-tot']) {
            for (let dam of specialTypes['dam-tot']) {
                if (this.isAdjacent(beo.row, beo.col, dam.row, dam.col)) {
                    for (let xo of specialTypes['xo-tot']) {
                        if (this.isAdjacent(dam.row, dam.col, xo.row, xo.col)) {
                            matches.push([beo, dam, xo]);
                        } else if (this.isAdjacent(beo.row, beo.col, xo.row, xo.col)) {
                            matches.push([beo, dam, xo]);
                        }
                    }
                }
            }
        }
        
        return matches;
    }

    shuffleBoard() {
        // Lưu lại trạng thái trước khi tráo
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        const allCells = [];
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                allCells.push(this.board[i][j]);
            }
        }
        
        // Tráo ngẫu nhiên
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        
        // Đặt lại vào bàn chơi
        let index = 0;
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                this.board[i][j] = allCells[index++];
            }
        }
        
        // Kiểm tra nếu không có nước đi hợp lệ và đã đạt tới giới hạn tráo đổi
        if (!this.hasValidMoves() && this.consecutiveScrambles >= this.maxConsecutiveScrambles) {
            // Thử thêm các ô cơ bản để đảm bảo có ít nhất 3 ô cùng loại
            this.ensureValidMoves();
        }
        
        // Đảm bảo không tráo trùng lặp
        if (JSON.stringify(this.board) === JSON.stringify(oldBoard)) {
            this.shuffleBoard(); // Tráo lại nếu bàn chơi không thay đổi
        }
    }

    ensureValidMoves() {
        // Đặt 3 ô liên tiếp cùng loại để đảm bảo có nước đi
        const type = this.types.basic[Math.floor(Math.random() * this.types.basic.length)];
        const row = Math.floor(Math.random() * (this.boardRows - 2)) + 1;
        const col = Math.floor(Math.random() * (this.boardCols - 2)) + 1;
        
        // Đặt 3 ô theo hàng ngang
        this.board[row][col] = type;
        this.board[row][col+1] = type;
        this.board[row][col-1] = type;
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
                
                const content = document.createElement('div');
                content.className = 'cell-content';
                
                // Sử dụng SVG thay vì emoji
                const img = document.createElement('img');
                img.src = `./assets/${this.board[i][j]}.svg`;
                img.alt = this.titles[this.board[i][j]] || this.board[i][j];
                img.title = this.titles[this.board[i][j]] || this.board[i][j];
                img.className = 'cell-icon';
                
                content.appendChild(img);
                cell.appendChild(content);
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
            
            // Cập nhật thời gian tương tác cuối cùng và khởi động lại bộ đếm gợi ý
            this.lastInteractionTime = Date.now();
            this.resetHintTimer();
            
            // Xóa các highlight gợi ý trước đó nếu có
            this.clearHints();
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
                this.lastInteractionTime = Date.now();
                this.resetHintTimer();
            });
        }
        
        if (this.hintBtn) {
            this.hintBtn.addEventListener(this.isTouchDevice ? 'touchend' : 'click', (e) => {
                e.preventDefault();
                this.showHint();
                this.lastInteractionTime = Date.now();
                this.resetHintTimer();
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
                
                this.lastInteractionTime = Date.now();
                this.resetHintTimer();
            });
        }

        // Prevent zoom on double tap
        if (this.isTouchDevice) {
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
                
                this.lastInteractionTime = Date.now();
                this.resetHintTimer();
            }, { passive: false });

            let lastTap = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTap < 300) {
                    e.preventDefault();
                }
                lastTap = now;
                
                this.lastInteractionTime = Date.now();
                this.resetHintTimer();
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
                
                // Kiểm tra nếu không còn nước đi hợp lệ
                this.checkAndHandleNoValidMoves();
            } else if (allSpecialType && hasAllSpecialTypes) {
                // Save selected cells positions before any potential clearing
                const firstCellRow = this.selectedCells[0].row;
                const firstCellCol = this.selectedCells[0].col;
                const otherCells = this.selectedCells.slice(1).map(cell => ({row: cell.row, col: cell.col}));
                
                // Create temporary Fami for animation
                this.board[firstCellRow][firstCellCol] = 'fami';
                
                // Kích hoạt hiệu ứng confetti mạnh hơn
                createConfetti();
                createConfetti();
                createConfetti();
                
                this.renderBoard();
                
                // Animate Fami appearance and disappearance
                setTimeout(() => {
                    const famiCell = document.querySelector(`[data-row="${firstCellRow}"][data-col="${firstCellCol}"] .cell-content`);
                    if (famiCell) {
                        famiCell.classList.add('fami-disappearing');
                    }
                    
                    setTimeout(() => {
                        this.famiCount++;
                        // Replace Fami with random basic type
                        this.board[firstCellRow][firstCellCol] = this.getRandomType();
                        otherCells.forEach(cell => {
                            this.board[cell.row][cell.col] = this.getRandomType();
                        });
                        this.renderBoard();
                        this.updateUI();
                        this.isAnimating = false;

                        // Kiểm tra nếu không còn nước đi hợp lệ
                        this.checkAndHandleNoValidMoves();
                    }, 2000); // Kéo dài thời gian hiển thị Fami để người chơi thấy rõ hơn
                }, 1000);
                
                this.showSuccessModal('fami');
                this.clearSelection();
            } else {
                // Không hiển thị alert mà chỉ dùng modal
                this.showSuccessModal('invalid');
                this.isAnimating = false;
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
        this.lastInteractionTime = Date.now();
        this.resetHintTimer();
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
            this.showGameOverModal();
        }, 500);
    }

    showGameOverModal() {
        if (!this.successModal) {
            this.isAnimating = false;
            return;
        }
        
        const titleElem = this.successModal.querySelector('h3');
        const messageElem = this.successModal.querySelector('p');
        const rewardInfo = this.successModal.querySelector('.reward-info');
        
        if (!rewardInfo || !titleElem || !messageElem) {
            this.isAnimating = false;
            return;
        }
        
        titleElem.textContent = 'Trò chơi kết thúc!';
        messageElem.textContent = 'Bạn đã hết lượt chơi.';
        rewardInfo.innerHTML = `Sữa đậu Fami: ${this.famiCount}<br>Hạt đậu vàng: ${this.beanCount}`;
        
        // Thêm nút chơi lại vào modal
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Chơi lại';
        playAgainBtn.className = 'btn primary';
        playAgainBtn.style.marginTop = '15px';
        playAgainBtn.onclick = () => {
            this.resetGame();
            this.successModal.style.display = 'none';
        };
        
        rewardInfo.appendChild(document.createElement('br'));
        rewardInfo.appendChild(playAgainBtn);
        
        this.successModal.style.display = 'flex';
        this.isAnimating = false;
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
        
        const titleElem = this.successModal.querySelector('h3');
        const messageElem = this.successModal.querySelector('p');
        const rewardInfo = this.successModal.querySelector('.reward-info');
        
        if (!rewardInfo || !titleElem || !messageElem) return;
        
        switch(type) {
            case 'upgrade':
                titleElem.textContent = 'Tuyệt vời!';
                messageElem.textContent = 'Bạn đã kết hợp thành công!';
                rewardInfo.textContent = `Bạn đã tạo được ${this.titles[upgradedType]}!`;
                break;
            case 'fami':
                titleElem.textContent = 'Chúc mừng!';
                messageElem.textContent = 'Bạn đã tạo được Fami!';
                rewardInfo.textContent = 'Sữa đậu Fami đã được thêm vào điểm số của bạn!';
                break;
            case 'exchange':
                titleElem.textContent = 'Đổi thành công!';
                messageElem.textContent = 'Bạn đã đổi Fami lấy Đậu vàng!';
                rewardInfo.textContent = 'Đã đổi 1 Sữa đậu Fami lấy 1 Hạt đậu vàng!';
                break;
            case 'scramble':
                titleElem.textContent = 'Bàn chơi mới!';
                messageElem.textContent = 'Bàn chơi đã được xáo trộn!';
                rewardInfo.textContent = 'Bàn chơi đã được xáo trộn để tạo các nước đi mới!';
                break;
            case 'invalid':
                titleElem.textContent = 'Sắp được rồi!';
                messageElem.textContent = '';
                rewardInfo.textContent = 'Kết hợp không thành công!';
                break;
            default:
                titleElem.textContent = 'Thông báo';
                messageElem.textContent = '';
                rewardInfo.textContent = type === 'hint' 
                    ? upgradedType 
                    : 'Thông báo từ game!';
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

    startHintTimer() {
        this.stopHintTimer(); // Dừng timer hiện tại nếu có
        
        this.hintTimer = setInterval(() => {
            // Nếu đã qua 15 giây kể từ lần tương tác cuối
            if (Date.now() - this.lastInteractionTime > this.hintTimeout && !this.isAnimating) {
                this.showHint();
            }
        }, 1000); // Kiểm tra mỗi giây
    }
    
    stopHintTimer() {
        if (this.hintTimer) {
            clearInterval(this.hintTimer);
            this.hintTimer = null;
        }
    }
    
    resetHintTimer() {
        this.stopHintTimer();
        this.startHintTimer();
        this.clearHints();
    }
    
    clearHints() {
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        this.hintCells = [];
    }
    
    showHint() {
        // Xóa các highlight cũ
        this.clearHints();
        
        // Tìm các khả năng kết hợp
        let validMatches = this.findBasicTypeMatches();
        if (validMatches.length === 0) {
            validMatches = this.findSpecialTypeMatches();
        }
        
        if (validMatches.length > 0) {
            // Chọn một kết hợp ngẫu nhiên
            const randomMatchIndex = Math.floor(Math.random() * validMatches.length);
            const match = validMatches[randomMatchIndex];
            
            // Highlight các ô
            match.forEach(cell => {
                const cellElement = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                if (cellElement) {
                    cellElement.classList.add('highlight');
                    this.hintCells.push(cellElement);
                }
            });
        } else {
            // Nếu không tìm thấy kết hợp nào, thực hiện việc tráo đổi
            this.scrambleBoard();
        }
    }
    
    scrambleBoard() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        // Tăng bộ đếm scramble liên tiếp
        this.consecutiveScrambles++;
        
        // Thêm hiệu ứng animation cho tất cả các ô
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.add('scramble-animation');
        });
        
        setTimeout(() => {
            // Tráo đổi vị trí các ô
            this.shuffleBoard();
            
            // Render lại bàn chơi
            this.renderBoard();
            
            // Kiểm tra xem đã có nước đi hợp lệ chưa
            if (!this.hasValidMoves() && this.consecutiveScrambles < this.maxConsecutiveScrambles) {
                // Nếu vẫn chưa có, tiếp tục tráo đổi
                setTimeout(() => {
                    this.isAnimating = false;
                    this.scrambleBoard();
                }, 500);
            } else {
                // Nếu đã có hoặc đã đạt tới giới hạn tráo đổi, hoàn tất
                this.isAnimating = false;
                this.consecutiveScrambles = 0;
                if (this.hintBtn) {
                    // Flash nút gợi ý để khuyến khích người dùng sử dụng
                    this.hintBtn.classList.add('highlight');
                    setTimeout(() => {
                        this.hintBtn.classList.remove('highlight');
                    }, 2000);
                }
                
                // Hiển thị thông báo
                this.showSuccessModal('scramble');
            }
        }, 500);
    }

    checkAndHandleNoValidMoves() {
        if (!this.hasValidMoves()) {
            setTimeout(() => {
                this.scrambleBoard();
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoyaFarming();
});
