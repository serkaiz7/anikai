// Replace this with your actual Render/Vercel URL after deploying the Python code
const API_BASE = "https://anikai-scraper-backend.onrender.com"; 

let state = {
    tokens: parseInt(localStorage.getItem('anikai_energy')) || 3,
    unlockedEpisodes: JSON.parse(localStorage.getItem('anikai_unlocked')) || [],
    selectedAnimeId: null,
    selectedEpisodeNum: null,
    currentStreamUrl: null,
    adRunning: false
};

document.addEventListener("DOMContentLoaded", () => {
    updateTokenUI();
    runDefaultDiscovery();

    document.getElementById('search-btn').addEventListener('click', executeSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
    });
    document.getElementById('unlock-btn').addEventListener('click', unlockCurrentEpisode);
    document.getElementById('trigger-ad-btn').addEventListener('click', watchSimulatedAd);
});

function updateTokenUI() {
    document.getElementById('token-count').innerText = state.tokens;
    localStorage.setItem('anikai_energy', state.tokens);
}

async function runDefaultDiscovery() {
    // Queries Naruto as a fallback on page load to fill out the grid instantly
    const res = await fetch(`${API_BASE}/api/search?keyword=naruto`);
    const data = await res.json();
    populateGrid(data);
}

async function executeSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    document.getElementById('catalog-grid').innerHTML = "<p>Scraping sources...</p>";
    try {
        const res = await fetch(`${API_BASE}/api/search?keyword=${encodeURIComponent(query)}`);
        const data = await res.json();
        populateGrid(data);
    } catch (err) {
        document.getElementById('catalog-grid').innerHTML = "<p>Backend server connecting... Check back in a minute.</p>";
    }
}

function populateGrid(list) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';
    
    if (list.length === 0) {
        grid.innerHTML = "<p>No matches found in the scraper index.</p>";
        return;
    }

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <p>${item.title}</p>
        `;
        card.onclick = () => openStreamingView(item.id, item.title);
        grid.appendChild(card);
    });
}

async function openStreamingView(alias, title) {
    state.selectedAnimeId = alias;
    document.getElementById('player-view').classList.remove('hidden');
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('player-title').innerText = title;
    
    const epBox = document.getElementById('episodes-box');
    epBox.innerHTML = "<p>Fetching episodes...</p>";

    // Fetch total episodes from Python backend
    const res = await fetch(`${API_BASE}/api/anime/${alias}`);
    const details = await res.json();
    
    epBox.innerHTML = '';
    for(let i = 1; i <= details.total_episodes; i++) {
        const btn = document.createElement('div');
        btn.className = 'ep-btn';
        btn.innerText = i;
        btn.onclick = () => loadEpisodeStream(i);
        epBox.appendChild(btn);
    }
    
    if(details.total_episodes > 0) {
        loadEpisodeStream(1);
    }
}

async function loadEpisodeStream(epNum) {
    state.selectedEpisodeNum = epNum;
    
    document.querySelectorAll('.ep-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.innerText) === epNum);
    });

    document.getElementById('main-player-frame').src = "";
    
    // Fetch streaming source link from our backend
    const res = await fetch(`${API_BASE}/api/stream?id=${state.selectedAnimeId}&ep=${epNum}`);
    const streamData = await res.json();
    
    if(streamData.stream_url) {
        state.currentStreamUrl = streamData.stream_url;
        
        // Check if stream is already unlocked
        const lockKey = `${state.selectedAnimeId}-ep-${epNum}`;
        if(state.unlockedEpisodes.includes(lockKey)) {
            bypassLockAndPlay();
        } else {
            document.getElementById('video-lock-screen').classList.remove('hidden');
        }
    } else {
        alert("Streaming host timed out. Try another episode.");
    }
}

function bypassLockAndPlay() {
    document.getElementById('video-lock-screen').classList.add('hidden');
    const playerFrame = document.getElementById('main-player-frame');
    
    // Refresh the component clean to clear memory buffers and bypass cache blocks
    playerFrame.src = ""; 
    setTimeout(() => {
        playerFrame.src = state.currentStreamUrl;
    }, 50);
}

function unlockCurrentEpisode() {
    const lockKey = `${state.selectedAnimeId}-ep-${state.selectedEpisodeNum}`;
    
    if(state.tokens >= 1) {
        state.tokens--;
        state.unlockedEpisodes.push(lockKey);
        localStorage.setItem('anikai_unlocked', JSON.stringify(state.unlockedEpisodes));
        updateTokenUI();
        bypassLockAndPlay();
    } else {
        alert("Not enough Energy! Watch an advertisement on the right to refill.");
    }
}

function watchSimulatedAd() {
    if(state.adRunning) return;
    state.adRunning = true;
    
    document.getElementById('trigger-ad-btn').disabled = true;
    document.getElementById('ad-idle').classList.add('hidden');
    document.getElementById('ad-active').classList.remove('hidden');
    
    let timerVal = 10;
    const counterDisplay = document.getElementById('ad-countdown');
    counterDisplay.innerText = timerVal;
    
    const countdownInterval = setInterval(() => {
        timerVal--;
        counterDisplay.innerText = timerVal;
        
        if(timerVal <= 0) {
            clearInterval(countdownInterval);
            state.tokens += 2;
            updateTokenUI();
            
            state.adRunning = false;
            document.getElementById('trigger-ad-btn').disabled = false;
            document.getElementById('ad-idle').classList.remove('hidden');
            document.getElementById('ad-active').classList.add('hidden');
            
            alert("Success! You watched the ad and earned +2 Energy Tokens.");
        }
    }, 1000);
}
