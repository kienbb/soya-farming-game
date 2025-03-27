function createConfetti() {
    const colors = ['#FFD700', '#4CAF50', '#FF6B6B', '#4A90E2', '#FFC107', '#9C27B0', '#00BCD4'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = Math.random() * 20 - 10 + 'vh';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.opacity = Math.random() * 0.5 + 0.5;
        confetti.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.6 + 0.4})`;
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
    
    // Thêm CSS cho animation confetti nếu chưa có
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            .confetti {
                position: fixed;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                animation: confetti-fall linear forwards;
                z-index: 1000;
            }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(-10vh) rotate(0deg);
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
