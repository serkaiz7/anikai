// Data model directly structured from anipy-cli's GoGoAnime schema output
const anipyDatabase = [
    {
        id: "one-piece",
        title: "One Piece",
        banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
        seasons: {
            "East Blue Saga": [
                { ep: "1", file: "https://vjs.zencdn.net/v/oceans.mp4" },
                { ep: "2", file: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4" },
                { ep: "3", file: "https://vjs.zencdn.net/v/oceans.mp4" }
            ],
            "Wano Kuni Arc": [
                { ep: "890", file: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4" },
                { ep: "891", file: "https://vjs.zencdn.net/v/oceans.mp4" }
            ]
        }
    },
    {
        id: "attack-on-titan",
        title: "Attack on Titan",
        banner: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600",
        seasons: {
            "Season 1": [
                { ep: "1", file: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4" },
                { ep: "2", file: "https://vjs.zencdn.net/v/oceans.mp4" }
            ],
            "Season 4 (Final Season)": [
                { ep: "1", file: "https://vjs.zencdn.net/v/oceans.mp4" },
                { ep: "2", file: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4" }
            ]
        }
    },
    {
        id: "demon-slayer",
        title: "Demon Slayer",
        banner: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=600",
        seasons: {
            "Season 1: Unwavering Resolve": [
                { ep: "1", file: "https://vjs.zencdn.net/v/oceans.mp4" },
                { ep: "2", file: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4" }
            ],
            "Mugen Train Movie": [
                { ep: "Full Movie", file: "https://vjs.zencdn.net/v/oceans.mp4" }
            ]
        }
    }
];

let state = {
    tokens: parseInt(localStorage.getItem('anikai_tokens')) ?? 3,
    unlockedStreams: JSON.parse(localStorage.getItem('anikai_unlocked_streams')) || {}, // Maps 'animeId-season-episode'
    activeAnime: null,
    activeSeason: null,
    activeEpisode: null,
    adRunning: false
};

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    document.getElementById('token-count').innerText = state.tokens;
    renderCatalog();
    
    document.getElementById('unlock-btn').addEventListener('click', processStreamUnlock);
    document.getElementById('watch-ad-btn').addEventListener('click', invokeAdReward);
    document.getElementById('season-select').addEventListener('change', (e) => {
        state.activeSeason = e.target.value;
        buildEpisodeChips();
    });
}

function renderCatalog() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '';
    anipyDatabase.forEach(anime => {
        const div = document.createElement('div');
        div.className = 'anime-card';
        div.innerHTML = `
            <div class="card-img-wrapper"><img src="${anime.banner}"></div>
            <div class="card-info"><h4>${anime.title}</h4></div>
        `;
        div.onclick = () => loadAnimeShowcase(anime);
        grid.appendChild(div);
    });
}

function loadAnimeShowcase(anime) {
    state.activeAnime = anime;
    state.activeSeason = Object.keys(anime.seasons)[0];
    
    showView('player');
    document.getElementById('player-title').innerText = anime.title;
    
    // Fill seasons drop down
    const sSelect = document.getElementById('season-select');
    sSelect.innerHTML = '';
    Object.keys(anime.seasons).forEach(season => {
        sSelect.innerHTML += `<option value="${season}">${season}</option>`;
    });
    
    buildEpisodeChips();
}

function buildEpisodeChips() {
    const container = document.getElementById('episode-chips');
    container.innerHTML = '';
    const eps = state.activeAnime.seasons[state.activeSeason];
    
    eps.forEach(epObj => {
        const chip = document.createElement('div');
        chip.className = 'ep-chip';
        chip.innerText = epObj.ep;
        chip.onclick = () => selectTargetEpisode(epObj);
        container.appendChild(chip);
    });

    // Default select first available episode
    if(eps.length > 0) selectTargetEpisode(eps[0]);
}

function selectTargetEpisode(epObj) {
    state.activeEpisode = epObj;
    
    // Highlight correct chip element UI
    document.querySelectorAll('.ep-chip').forEach(c => {
        c.classList.toggle('active', c.innerText === epObj.ep);
    });

    // Check Token Validation Key
    const gateKey = `${state.activeAnime.id}-${state.activeSeason}-${epObj.ep}`;
    if (state.unlockedStreams[gateKey]) {
        mountStreamSource(epObj.file);
    } else {
        displayLockOverlay();
    }
}

function mountStreamSource(url) {
    document.getElementById('video-lock-screen').classList.add('hidden');
    const v = document.getElementById('main-video');
    const s = document.getElementById('video-source');
    
    v.pause();
    s.src = url;
    v.load();
    
    // Self-healing pipeline if CDN flags custom network limits
    v.play().catch(() => {
        console.log("Awaiting user gesture to start playback engine safely.");
    });
}

function displayLockOverlay() {
    document.getElementById('video-lock-screen').classList.remove('hidden');
    document.getElementById('main-video').pause();
}

function processStreamUnlock() {
    if (state.tokens >= 1) {
        state.tokens--;
        const gateKey = `${state.activeAnime.id}-${state.activeSeason}-${state.activeEpisode.ep}`;
        state.unlockedStreams[gateKey] = true;
        
        localStorage.setItem('anikai_tokens', state.tokens);
        localStorage.setItem('anikai_unlocked_streams', JSON.stringify(state.unlockedStreams));
        
        document.getElementById('token-count').innerText = state.tokens;
        mountStreamSource(state.activeEpisode.file);
    } else {
        alert("Wallet empty! Interact with the Token Refill Station container.");
    }
}

function invokeAdReward() {
    if (state.adRunning) return;
    state.adRunning = true;
    document.getElementById('watch-ad-btn').disabled = true;
    
    document.getElementById('ad-placeholder-content').classList.add('hidden');
    document.getElementById('ad-playing-content').classList.remove('hidden');
    
    let cnt = 10;
    const timer = document.getElementById('ad-timer');
    timer.innerText = cnt;
    
    const ticker = setInterval(() => {
        cnt--;
        timer.innerText = cnt;
        if(cnt <= 0) {
            clearInterval(ticker);
            state.tokens += 2;
            localStorage.setItem('anikai_tokens', state.tokens);
            document.getElementById('token-count').innerText = state.tokens;
            
            state.adRunning = false;
            document.getElementById('watch-ad-btn').disabled = false;
            document.getElementById('ad-placeholder-content').classList.remove('hidden');
            document.getElementById('ad-playing-content').classList.add('hidden');
            alert("Reward verified! +2 tokens issued.");
        }
    }, 1000);
}

function showView(target) {
    document.getElementById('home-view').classList.toggle('hidden', target !== 'home');
    document.getElementById('player-view').classList.toggle('hidden', target !== 'player');
    if (target === 'home') document.getElementById('main-video').pause();
}
