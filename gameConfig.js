/**
 * Конфигурационный файл игры "Два Ствола"
 * 
 * Здесь вы можете легко добавлять новые сцены (комнаты с видеороликами),
 * менять фоновые изображения для разных состояний, а также настраивать
 * правила игры (лимиты попыток, кулдаун, шанс выпадения карт).
 */

const gameConfig = {
  // Настройки сцен (комнат) и соответствующих видеороликов при старте игры.
  // При старте игры или сбросе лимитов будет выбрана случайная сцена из этого списка.
  // Чтобы добавить новую сцену, просто скопируйте блок { id: ..., roomBg: "...", videoUrl: "..." } и добавьте его в массив.
  roomScenes: [
    {
      id: 1,
      roomBg: "https://i.postimg.cc/jdVtrd2b/room-bg1.jpg",
      videoUrl: "videos/intro_video1.mp4"
    },
    {
      id: 2,
      roomBg: "https://i.postimg.cc/Gh0d1htd/room-bg2.jpg",
      videoUrl: "videos/intro_video2.mp4"
    },
    {
      id: 3,
      roomBg: "https://i.postimg.cc/YqcMwq0t/room-bg3.jpg",
      videoUrl: "videos/intro_video3.mp4"
    }
  ],

  // Фоновые изображения для различных состояний интерфейса
  backgrounds: {
    cooldown: "https://i.postimg.cc/TY8fXY1R/time-bg1.jpg",     // Фон при кулдауне (ожидание следующей попытки)
    limitReached: "https://i.postimg.cc/hPFcqPvD/time-bg2.jpg"  // Фон при исчерпании суточного лимита
  },

  // Игровые правила и лимиты
  rules: {
    maxAttempts: 3,       // Максимальное количество попыток в день
    cooldownHours: 2      // Время кулдауна между попытками (в часах)
  }
};

// Экспортируем для поддержки модульного тестирования или Node.js сред при необходимости
if (typeof module !== 'undefined') {
  module.exports = gameConfig;
}
