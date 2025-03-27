function createConfetti() {
    const colors = ['#FFD700', '#4CAF50', '#FF6B6B', '#4A90E2', '#FFC107', '#9C27B0', '#00BCD4'];
    const confettiCount = 200;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Thêm một số hình dạng khác nhau
        const shape = Math.random() > 0.5 ? 'circle' : 'rect';
        confetti.classList.add(shape);
        
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = Math.random() * 30 - 20 + 'vh'; // Bắt đầu từ vị trí trên màn hình
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's'; // Kéo dài hơn
        confetti.style.opacity = Math.random() * 0.5 + 0.5; // Độ trong suốt thay đổi
        confetti.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.6 + 0.4})`; // Thêm hiệu ứng xoay
        
        // Thêm kích thước ngẫu nhiên
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = shape === 'circle' ? `${size}px` : `${size * 2}px`;
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000); // Kéo dài thời gian hiển thị confetti
    }
    
    // Thêm CSS cho animation confetti nếu chưa có
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            .confetti {
                position: fixed;
                border-radius: 0;
                animation: confetti-fall linear forwards;
                z-index: 1000;
            }
            
            .confetti.circle {
                border-radius: 50%;
            }
            
            .confetti.rect {
                width: 10px;
                height: 14px;
            }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-10vh) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
