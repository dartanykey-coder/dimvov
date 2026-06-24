/**
 * Конфигурация шансов и логика случайного выбора для игры "Два Ствола"
 * 
 * В этом файле собрано все, что касается вероятностей:
 * 1. Шансы выпадения редкостей карт.
 * 2. Шанс выпадения голографической (Holo) версии.
 * 3. Шансы (веса) выпадения стартовых сцен (комнат).
 */

// 1. Конфигурация вероятностей (шансов)
const GameChances = {
    // Вероятности для редкостей карт (сумма может быть любой, расчет идет по весам)
    rarities: {
        LEGENDARY: 0.06, // 6%
        EPIC: 0.14,      // 14%
        RARE: 0.30,      // 30%
        COMMON: 0.50     // 50%
    },

    // Вероятность получить голографическую (Holo) версию карты вместо обычной (Reg)
    holoChance: 0.20,    // 20% (0.20)

    // Веса для выбора сцен (комнат). Чем больше вес, тем выше вероятность выпадения.
    // Если сцена не перечислена здесь, её вес по умолчанию считается равным 1.
    sceneWeights: {
        scene_1: 1.0,    // Вес первой комнаты
        scene_2: 1.0,    // Вес второй комнаты
        scene_3: 1.0     // Вес третьей комнаты
    }
};

// 2. Логика расчета вероятностей
const CardChance = {
    // Определение редкости выпавшей карты
    getRarity() {
        const rand = Math.random();
        const rates = GameChances.rarities;
        
        // Расчет диапазонов на основе установленных шансов:
        // LEGENDARY: 0.00 - 0.06
        // EPIC: 0.06 - 0.20 (0.06 + 0.14)
        // RARE: 0.20 - 0.50 (0.20 + 0.30)
        // COMMON: 0.50 - 1.00 (0.50 + 0.50)
        if (rand < rates.LEGENDARY) {
            return 'LEGENDARY';
        } else if (rand < (rates.LEGENDARY + rates.EPIC)) {
            return 'EPIC';
        } else if (rand < (rates.LEGENDARY + rates.EPIC + rates.RARE)) {
            return 'RARE';
        } else {
            return 'COMMON';
        }
    },

    // Определение, будет ли карта голографической
    isHolographic() {
        const chance = (typeof GameChances !== 'undefined') ? GameChances.holoChance : 0.20;
        return Math.random() <= chance;
    },

    // Выбор случайной сцены на основе настроенных весов
    getRandomScene(scenes) {
        if (!scenes || scenes.length === 0) return null;
        
        const weights = GameChances.sceneWeights || {};
        
        // Вычисляем общий вес всех доступных сцен
        let totalWeight = 0;
        const weightedScenes = scenes.map(scene => {
            const key = `scene_${scene.id}`;
            // Если для сцены задан вес в GameChances, используем его, иначе вес = 1
            const weight = (weights[key] !== undefined) ? weights[key] : 1.0;
            totalWeight += weight;
            return { scene, weight };
        });

        // Выбираем сцену
        let rand = Math.random() * totalWeight;
        for (const item of weightedScenes) {
            rand -= item.weight;
            if (rand <= 0) {
                return item.scene;
            }
        }
        return scenes[0];
    },

    // Выбор случайной карты с учетом редкостей
    getRandomCard(cards) {
        const selectedRarity = this.getRarity();
        let filteredCards = cards.filter(card => card.rarity === selectedRarity);

        // Предотвращение ошибок: если нет ни одной карты выпавшей редкости, 
        // откатываемся на категорию COMMON
        if (filteredCards.length === 0) {
            filteredCards = cards.filter(card => card.rarity === 'COMMON');
        }
        // Дополнительный сейвгард на случай, если и в COMMON пусто
        if (filteredCards.length === 0) {
            filteredCards = cards;
        }

        const randomIndex = Math.floor(Math.random() * filteredCards.length);
        return {
            card: filteredCards[randomIndex],
            rarity: selectedRarity
        };
    }
};

// Экспортируем для использования в Node.js/Jest, если требуется
if (typeof module !== 'undefined') {
    module.exports = { GameChances, CardChance };
}
