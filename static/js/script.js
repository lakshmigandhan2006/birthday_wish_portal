document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const cursorGlow = document.getElementById('cursor-glow');
    const wishForm = document.getElementById('wish-form');
    const wishWall = document.getElementById('wish-wall');
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    const selectedEmojiInput = document.getElementById('selected-emoji');
    const bgMusic = document.getElementById('bgMusic');
    const submitSound = document.getElementById('submit-sound');
    const sendBtn = document.getElementById('send-btn');
    const heroTitle = document.getElementById('hero-title');

    window.toggleMusic = function() {
        const music = document.getElementById("bgMusic");
        if (music.paused) {
            music.play();
        } else {
            music.pause();
        }
    };

    // Hide loader
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => loader.style.display = 'none', 800);
            startAnimations();
        }, 1500);
    });


    // 3D Tilt & Cursor Glow
    document.addEventListener('mousemove', (e) => {
        // Cursor Glow
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        
        if (window.innerWidth > 992) {
            const tiltElements = document.querySelectorAll('.tilt-element');
            tiltElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                
                // Card Shine Effect
                const shine = el.querySelector('.card-glass-shine, .glass-reflection');
                if (shine) {
                    const shineX = (x / rect.width) * 100;
                    const shineY = (y / rect.height) * 100;
                    shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.15) 0%, transparent 80%)`;
                }
            });
        }
    });

    // Parallax Scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const parallaxLayers = document.querySelectorAll('.parallax-layer');
        
        parallaxLayers.forEach(layer => {
            const speed = layer.dataset.speed || 0.1;
            const yPos = -(scrolled * speed);
            layer.style.transform = `translateY(${yPos}px)`;
        });
    });

    // Handle Form & Wishes (retaining logic)
    loadWishes();

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedEmojiInput.value = btn.dataset.emoji;
        });
    });

    wishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const message = document.getElementById('message').value;
        const emoji = selectedEmojiInput.value;

        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = 'Sending...';

        try {
            const response = await fetch('/api/wishes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message, emoji })
            });

            if (response.ok) {
                playSubmitSound();
                triggerConfetti();
                triggerEmojiRain(emoji);
                wishForm.reset();
                resetEmojiSelection();
                // Music is now manually toggled per user request
                await loadWishes();
                scrollToLatest();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalText;
        }
    });

    async function loadWishes() {
        try {
            const response = await fetch('/api/wishes');
            const wishes = await response.json();
            if (wishes.length === 0) {
                wishWall.innerHTML = '<div class="loading-wishes">Be the first to wish! ✨</div>';
                return;
            }
            wishWall.innerHTML = '';
            wishes.forEach((wish, index) => {
                const card = document.createElement('div');
                card.className = 'wish-card';
                card.innerHTML = `
                    <button class="delete-btn" title="Delete Wish">&times;</button>
                    <span class="card-emoji">${wish.emoji}</span>
                    <h3>${wish.name}</h3>
                    <p>${wish.message}</p>
                    <span class="time">${formatDate(wish.timestamp)}</span>
                `;
                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this wish?')) deleteWish(wish.id, card);
                });
                wishWall.appendChild(card);
            });
        } catch (error) {}
    }

    async function deleteWish(id, cardElement) {
        const response = await fetch(`/api/wishes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            cardElement.style.opacity = '0';
            setTimeout(() => {
                cardElement.remove();
                if (wishWall.children.length === 0) loadWishes();
            }, 500);
        }
    }

    function triggerEmojiRain(emoji) {
        const count = 40;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'falling-emoji';
                el.innerText = emoji;
                el.style.left = Math.random() * 100 + 'vw';
                el.style.animationDuration = (Math.random() * 2 + 3) + 's';
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 5000);
            }, i * 100);
        }
    }

    function triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#ffffff'] });
        }
    }

    function startAnimations() {
        const text = heroTitle.innerText;
        heroTitle.innerText = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                heroTitle.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, 100);
            }
        }
        type();
    }

    function playSubmitSound() {
        submitSound.currentTime = 0;
        submitSound.play().catch(e => {});
    }

    function scrollToLatest() {
        setTimeout(() => {
            const firstCard = wishWall.firstChild;
            if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function resetEmojiSelection() {
        emojiBtns.forEach(b => b.classList.remove('active'));
        emojiBtns[0].classList.add('active');
        selectedEmojiInput.value = '❤️';
    }
});
