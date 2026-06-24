// Telegram Mini App Logic & 3D Parallax Card Effects

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram Protection Check
    const tgBlocker = document.getElementById('tg-blocker');
    const gameContainer = document.getElementById('game-container');
    const initData = window.Telegram?.WebApp?.initData;
    
    // Debug mode is only allowed on localhost/127.0.0.1 to prevent bypassing on production URL
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDebug = new URLSearchParams(window.location.search).has('debug') && isLocalhost;

    // If not in Telegram and debug flag is absent or not on localhost, block interface
    if ((!initData || initData.trim() === '') && !isDebug) {
        tgBlocker.classList.remove('hidden');
        const preloader = document.getElementById('game-preloader');
        if (preloader) preloader.style.display = 'none';
        return;
    }

    // 1.5. Asset Preloading
    const imagesToPreload = [];
    const videosToPreload = [];
    const videoBlobs = {};

    if (typeof gameConfig !== 'undefined') {
        if (gameConfig.roomScenes) {
            gameConfig.roomScenes.forEach(scene => {
                if (scene.roomBg) imagesToPreload.push(scene.roomBg);
                if (scene.videoUrl) videosToPreload.push(scene.videoUrl);
            });
        }
        if (gameConfig.backgrounds) {
            if (gameConfig.backgrounds.cooldown) imagesToPreload.push(gameConfig.backgrounds.cooldown);
            if (gameConfig.backgrounds.limitReached) imagesToPreload.push(gameConfig.backgrounds.limitReached);
        }
    } else {
        imagesToPreload.push(
            'https://i.postimg.cc/jdVtrd2b/room-bg1.jpg',
            'https://i.postimg.cc/Gh0d1htd/room-bg2.jpg',
            'https://i.postimg.cc/YqcMwq0t/room-bg3.jpg',
            'https://i.postimg.cc/TY8fXY1R/time-bg1.jpg',
            'https://i.postimg.cc/hPFcqPvD/time-bg2.jpg'
        );
        videosToPreload.push(
            'videos/intro_video1.mp4',
            'videos/intro_video2.mp4',
            'videos/intro_video3.mp4'
        );
    }

    if (typeof cardsData !== 'undefined') {
        cardsData.forEach(card => {
            if (card.baseImageUrl && card.baseImageUrl.trim() !== '') {
                imagesToPreload.push(card.baseImageUrl);
            }
            if (card.overlayImageUrl && card.overlayImageUrl.trim() !== '') {
                imagesToPreload.push(card.overlayImageUrl);
            }
        });
    }

    const preloader = document.getElementById('game-preloader');
    const preloaderBar = document.getElementById('preloader-bar');
    const preloaderPercent = document.getElementById('preloader-percent');

    function preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(url);
            img.src = url;
        });
    }

    function preloadVideo(url) {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                videoBlobs[url] = blobUrl;
                console.log("Видео загружено в кэш:", url, "->", blobUrl);
                return url;
            })
            .catch(err => {
                console.error("Ошибка предзагрузки видео:", url, err);
                return url;
            });
    }

    let loadedCount = 0;
    const totalResources = imagesToPreload.length + videosToPreload.length;

    function handleResourceLoaded() {
        loadedCount++;
        const percent = Math.round((loadedCount / totalResources) * 100);
        if (preloaderPercent) preloaderPercent.textContent = `${percent}%`;
        if (preloaderBar) preloaderBar.style.width = `${percent}%`;

        if (loadedCount === totalResources) {
            setTimeout(completePreload, 400);
        }
    }

    if (totalResources === 0) {
        completePreload();
    } else {
        // Preload Images
        imagesToPreload.forEach(url => {
            preloadImage(url).then(handleResourceLoaded);
        });

        // Preload Videos
        videosToPreload.forEach(url => {
            preloadVideo(url).then(handleResourceLoaded);
        });
    }

    function completePreload() {
        if (preloader) {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        }
    }

    // In Telegram (or debug), initialize WebApp settings
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        // Set header color to match our dark theme
        tg.setHeaderColor('#07070c');
        tg.setBackgroundColor('#07070c');
    }

    // 2. UI Elements & Setup
    const pullBtn = document.getElementById('pull-btn');
    const uiLayer = document.getElementById('ui-layer');
    const introVideo = document.getElementById('intro-video');
    const cardStage = document.getElementById('card-stage');
    const whiteFlash = document.getElementById('white-flash');
    const holoCard = document.getElementById('holo-card');

    // Update the pull description based on gameConfig rules
    const pullDesc = document.querySelector('.pull-description');
    if (pullDesc && typeof gameConfig !== 'undefined' && gameConfig.rules) {
        const { maxAttempts, cooldownHours } = gameConfig.rules;
        let attemptsText = `${maxAttempts} `;
        if (maxAttempts === 1) {
            attemptsText += 'открытие';
        } else if (maxAttempts >= 2 && maxAttempts <= 4) {
            attemptsText += 'открытия';
        } else {
            attemptsText += 'открытий';
        }

        let hoursText = `${cooldownHours} `;
        if (cooldownHours === 1) {
            hoursText += 'час';
        } else if (cooldownHours >= 2 && cooldownHours <= 4) {
            hoursText += 'часа';
        } else {
            hoursText += 'часов';
        }

        pullDesc.innerHTML = `Замок чемодана выдержит ${attemptsText}. Попытаться можно 1 раз каждые ${hoursText}.<br>Полное восстановление в 00:00 по МСК.`;
    }

    function selectRandomRoom() {
        const roomBg = document.getElementById('room-bg');
        if (typeof gameConfig !== 'undefined' && gameConfig.roomScenes && gameConfig.roomScenes.length > 0) {
            const scene = (typeof CardChance !== 'undefined' && CardChance.getRandomScene)
                ? CardChance.getRandomScene(gameConfig.roomScenes)
                : gameConfig.roomScenes[Math.floor(Math.random() * gameConfig.roomScenes.length)];
            if (roomBg && scene && scene.roomBg) {
                roomBg.style.backgroundImage = `url('${scene.roomBg}')`;
            }
            if (introVideo && scene && scene.videoUrl) {
                introVideo.src = videoBlobs[scene.videoUrl] || scene.videoUrl;
                introVideo.loop = true;
                introVideo.load();
            }
        } else {
            // Fallback
            const roomNum = Math.floor(Math.random() * 3) + 1;
            const fallbackBgs = {
                1: 'https://i.postimg.cc/jdVtrd2b/room-bg1.jpg',
                2: 'https://i.postimg.cc/Gh0d1htd/room-bg2.jpg',
                3: 'https://i.postimg.cc/YqcMwq0t/room-bg3.jpg'
            };
            if (roomBg) {
                roomBg.style.backgroundImage = `url('${fallbackBgs[roomNum]}')`;
            }
            if (introVideo) {
                const fallbackUrl = `videos/intro_video${roomNum}.mp4`;
                introVideo.src = videoBlobs[fallbackUrl] || fallbackUrl;
                introVideo.loop = true;
                introVideo.load();
            }
        }
    }

    let currentBgState = 'none'; // 'active', 'cooldown', 'limit'

    // 2.5 Collection persistence & Album Logic
    let unlockedCards = new Set();
    let previewCard = null;
    let previewType = 'reg';
    let pulledCard = null;
    let pulledType = 'reg';
    let spentAttempts = 0;
    let lastSpinTime = 0;
    let isSpinning = false;

    // Helper for API requests
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const baseUrl = 'https://bot2-theanykey.amvera.io';
        const headers = {
            'Content-Type': 'application/json'
        };
        if (initData) {
            headers['X-Telegram-Init-Data'] = initData;
        } else if (isDebug) {
            headers['X-Telegram-Debug-User-Id'] = '999999';
        }
        
        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        return response.json();
    }

    // Load from localStorage as primary fallback
    function loadLocalState() {
        try {
            const savedCards = localStorage.getItem('unlocked_cards');
            if (savedCards) {
                unlockedCards = new Set(JSON.parse(savedCards));
            }
            const savedAttempts = localStorage.getItem('game_spent_attempts');
            if (savedAttempts !== null) {
                spentAttempts = parseInt(savedAttempts, 10);
            }
            const savedSpinTime = localStorage.getItem('game_last_spin_time');
            if (savedSpinTime !== null) {
                lastSpinTime = parseInt(savedSpinTime, 10);
            }
        } catch (e) {
            console.error("Failed to load collection from localStorage:", e);
        }
    }

    // Load state from the server database
    async function loadUserState() {
        try {
            const state = await apiRequest('/api/user-state');
            unlockedCards = new Set(state.unlockedCards);
            spentAttempts = state.spentAttempts;
            lastSpinTime = state.lastSpinTime;
            
            // Sync with local storage
            saveCollection();
            saveState();
            updateButtonAndCirclesState();
        } catch (err) {
            console.warn("Failed to load user state from server, using local cache:", err);
        }
    }

    // Check for reset parameter from the batch file
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset')) {
        try {
            localStorage.removeItem('unlocked_cards');
            localStorage.removeItem('game_spent_attempts');
            localStorage.removeItem('game_last_spin_time');
            
            // Also notify the server database to reset
            apiRequest('/api/reset', 'POST').catch(err => {
                console.error("Failed to reset progress on server:", err);
            });
        } catch (e) {
            console.error("Failed to clear localStorage on reset:", e);
        }
        // Clean URL params to prevent resetting on subsequent refreshes
        urlParams.delete('reset');
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, '', newUrl);
    }

    loadLocalState();

    function saveCollection() {
        try {
            localStorage.setItem('unlocked_cards', JSON.stringify(Array.from(unlockedCards)));
        } catch (e) {
            console.error("Failed to save collection to localStorage:", e);
        }
    }

    function saveState() {
        try {
            localStorage.setItem('game_spent_attempts', spentAttempts);
            localStorage.setItem('game_last_spin_time', lastSpinTime);
        } catch (e) {
            console.error("Failed to save state to localStorage:", e);
        }
    }

    // Moscow Time (MSK, UTC+3) Helpers
    function getNextMskMidnight(nowTimestamp) {
        const msk = new Date(nowTimestamp + 3 * 3600 * 1000);
        const nextDayMsk = new Date(Date.UTC(
            msk.getUTCFullYear(),
            msk.getUTCMonth(),
            msk.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        return nextDayMsk.getTime() - 3 * 3600 * 1000;
    }

    function isDifferentMskDay(timeA, timeB) {
        const dateA = new Date(timeA + 3 * 3600 * 1000);
        const dateB = new Date(timeB + 3 * 3600 * 1000);
        return dateA.getUTCDate() !== dateB.getUTCDate() ||
            dateA.getUTCMonth() !== dateB.getUTCMonth() ||
            dateA.getUTCFullYear() !== dateB.getUTCFullYear();
    }

    function formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    function setButtonActive() {
        pullBtn.disabled = false;
        pullBtn.classList.remove('cooldown', 'limit-reached');
        pullBtn.textContent = 'ТАЩИТЬ';
    }

    function setButtonCooldown(msLeft) {
        pullBtn.disabled = true;
        pullBtn.classList.add('cooldown');
        pullBtn.classList.remove('limit-reached');
        pullBtn.textContent = formatTime(msLeft);
    }

    function setButtonLimitReached() {
        pullBtn.disabled = true;
        pullBtn.classList.add('limit-reached');
        pullBtn.classList.remove('cooldown');
        pullBtn.textContent = 'ПРИХОДИ ЗАВТРА';
    }

    function updateButtonAndCirclesState() {
        const now = Date.now();
        const roomBg = document.getElementById('room-bg');

        // Reset check (if different MSK day)
        if (lastSpinTime > 0 && isDifferentMskDay(lastSpinTime, now)) {
            spentAttempts = 0;
            lastSpinTime = 0;
            saveState();
        }

        // Get game settings from configuration
        const maxAttempts = (typeof gameConfig !== 'undefined' && gameConfig.rules) ? gameConfig.rules.maxAttempts : 3;
        const cooldownHours = (typeof gameConfig !== 'undefined' && gameConfig.rules) ? gameConfig.rules.cooldownHours : 2;
        const cooldownDuration = cooldownHours * 3600 * 1000;

        // Dynamic circles update based on maxAttempts config
        const attemptsContainer = document.querySelector('.attempts-container');
        if (attemptsContainer) {
            let circles = attemptsContainer.querySelectorAll('.attempt-circle');
            if (circles.length !== maxAttempts) {
                attemptsContainer.innerHTML = '';
                for (let i = 0; i < maxAttempts; i++) {
                    const circle = document.createElement('div');
                    circle.className = 'attempt-circle';
                    attemptsContainer.appendChild(circle);
                }
                circles = attemptsContainer.querySelectorAll('.attempt-circle');
            }

            circles.forEach((circle, index) => {
                if (index < spentAttempts) {
                    circle.classList.add('spent');
                } else {
                    circle.classList.remove('spent');
                }
            });
        }

        // Временное отключение кулдауна и ограничений для тестирования (кнопка всегда активна)
        setButtonActive();
        if (currentBgState !== 'active') {
            selectRandomRoom();
            currentBgState = 'active';
        }
        return;

        /* Временная приостановка логики ограничений:
        if (spentAttempts === 0) {
            setButtonActive();
            if (currentBgState !== 'active') {
                selectRandomRoom();
                currentBgState = 'active';
            }
            return;
        }

        if (spentAttempts >= maxAttempts) {
            const nextMidnight = getNextMskMidnight(now);
            const msLeft = nextMidnight - now;
            if (msLeft <= 0) {
                spentAttempts = 0;
                lastSpinTime = 0;
                saveState();
                setButtonActive();
                if (currentBgState !== 'active') {
                    selectRandomRoom();
                    currentBgState = 'active';
                }
            } else {
                setButtonLimitReached();
                if (!isSpinning && currentBgState !== 'limit') {
                    const limitBg = (typeof gameConfig !== 'undefined' && gameConfig.backgrounds) ? gameConfig.backgrounds.limitReached : 'https://i.postimg.cc/hPFcqPvD/time-bg2.jpg';
                    if (roomBg) roomBg.style.backgroundImage = `url('${limitBg}')`;
                    currentBgState = 'limit';
                }
            }
            return;
        }

        // Cooldown calculation for attempt 1 to maxAttempts - 1
        const cooldownEnd = lastSpinTime + cooldownDuration;
        const nextMidnight = getNextMskMidnight(lastSpinTime);
        const timeToMidnightFromSpin = nextMidnight - lastSpinTime;

        let effectiveCooldownEnd = cooldownEnd;
        if (timeToMidnightFromSpin < cooldownDuration) {
            effectiveCooldownEnd = nextMidnight;
        }

        const msLeft = effectiveCooldownEnd - now;

        if (msLeft <= 0) {
            setButtonActive();
            if (currentBgState !== 'active') {
                selectRandomRoom();
                currentBgState = 'active';
            }
        } else {
            setButtonCooldown(msLeft);
            if (!isSpinning && currentBgState !== 'cooldown') {
                const cooldownBg = (typeof gameConfig !== 'undefined' && gameConfig.backgrounds) ? gameConfig.backgrounds.cooldown : 'https://i.postimg.cc/TY8fXY1R/time-bg1.jpg';
                if (roomBg) roomBg.style.backgroundImage = `url('${cooldownBg}')`;
                currentBgState = 'cooldown';
            }
        }
        */
    }

    function prepareCardDOM(card, type, allowToggle = false) {
        const baseLayer = holoCard.querySelector('.layer-base');
        const overlayLayer = holoCard.querySelector('.layer-png-overlay');
        const titleEl = holoCard.querySelector('.card-title');
        const rarityEl = holoCard.querySelector('.rarity-badge');
        const serialEl = holoCard.querySelector('.card-serial');
        const holoLayer = holoCard.querySelector('.layer-hologram');
        const descEl = document.querySelector('.card-story-description');

        const baseImg = card.baseImageUrl || '';
        const overlayImg = card.overlayImageUrl || '';

        if (baseLayer) baseLayer.style.backgroundImage = `url('${baseImg}')`;
        if (overlayLayer) overlayLayer.style.backgroundImage = `url('${overlayImg}')`;
        if (titleEl) titleEl.textContent = card.title;
        if (serialEl) serialEl.textContent = card.serial;
        if (descEl) descEl.textContent = card.description;

        if (rarityEl) {
            rarityEl.innerHTML = ''; // Clear previous content

            // Rarity Tag
            const rarityTag = document.createElement('span');
            rarityTag.className = `rarity-${card.rarity.toLowerCase()}`;
            rarityTag.textContent = card.rarity;
            rarityEl.appendChild(rarityTag);


            // Toggle hologram layer visibility & preset class
            if (holoLayer) {
                if (type === 'holo') {
                    holoLayer.style.display = 'block';
                    holoLayer.classList.remove('holo1', 'holo2');
                    holoLayer.classList.add(card.holoPreset || 'holo1');
                } else {
                    holoLayer.style.display = 'none';
                    holoLayer.classList.remove('holo1', 'holo2');
                }
            }
        }

        // Configure toggle version button
        const toggleBtn = document.getElementById('toggle-version-btn');
        if (toggleBtn) {
            if (allowToggle) {
                toggleBtn.classList.remove('hidden');
                toggleBtn.textContent = type === 'holo' ? 'Показать REG' : 'Показать HOLO';
            } else {
                toggleBtn.classList.add('hidden');
            }
        }
    }

    function showMainMenu() {
        isSpinning = false; // Reset spinning state when returning to main menu

        cardStage.classList.add('hidden');
        holoCard.classList.remove('reveal');
        document.getElementById('album-stage').classList.add('hidden');
        uiLayer.classList.remove('hidden');

        const mainHeader = document.getElementById('main-header');
        if (mainHeader) mainHeader.classList.remove('hidden');

        if (introVideo) {
            introVideo.loop = true;
            introVideo.currentTime = 0;
            introVideo.classList.remove('playing');
            introVideo.style.display = 'block';
            const playPromise = introVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { });
            }
        }

        // Instantly update button, attempts indicator, and background state
        updateButtonAndCirclesState();
    }

    function showAlbum() {
        cardStage.classList.add('hidden');
        holoCard.classList.remove('reveal');
        uiLayer.classList.add('hidden');

        const mainHeader = document.getElementById('main-header');
        if (mainHeader) mainHeader.classList.add('hidden');

        if (introVideo) {
            introVideo.classList.remove('playing');
            introVideo.style.display = 'none';
            introVideo.pause();
        }

        const albumStage = document.getElementById('album-stage');
        if (albumStage) {
            albumStage.classList.remove('hidden');
            renderAlbum();
        }
    }

    function showCardPreviewFromAlbum(card, type) {
        previewCard = card;
        previewType = type;

        const hasReg = unlockedCards.has(`${card.id}-reg`);
        const hasHolo = unlockedCards.has(`${card.id}-holo`);
        const allowToggle = hasReg && hasHolo;

        prepareCardDOM(card, type, allowToggle);

        document.getElementById('album-stage').classList.add('hidden');
        cardStage.classList.remove('hidden');
        holoCard.classList.add('reveal');

        // Reset gyroscope baseline for calibration relative to current holding angle
        baseBeta = null;
        baseGamma = null;
    }

    function renderAlbum() {
        const albumGrid = document.getElementById('album-grid');
        const albumCounter = document.getElementById('album-counter');
        if (!albumGrid || !albumCounter) return;

        albumGrid.innerHTML = ''; // Clear previous content

        let totalCards = cardsData.length;
        let unlockedCount = 0;

        cardsData.forEach(card => {
            const regKey = `${card.id}-reg`;
            const holoKey = `${card.id}-holo`;
            const hasReg = unlockedCards.has(regKey);
            const hasHolo = unlockedCards.has(holoKey);
            const isUnlocked = hasReg || hasHolo;

            const cell = document.createElement('div');
            const type = hasHolo ? 'holo' : 'reg';
            cell.className = `album-card-cell ${isUnlocked ? 'unlocked' : 'locked'} ${type}`;

            if (isUnlocked) {
                unlockedCount++;

                const baseImg = card.baseImageUrl || '';
                const overlayImg = card.overlayImageUrl || '';

                // Cell Art
                const cellArt = document.createElement('div');
                cellArt.className = 'cell-art';
                cellArt.style.backgroundImage = `url('${baseImg}')`;
                cell.appendChild(cellArt);

                // Hologram layer if Holo version is unlocked and shown
                if (hasHolo) {
                    const holoLayer = document.createElement('div');
                    holoLayer.className = `card-layer layer-hologram ${card.holoPreset || 'holo1'}`;
                    cell.appendChild(holoLayer);
                }

                // Cell Overlay PNG
                const cellOverlay = document.createElement('div');
                cellOverlay.className = 'cell-overlay';
                cellOverlay.style.backgroundImage = `url('${overlayImg}')`;
                cell.appendChild(cellOverlay);

                // Cell Shine/Gloss
                const cellShine = document.createElement('div');
                cellShine.className = 'cell-shine';
                cell.appendChild(cellShine);

                // Tags (Rarity, Type Stack)
                const cellTags = document.createElement('div');
                cellTags.className = 'cell-tags';

                const rarityTag = document.createElement('span');
                rarityTag.className = `cell-tag rarity-${card.rarity.toLowerCase()}`;
                rarityTag.textContent = card.rarity;
                cellTags.appendChild(rarityTag);

                const typeStack = document.createElement('div');
                typeStack.className = 'cell-type-stack';

                if (hasHolo) {
                    const holoTag = document.createElement('span');
                    holoTag.className = 'cell-tag type-holo';
                    holoTag.textContent = 'Holo';
                    typeStack.appendChild(holoTag);
                }

                if (hasReg) {
                    const regTag = document.createElement('span');
                    regTag.className = 'cell-tag type-reg';
                    regTag.textContent = 'Reg';
                    typeStack.appendChild(regTag);
                }

                cellTags.appendChild(typeStack);
                cell.appendChild(cellTags);

                // Info section at bottom
                const cellInfo = document.createElement('div');
                cellInfo.className = 'cell-info';

                const cellTitle = document.createElement('div');
                cellTitle.className = 'cell-title';
                cellTitle.textContent = card.title;
                cellInfo.appendChild(cellTitle);

                const cellSerial = document.createElement('div');
                cellSerial.className = 'cell-serial';
                cellSerial.textContent = card.serial;
                cellInfo.appendChild(cellSerial);

                cell.appendChild(cellInfo);

                // Click to preview in full screen
                cell.addEventListener('click', () => {
                    showCardPreviewFromAlbum(card, hasHolo ? 'holo' : 'reg');
                });
            } else {
                // Locked card layout
                const lockContainer = document.createElement('div');
                lockContainer.className = 'lock-container';

                // Neon lock SVG
                lockContainer.innerHTML = `
                    <svg class="lock-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span class="lock-text">Заблокировано</span>
                `;
                cell.appendChild(lockContainer);

                const lockSerial = document.createElement('div');
                lockSerial.className = 'lock-serial';
                const cleanSerial = card.serial.split('-')[0] || card.serial;
                lockSerial.textContent = `${cleanSerial}`;
                cell.appendChild(lockSerial);
            }

            albumGrid.appendChild(cell);
        });

        albumCounter.textContent = `${unlockedCount} / ${totalCards} Карты`;
    }

    function runLocalPull() {
        spentAttempts++;
        lastSpinTime = Date.now();
        saveState();

        if (typeof CardChance !== 'undefined' && typeof cardsData !== 'undefined' && cardsData.length > 0) {
            const result = CardChance.getRandomCard(cardsData);
            const card = result.card;
            const isHolographic = (typeof CardChance !== 'undefined' && CardChance.isHolographic) ? CardChance.isHolographic() : (Math.random() <= 0.2);
            const cardKey = `${card.id}-${isHolographic ? 'holo' : 'reg'}`;
            unlockedCards.add(cardKey);
            saveCollection();

            pulledCard = card;
            pulledType = isHolographic ? 'holo' : 'reg';

            prepareCardDOM(pulledCard, pulledType, false);
        }

        uiLayer.classList.add('hidden');
        const mainHeader = document.getElementById('main-header');
        if (mainHeader) mainHeader.classList.add('hidden');

        setTimeout(() => {
            isSpinning = true;
            updateButtonAndCirclesState();
            if (introVideo) {
                introVideo.loop = false;
                introVideo.currentTime = 0;
                const playPromise = introVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Playback failed: ", error);
                        introVideo.play();
                    });
                }
            }
        }, 300);
    }

    // 3. Seamless Intro Video Transition & Card Pulling
    pullBtn.addEventListener('click', async () => {
        const maxAttempts = (typeof gameConfig !== 'undefined' && gameConfig.rules) ? gameConfig.rules.maxAttempts : 3;
        const cooldownHours = (typeof gameConfig !== 'undefined' && gameConfig.rules) ? gameConfig.rules.cooldownHours : 2;
        const cooldownDuration = cooldownHours * 3600 * 1000;

        // Временно отключено для безлимитного тестирования
        /*
        // Prevent click if button is disabled or attempts exhausted
        if (pullBtn.disabled || spentAttempts >= maxAttempts) {
            return;
        }

        // Additional time check to be safe
        const now = Date.now();
        if (spentAttempts > 0) {
            const cooldownEnd = lastSpinTime + cooldownDuration;
            const nextMidnight = getNextMskMidnight(lastSpinTime);
            const timeToMidnightFromSpin = nextMidnight - lastSpinTime;

            let effectiveCooldownEnd = cooldownEnd;
            if (timeToMidnightFromSpin < cooldownDuration) {
                effectiveCooldownEnd = nextMidnight;
            }
            if (now < effectiveCooldownEnd) {
                return;
            }
        }
        */

        // Предварительный запуск (priming) видео для обхода ограничений автоплея на мобильных устройствах
        if (introVideo) {
            introVideo.play().then(() => {
                introVideo.pause();
            }).catch(error => {
                console.log("Video priming play/pause:", error);
            });
        }

        // Disable button immediately to prevent double click
        pullBtn.disabled = true;

        try {
            // Attempt to pull card from the server
            const result = await apiRequest('/api/pull-card', 'POST');
            
            // Sync states from server response
            spentAttempts = result.spentAttempts;
            lastSpinTime = result.lastSpinTime;
            unlockedCards = new Set(result.unlockedCards);
            saveCollection();
            saveState();

            pulledCard = result.card;
            pulledType = result.isHolo ? 'holo' : 'reg';

            prepareCardDOM(pulledCard, pulledType, false);

            // 1. Start the UI fade-out transition
            uiLayer.classList.add('hidden');
            const mainHeader = document.getElementById('main-header');
            if (mainHeader) mainHeader.classList.add('hidden');

            // 2. Wait 300ms for fade-out to complete before starting the video
            setTimeout(() => {
                isSpinning = true;
                
                // Update the visual indicators immediately
                updateButtonAndCirclesState();

                // Play video (with user interaction guarantees it starts)
                if (introVideo) {
                    introVideo.loop = false;
                    introVideo.currentTime = 0;
                    const playPromise = introVideo.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Playback failed: ", error);
                            introVideo.play();
                        });
                    }
                }
            }, 300); // matches the CSS transition duration

        } catch (err) {
            console.warn("Failed to pull card from server, falling back to local simulation:", err);
            // Run local pull as robust fallback
            runLocalPull();
        }
    });

    // Fade in video only when it's actually playing to avoid jumps/black frames
    introVideo.addEventListener('playing', () => {
        if (isSpinning) {
            introVideo.classList.add('playing');
        }
    });

    // 4. Video Finished Handler (Transition to 3D Holo-Card)
    introVideo.addEventListener('ended', () => {
        if (!isSpinning) return;

        // Trigger white flash transition
        whiteFlash.classList.add('active');

        // Wait for flash opacity peak, then transition screens
        setTimeout(() => {
            // Hide video
            if (introVideo) {
                introVideo.classList.remove('playing');
                introVideo.style.display = 'none';
            }

            // Show holographic card stage
            cardStage.classList.remove('hidden');

            // Trigger 3D Card sharp reveal animation
            holoCard.classList.add('reveal');

            // Sync preview variables
            previewCard = pulledCard;
            previewType = pulledType;

            // Reset gyroscope baseline for calibration relative to current holding angle
            baseBeta = null;
            baseGamma = null;

            // Fade out white flash
            setTimeout(() => {
                whiteFlash.classList.remove('active');
            }, 100);

        }, 300); // sync with style.css flash transitions
    });

    // 5. 3D Card Tilt & Holographic Mask Parallax
    const layerShine = holoCard.querySelector('.layer-shine');

    let baseBeta = null;
    let baseGamma = null;
    let isInteracting = false; // Flag to pause gyro tilt when user interacts via touch/mouse

    // Make sure the reveal animation doesn't permanently lock transform styles
    holoCard.addEventListener('animationend', (e) => {
        if (e.animationName === 'sharpCardReveal') {
            holoCard.classList.remove('reveal');
            holoCard.style.opacity = '1';
            resetCardMotion(holoCard);
        }
    });

    // Функция обработки движения (вызывается на mousemove или touchmove контейнера)
    function handleCardMotion(e, phoneContainer, cardElement) {
        isInteracting = true; // Mark as interacting to pause gyroscope orientation updates
        const rect = phoneContainer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Поддержка мыши и тач-событий для мобилок
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Координаты относительно ЦЕНТРА карты
        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;

        // 1. Мягкий 3D-наклон всей карты (максимум 15 градусов)
        const maxTilt = 15;
        const rotateX = (-y / (rect.height / 2)) * maxTilt;
        const rotateY = (x / (rect.width / 2)) * maxTilt;
        cardElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // 2. Реалистичный сдвиг голо-эффекта (параллакс фольги)
        const moveFactor = 1.2;
        const mx = 50 + (x / (rect.width / 2)) * (50 * moveFactor);
        const my = 50 + (y / (rect.height / 2)) * (50 * moveFactor);
        const holoLayer = cardElement.querySelector('.layer-hologram');
        if (holoLayer) {
            holoLayer.style.setProperty('--mx', `${mx}%`);
            holoLayer.style.setProperty('--my', `${my}%`);
        }

        // 3. Динамический белый блик (глянец на стекле)
        const shineX = ((clientX - rect.left) / rect.width) * 100;
        const shineY = ((clientY - rect.top) / rect.height) * 100;
        const layerShine = cardElement.querySelector('.layer-shine');
        if (layerShine) {
            layerShine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 60%)`;
        }
    }

    // Функция сброса (вызывается на mouseleave или touchend)
    function resetCardMotion(cardElement) {
        isInteracting = false; // Resume gyroscope updates
        cardElement.style.transform = 'rotateX(0deg) rotateY(0deg)';

        const holoLayer = cardElement.querySelector('.layer-hologram');
        if (holoLayer) {
            holoLayer.style.setProperty('--mx', '50%');
            holoLayer.style.setProperty('--my', '50%');
        }

        const layerShine = cardElement.querySelector('.layer-shine');
        if (layerShine) {
            layerShine.style.background = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 60%)`;
        }
    }

    // Gyroscope Device Orientation handling
    function handleOrientation(event) {
        // Only apply if cardStage is visible and user is not actively interacting with finger/mouse
        if (!cardStage || cardStage.classList.contains('hidden')) {
            return;
        }
        if (isInteracting) return;

        let beta = event.beta;   // -180 to 180 (tilt front/back)
        let gamma = event.gamma; // -90 to 90 (tilt left/right)

        if (beta === null || gamma === null) return;

        // Initialize baseline holding position
        if (baseBeta === null) {
            baseBeta = beta;
            baseGamma = gamma;
        }

        // Calculate deviation from baseline angle
        let deltaBeta = beta - baseBeta;
        let deltaGamma = gamma - baseGamma;

        // Clamp device tilt deviation to max 20 degrees
        const maxDeviceTilt = 20;
        deltaBeta = Math.max(-maxDeviceTilt, Math.min(maxDeviceTilt, deltaBeta));
        deltaGamma = Math.max(-maxDeviceTilt, Math.min(maxDeviceTilt, deltaGamma));

        // Map device deviation to max 15 degrees card tilt
        const maxCardTilt = 15;
        // Pitch (beta) controls rotateX, roll (gamma) controls rotateY
        const rotateX = -(deltaBeta / maxDeviceTilt) * maxCardTilt; 
        const rotateY = (deltaGamma / maxDeviceTilt) * maxCardTilt;

        if (holoCard) {
            holoCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Hologram parallax coordinates
            const moveFactor = 1.2;
            const mx = 50 + (deltaGamma / maxDeviceTilt) * (50 * moveFactor);
            const my = 50 + (deltaBeta / maxDeviceTilt) * (50 * moveFactor);
            const holoLayer = holoCard.querySelector('.layer-hologram');
            if (holoLayer) {
                holoLayer.style.setProperty('--mx', `${mx}%`);
                holoLayer.style.setProperty('--my', `${my}%`);
            }

            // Glass glare/shine gradient
            const shineX = 50 + (deltaGamma / maxDeviceTilt) * 50;
            const shineY = 50 + (deltaBeta / maxDeviceTilt) * 50;
            const layerShine = holoCard.querySelector('.layer-shine');
            if (layerShine) {
                layerShine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 60%)`;
            }
        }
    }

    // Permission request for iOS 13+ and event listener registration
    function requestOrientationPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.removeEventListener('deviceorientation', handleOrientation);
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                })
                .catch(console.error);
        } else {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.addEventListener('deviceorientation', handleOrientation);
        }
    }

    // Register orientation event listeners upon first user interaction (required by iOS browsers)
    document.addEventListener('click', requestOrientationPermission, { once: true });
    document.addEventListener('touchstart', requestOrientationPermission, { once: true });

    // Touch Event Listeners (Mobile Screens)
    cardStage.addEventListener('touchstart', (e) => {
        handleCardMotion(e, holoCard.parentElement, holoCard);
    }, { passive: true });

    cardStage.addEventListener('touchmove', (e) => {
        handleCardMotion(e, holoCard.parentElement, holoCard);
    }, { passive: true });

    cardStage.addEventListener('touchend', () => {
        resetCardMotion(holoCard);
    });

    // Mouse Event Listeners (Desktop Testing & Simulation)
    cardStage.addEventListener('mousemove', (e) => {
        handleCardMotion(e, holoCard.parentElement, holoCard);
    });

    cardStage.addEventListener('mouseleave', () => {
        resetCardMotion(holoCard);
    });

    // Return to album screen when "В альбом" is clicked
    const albumBtn = document.querySelector('.album-btn');
    if (albumBtn) {
        albumBtn.addEventListener('click', () => {
            showAlbum();
        });
    }

    // Toggle card version (REG / HOLO)
    const toggleVersionBtn = document.getElementById('toggle-version-btn');
    if (toggleVersionBtn) {
        toggleVersionBtn.addEventListener('click', () => {
            if (previewCard) {
                const nextType = previewType === 'holo' ? 'reg' : 'holo';
                previewType = nextType;
                prepareCardDOM(previewCard, nextType, true);
            }
        });
    }

    // Return to main menu from Album
    const toMainBtn = document.getElementById('to-main-btn');
    if (toMainBtn) {
        toMainBtn.addEventListener('click', () => {
            showMainMenu();
        });
    }

    // Open album from main header
    const mainAlbumBtn = document.getElementById('main-album-btn');
    if (mainAlbumBtn) {
        mainAlbumBtn.addEventListener('click', () => {
            showAlbum();
        });
    }

    // Start interval to update button timer and check daily reset
    setInterval(updateButtonAndCirclesState, 1000);
    // Initial update on page load
    updateButtonAndCirclesState();
    // Load fresh state from server in background
    loadUserState();
});
