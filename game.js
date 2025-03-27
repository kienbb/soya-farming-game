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
            
            // Kiểm tra xem các ô special có liền kề nhau không (bao gồm đường chéo)
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

    getAdjacentCells(row, col) {
        const adjacent = [];
        
        // Duyệt qua tất cả các ô xung quanh, bao gồm cả đường chéo
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                // Bỏ qua ô hiện tại
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                // Kiểm tra ô mới có nằm trong bàn chơi không
                if (newRow >= 0 && newRow < this.boardRows && 
                    newCol >= 0 && newCol < this.boardCols) {
                    adjacent.push({row: newRow, col: newCol});
                }
            }
        }
        
        return adjacent;
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
        
        // Kiểm tra theo đường chéo chính (từ trên trái xuống dưới phải)
        for (let i = 0; i < this.boardRows - 2; i++) {
            for (let j = 0; j < this.boardCols - 2; j++) {
                if (this.board[i][j] === this.board[i+1][j+1] && 
                    this.board[i][j] === this.board[i+2][j+2] &&
                    this.types.basic.includes(this.board[i][j])) {
                    matches.push([
                        {row: i, col: j},
                        {row: i+1, col: j+1},
                        {row: i+2, col: j+2}
                    ]);
                }
            }
        }
        
        // Kiểm tra theo đường chéo phụ (từ trên phải xuống dưới trái)
        for (let i = 0; i < this.boardRows - 2; i++) {
            for (let j = 2; j < this.boardCols; j++) {
                if (this.board[i][j] === this.board[i+1][j-1] && 
                    this.board[i][j] === this.board[i+2][j-2] &&
                    this.types.basic.includes(this.board[i][j])) {
                    matches.push([
                        {row: i, col: j},
                        {row: i+1, col: j-1},
                        {row: i+2, col: j-2}
                    ]);
                }
            }
        }
        
        // Kiểm tra 3 ô liên kết (không nhất thiết phải thẳng hàng) - giữ lại phần này
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const type = this.board[i][j];
                if (!this.types.basic.includes(type)) continue;
                
                // Tìm tất cả các ô liền kề, bao gồm cả đường chéo
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
        
        // Kiểm tra xem các ô special có liền kề nhau không (bao gồm đường chéo)
        for (let beo of specialTypes['beo-tot']) {
            for (let dam of specialTypes['dam-tot']) {
                // Kiểm tra xem beo-tot và dam-tot có liền kề nhau không (bao gồm đường chéo)
                if (this.isAdjacent(beo.row, beo.col, dam.row, dam.col)) {
                    for (let xo of specialTypes['xo-tot']) {
                        // Kiểm tra xem xo-tot có liền kề với beo-tot hoặc dam-tot không
                        if (this.isAdjacent(dam.row, dam.col, xo.row, xo.col) || 
                            this.isAdjacent(beo.row, beo.col, xo.row, xo.col)) {
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
        
        // Tách các ô thường và ô đặc biệt
        const basicCells = [];
        const specialPositions = [];
        
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                const cellType = this.board[i][j];
                if (this.types.special.includes(cellType) || cellType === 'fami') {
                    // Lưu vị trí của các ô đặc biệt
                    specialPositions.push({row: i, col: j, type: cellType});
                } else {
                    // Chỉ tráo các ô thường
                    basicCells.push(cellType);
                }
            }
        }
        
        // Tráo ngẫu nhiên các ô thường
        for (let i = basicCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [basicCells[i], basicCells[j]] = [basicCells[j], basicCells[i]];
        }
        
        // Đặt lại vào bàn chơi
        let basicIndex = 0;
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                // Kiểm tra xem vị trí hiện tại có phải ô đặc biệt không
                const specialCell = specialPositions.find(pos => pos.row === i && pos.col === j);
                if (specialCell) {
                    this.board[i][j] = specialCell.type;
                } else {
                    this.board[i][j] = basicCells[basicIndex++];
                }
            }
        }
        
        // Kiểm tra nếu không có nước đi hợp lệ và đã đạt tới giới hạn tráo đổi
        if (!this.hasValidMoves() && this.consecutiveScrambles >= this.maxConsecutiveScrambles) {
            // Thử thêm các ô cơ bản để đảm bảo có ít nhất 3 ô cùng loại
            this.ensureValidMoves();
        }
        
        // Đảm bảo không tráo trùng lặp
        if (JSON.stringify(this.board) === JSON.stringify(oldBoard)) {
            // Nếu bàn chơi không thay đổi, thay đổi một số ô ngẫu nhiên
            for (let i = 0; i < 3; i++) {
                const row = Math.floor(Math.random() * this.boardRows);
                const col = Math.floor(Math.random() * this.boardCols);
                // Chỉ thay đổi nếu không phải ô đặc biệt
                if (!this.types.special.includes(this.board[row][col]) && this.board[row][col] !== 'fami') {
                    this.board[row][col] = this.getRandomType();
                }
            }
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
                
                // Thêm class riêng cho các ô đặc biệt (chỉ thay đổi nền không thay đổi viền)
                if (this.types.special.includes(this.board[i][j])) {
                    cell.classList.add('special-cell');
                    cell.classList.add(`special-${this.board[i][j]}`);
                }
                
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
        
        if (!cell) return;
        
        // Nếu ô đã được chọn rồi, bỏ chọn nó
        if (this.selectedCells.some(c => c.row === row && c.col === col)) {
            // Bỏ chọn ô hiện tại
            cell.classList.remove('selected');
            // Xóa ô khỏi danh sách đã chọn
            this.selectedCells = this.selectedCells.filter(c => !(c.row === row && c.col === col));
            return;
        }
        
        // Nếu đã chọn đủ 3 ô, không cho chọn thêm
        if (this.selectedCells.length >= 3) return;
        
        // Nếu chưa chọn ô nào hoặc ô mới liền kề với ít nhất một ô đã chọn
        if (this.selectedCells.length === 0 || 
            this.selectedCells.some(c => this.isAdjacent(c.row, c.col, row, col))) {
            
            this.selectedCells.push({row, col, type});
            cell.classList.add('selected');
            
            // Nếu đã chọn đủ 3 ô, kiểm tra kết hợp
            if (this.selectedCells.length === 3) {
                document.querySelectorAll('.confetti').forEach(c => c.remove());
                this.checkMatch();
            }
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        
        // Cho phép kết hợp theo cả đường chéo (rowDiff = 1 && colDiff = 1)
        return (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0));
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
        
        // Kiểm tra xem có phải là tất cả các loại đặc biệt khác nhau
        const hasAllSpecialTypes = ['beo-tot', 'dam-tot', 'xo-tot'].every(specialType => 
            types.includes(specialType)
        );
        
        // Kiểm tra xem tất cả các ô có liền kề nhau không
        const allAdjacent = this.areAllCellsAdjacent(this.selectedCells);
        
        setTimeout(() => {
            // Chỉ trừ lượt khi kết hợp thành công
            if ((allSameType && isBasicType && allAdjacent) || 
                (allSpecialType && hasAllSpecialTypes && allAdjacent)) {
                this.moves--;
            }
            
            if (allSameType && isBasicType && allAdjacent) {
                // Lấy ô đầu tiên người dùng chọn là ô kết quả
                const firstCell = this.selectedCells[0];
                let upgradedType;
                
                switch(types[0]) {
                    case 'omega3': upgradedType = 'beo-tot'; break;
                    case 'asam': upgradedType = 'dam-tot'; break;
                    case 'xo': upgradedType = 'xo-tot'; break;
                }
                
                this.board[firstCell.row][firstCell.col] = upgradedType;
                
                // Các ô còn lại sẽ được thay thế bằng loại ngẫu nhiên
                this.selectedCells.slice(1).forEach(cell => {
                    this.board[cell.row][cell.col] = this.getRandomType();
                });
                
                this.renderBoard();
                this.isAnimating = false;
                
                // Kiểm tra nếu không còn nước đi hợp lệ
                this.checkAndHandleNoValidMoves();
            } else if (allSpecialType && hasAllSpecialTypes && allAdjacent) {
                // Lấy ô đầu tiên người dùng chọn là ô kết quả
                const firstCell = this.selectedCells[0];
                
                // Lưu lại các ô khác để thay thế sau
                const otherCells = this.selectedCells.slice(1).map(cell => ({
                    row: cell.row,
                    col: cell.col
                }));
                
                // Cập nhật trạng thái bàn chơi ngay lập tức để tránh lỗi
                // Xóa tất cả các ô đã chọn khỏi bàn chơi trước
                this.selectedCells.forEach(cell => {
                    if (cell !== firstCell) {
                        // Các ô khác sẽ được thay thế bằng loại cơ bản ngẫu nhiên
                        this.board[cell.row][cell.col] = this.getRandomType();
                    }
                });
                
                // Đặt Fami vào ô đầu tiên để hiển thị hiệu ứng
                this.board[firstCell.row][firstCell.col] = 'fami';
                
                // Render lại bàn chơi để thấy sự thay đổi
                this.renderBoard();
                
                // Thêm hiệu ứng đặc biệt cho ô Fami
                const famiCell = document.querySelector(`[data-row="${firstCell.row}"][data-col="${firstCell.col}"]`);
                if (famiCell) {
                    famiCell.classList.add('super-match');
                    famiCell.style.zIndex = "10";
                }
                
                // Animate Fami appearance and disappearance
                setTimeout(() => {
                    const famiCellContent = document.querySelector(`[data-row="${firstCell.row}"][data-col="${firstCell.col}"] .cell-content`);
                    if (famiCellContent) {
                        famiCellContent.classList.add('fami-disappearing');
                        
                        // Thêm hiệu ứng ánh sáng xung quanh
                        const light = document.createElement('div');
                        light.className = 'fami-light';
                        famiCell.appendChild(light);
                        
                        // Tạo hộp Fami bay đến vị trí điểm số
                        this.createFlyingFami(famiCell);
                    }
                    
                    setTimeout(() => {
                        this.famiCount++;
                        // Replace Fami with random basic type
                        this.board[firstCell.row][firstCell.col] = this.getRandomType();
                        
                        this.renderBoard();
                        this.updateUI();
                        this.isAnimating = false;

                        // Kiểm tra nếu không còn nước đi hợp lệ
                        this.checkAndHandleNoValidMoves();
                    }, 2000);
                }, 1000);
            } else {
                // Kết hợp không hợp lệ
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
    
    // Thêm phương thức mới để kiểm tra xem tất cả các ô có liền kề nhau không
    areAllCellsAdjacent(cells) {
        if (cells.length <= 1) return true;
        
        // Tạo một bản đồ các ô liền kề nhau
        const graph = {};
        
        for (let i = 0; i < cells.length; i++) {
            const key = `${cells[i].row},${cells[i].col}`;
            graph[key] = [];
            
            for (let j = 0; j < cells.length; j++) {
                if (i !== j && this.isAdjacent(cells[i].row, cells[i].col, cells[j].row, cells[j].col)) {
                    graph[key].push(`${cells[j].row},${cells[j].col}`);
                }
            }
        }
        
        // Kiểm tra tính kết nối bằng BFS
        const visited = new Set();
        const queue = [`${cells[0].row},${cells[0].col}`];
        visited.add(queue[0]);
        
        while (queue.length > 0) {
            const current = queue.shift();
            for (const neighbor of graph[current] || []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        // Nếu tất cả các ô đều được thăm, chúng có liên kết với nhau
        return visited.size === cells.length;
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
            this.moves += 10; // Tăng số lượt chơi lên 10 khi chia sẻ
            this.updateUI();
            this.showSuccessModal('share');
        } else {
            this.showSuccessModal('share-limit');
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
        // Chỉ hiển thị popup cho một số trường hợp cụ thể
        if (type !== 'share' && type !== 'share-limit' && type !== 'exchange') {
            return;
        }
        
        if (!this.successModal) return;
        
        const titleElem = this.successModal.querySelector('h3');
        const messageElem = this.successModal.querySelector('p');
        const rewardInfo = this.successModal.querySelector('.reward-info');
        
        if (!rewardInfo || !titleElem || !messageElem) return;
        
        switch(type) {
            case 'share':
                titleElem.textContent = 'Chia sẻ thành công!';
                messageElem.textContent = 'Cảm ơn bạn đã chia sẻ game.';
                rewardInfo.textContent = 'Bạn nhận được thêm 10 lượt chơi!';
                break;
            case 'share-limit':
                titleElem.textContent = 'Đã đạt giới hạn!';
                messageElem.textContent = 'Bạn đã đạt giới hạn chia sẻ trong ngày hôm nay.';
                rewardInfo.textContent = 'Hãy quay lại vào ngày mai!';
                break;
            case 'exchange':
                titleElem.textContent = 'Đổi thành công!';
                messageElem.textContent = 'Bạn đã đổi Fami lấy Đậu vàng!';
                rewardInfo.textContent = 'Đã đổi 1 Sữa đậu Fami lấy 1 Hạt đậu vàng!';
                break;
            default:
                // Các trường hợp khác không hiển thị modal
                return;
        }
        
        this.successModal.style.display = 'flex';
        
        // Tự động ẩn modal sau 2 giây
        setTimeout(() => {
            this.successModal.style.display = 'none';
        }, 2000);
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
        
        if (this.isAnimating || this.moves <= 0) return;
        
        // Tìm các khả năng kết hợp
        let validMatches = this.findBasicTypeMatches();
        if (validMatches.length === 0) {
            validMatches = this.findSpecialTypeMatches();
        }
        
        if (validMatches.length > 0) {
            // Chọn một kết hợp ngẫu nhiên
            const randomMatchIndex = Math.floor(Math.random() * validMatches.length);
            const match = validMatches[randomMatchIndex];
            
            // Chỉ highlight ô đầu tiên trong phương án
            const cellToHighlight = match[0];
            const cellElement = document.querySelector(`[data-row="${cellToHighlight.row}"][data-col="${cellToHighlight.col}"]`);
            if (cellElement) {
                cellElement.classList.add('highlight');
                this.hintCells.push(cellElement);
                
                // Flash ô được highlight để làm nổi bật
                const flashCells = () => {
                    this.hintCells.forEach(cell => {
                        cell.classList.toggle('flash-highlight');
                    });
                };
                
                // Flash 3 lần để thu hút sự chú ý
                flashCells();
                setTimeout(flashCells, 300);
                setTimeout(flashCells, 600);
                setTimeout(flashCells, 900);
            }
            
            if (this.hintBtn) {
                this.hintBtn.classList.add('active');
                setTimeout(() => {
                    this.hintBtn.classList.remove('active');
                }, 1000);
            }
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
        
        // Lưu lại trạng thái bàn chơi trước khi tráo
        const oldBoard = JSON.parse(JSON.stringify(this.board));
        
        // Thêm hiệu ứng animation cho tất cả các ô
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.add('scramble-animation');
        });
        
        setTimeout(() => {
            // Tráo đổi vị trí các ô
            this.shuffleBoard();
            
            // Tạo hiệu ứng tráo đổi vị trí giữa các ô
            this.animateScramble(oldBoard);
            
            // Kiểm tra xem đã có nước đi hợp lệ chưa
            if (!this.hasValidMoves() && this.consecutiveScrambles < this.maxConsecutiveScrambles) {
                // Nếu vẫn chưa có, tiếp tục tráo đổi
                setTimeout(() => {
                    this.isAnimating = false;
                    this.scrambleBoard();
                }, 800); // Tăng thời gian để đợi animation hoàn tất
            } else {
                // Nếu đã có hoặc đã đạt tới giới hạn tráo đổi, hoàn tất
                setTimeout(() => {
                    this.isAnimating = false;
                    this.consecutiveScrambles = 0;
                    if (this.hintBtn) {
                        // Flash nút gợi ý để khuyến khích người dùng sử dụng
                        this.hintBtn.classList.add('highlight');
                        setTimeout(() => {
                            this.hintBtn.classList.remove('highlight');
                        }, 2000);
                    }
                }, 800); // Tăng thời gian để đợi animation hoàn tất
            }
        }, 300);
    }
    
    // Thêm phương thức mới để tạo hiệu ứng animation khi tráo đổi
    animateScramble(oldBoard) {
        // Tạo bản đồ các ô cũ và mới để so sánh
        const oldCells = {};
        const newCells = {};
        
        // Lưu vị trí các ô cũ
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                oldCells[`${oldBoard[i][j]}-${i}-${j}`] = {row: i, col: j, type: oldBoard[i][j]};
            }
        }
        
        // Lưu vị trí các ô mới
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                newCells[`${this.board[i][j]}-${i}-${j}`] = {row: i, col: j, type: this.board[i][j]};
            }
        }
        
        // Tạo hiệu ứng bay cho mỗi ô
        for (let i = 0; i < this.boardRows; i++) {
            for (let j = 0; j < this.boardCols; j++) {
                // Lấy phần tử DOM cho ô hiện tại
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (!cell) continue;
                
                // Thêm class animation
                cell.classList.add('tile-moving');
                
                // Đặt delay ngẫu nhiên cho mỗi ô để tạo hiệu ứng tự nhiên
                const delay = Math.random() * 300;
                cell.style.transitionDelay = `${delay}ms`;
            }
        }
        
        // Render lại bàn chơi sau khi animation kết thúc
        setTimeout(() => {
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('scramble-animation', 'tile-moving');
                cell.style.transitionDelay = '';
            });
            this.renderBoard();
        }, 700); // Đợi animation kết thúc
    }

    checkAndHandleNoValidMoves() {
        if (!this.hasValidMoves()) {
            setTimeout(() => {
                // Gọi scrambleBoard thay vì reset toàn bộ bàn chơi
                this.scrambleBoard();
            }, 500);
        }
    }

    // Thêm phương thức mới để tạo hiệu ứng Fami bay đến vị trí điểm số
    createFlyingFami(sourceCell) {
        const famiCounter = document.getElementById('fami-count');
        if (!famiCounter) return;
        
        // Lấy vị trí của nguồn (ô đầu tiên)
        const sourceRect = sourceCell.getBoundingClientRect();
        // Lấy vị trí của đích (bộ đếm Fami)
        const targetRect = famiCounter.getBoundingClientRect();
        
        // Tạo phần tử Fami bay
        const flyingFami = document.createElement('div');
        flyingFami.className = 'flying-fami';
        
        // Tạo hình ảnh Fami
        const famiImg = document.createElement('img');
        famiImg.src = './assets/fami.svg';
        famiImg.alt = 'Fami';
        flyingFami.appendChild(famiImg);
        
        // Tạo hiệu ứng đuôi ánh sáng
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.setProperty('--delay', `${Math.random() * 1000}ms`);
            sparkle.style.setProperty('--size', `${Math.random() * 5 + 2}px`);
            sparkle.style.setProperty('--top', `${Math.random() * 100}%`);
            sparkle.style.setProperty('--left', `${Math.random() * 100}%`);
            sparkle.style.setProperty('--opacity', `${Math.random() * 0.7 + 0.3}`);
            flyingFami.appendChild(sparkle);
        }
        
        // Đặt vị trí ban đầu
        flyingFami.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
        flyingFami.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
        
        // Thêm vào DOM
        document.body.appendChild(flyingFami);
        
        // Đặt vị trí đích và thêm class để kích hoạt animation
        setTimeout(() => {
            flyingFami.style.left = `${targetRect.left + targetRect.width / 2}px`;
            flyingFami.style.top = `${targetRect.top + targetRect.height / 2}px`;
            flyingFami.classList.add('flying');
            
            // Sau khi animation kết thúc, xóa phần tử
            setTimeout(() => {
                flyingFami.remove();
            }, 1000); // Thời gian phải >= thời gian animation
        }, 50); // Timeout nhỏ để đảm bảo transition hoạt động
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoyaFarming();
});
