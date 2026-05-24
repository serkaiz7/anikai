// Local Database Mock (Mimicking sources extracted via anipy-cli API routes)
const animeCatalog = [
    {
        id: "1",
        title: "Chainsaw Man",
        episode: "Episode 12",
        image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60", // Safe abstract placeholder vector look
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Stable sample stream
    },
    {
        id: "2",
        title: "Demon Slayer: Infinity Castle",
        episode: "Episode 01",
        image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    {
        id: "3",
        title: "Kaiju No. 8",
        episode: "Episode 08",
        image: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=500&auto=format&fit=crop&q=60",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    }
];

// App State Management
let state = {
    tokens: parseInt(localStorage.getItem('anikai_tokens')) || 3, // Starts with 3 complimentary tokens
    unlockedEpisodes: JSON.parse(localStorage.getItem('anikai_unlocked')) || [],
    currentAnime: null,
    isAdPlaying: false
};

// UI Elements Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateTokenDisplay();
    renderGrid();
    setupEventListeners();
});

function updateTokenDisplay() {
    document.getElementById('token-count').innerText = state.tokens;
    localStorage.setItem('anikai_tokens', state.tokens);
}

function renderGrid() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '';
    
    animeCatalog.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${anime.image}" alt="${anime.title}">
                <span class="episode-badge">${anime.episode}</span>
            </div>
            <div class="card-info">
                <h4>${anime.title}</h4>
            </div>
        `;
        card.addEventListener('click', () => launchPlayer(anime));
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    // Unlock action
    document.getElementById('unlock-btn').addEventListener('click', attemptUnlock);
    
    // Simulate Video Reward Ad (Ultimate USB workflow style)
    document.getElementById('watch-ad-btn').addEventListener('click', playRewardedAd);
}

function showView(viewName) {
    if (viewName === 'home') {
        document.getElementById('home-view').classList.remove('hidden');
        document.getElementById('player-view').classList.add('hidden');
        const video = document.getElementById('main-video');
        video.pause(); // stop player stream background operations
    } else {
        document.getElementById('home-view').classList.add('hidden');
        document.getElementById('player-view').classList.remove('hidden');
    }
}

function launchPlayer(anime) {
    state.currentAnime = anime;
    showView('player');
    
    document.getElementById('player-title').innerText = anime.title;
    document.getElementById('player-episode').innerText = anime.episode;
    
    const videoElement = document.getElementById('main-video');
    const sourceElement = document.getElementById('video-source');
    sourceElement.src = anime.videoUrl;
    videoElement.load();

    // Check Token Validation Gate
    if (state.unlockedEpisodes.includes(anime.id)) {
        hideLockScreen();
    } else {
        showLockScreen();
    }
}

function showLockScreen() {
    document.getElementById('video-lock-screen').classList.remove('hidden');
}

function hideLockScreen() {
    document.getElementById('video-lock-screen').classList.add('hidden');
}

function attemptUnlock() {
    if (state.tokens >= 1) {
        state.tokens -= 1;
        state.unlockedEpisodes.push(state.currentAnime.id);
        
        // Persist to browser storage data structures
        localStorage.setItem('anikai_unlocked', JSON.stringify(state.unlockedEpisodes));
        updateTokenDisplay();
        hideLockScreen();
        
        // Autoplay safe initialization trigger
        document.getElementById('main-video').play().catch(err => console.log("Autoplay waiting user context alignment"));
    } else {
        alert("Insufficient balance! Please use the Refill Station in the sidebar to earn tokens.");
    }
}

// Rewarded Ad Simulation Engine
function playRewardedAd() {
    if (state.isAdPlaying) return;
    
    state.isAdPlaying = true;
    document.getElementById('watch-ad-btn').disabled = true;
    
    // Toggle layout container to viewing mode UI
    document.getElementById('ad-placeholder-content').classList.add('hidden');
    document.getElementById('ad-playing-content').classList.remove('hidden');
    
    let timeRemaining = 10;
    const timerDisplay = document.getElementById('ad-timer');
    timerDisplay.innerText = timeRemaining;
    
    /**
     * NOTE: When you drop in your production Google SDK script later, 
     * this local interval handler will be fully replaced by your programmatic Ad Event Listener callback.
     */
    const adCountdown = setInterval(() => {
        timeRemaining--;
        timerDisplay.innerText = timeRemaining;
        
        if (timeRemaining <= 0) {
            clearInterval(adCountdown);
            
            // Allocate token asset distribution balance adjustments
            state.tokens += 2;
            updateTokenDisplay();
            
            // Clear tracking and state lock fields
            state.isAdPlaying = false;
            document.getElementById('watch-ad-btn').disabled = false;
            document.getElementById('ad-placeholder-content').classList.remove('hidden');
            document.getElementById('ad-playing-content').classList.add('hidden');
            
            alert("Reward claimed! +2 Tokens have been credited to your account.");
        }
    }, 1000);
}
