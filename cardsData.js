const cardsData = [
  {
    id: 1,
    title: "BUBBLE WARRIOR",
    rarity: "EPIC",
    serial: "#085-OZON",
    baseImageUrl: "https://i.postimg.cc/SxdcFNFL/card1.jpg",
    overlayImageUrl: "https://i.postimg.cc/Cx7bTLTr/card-O1.png",
    holoPreset: "holo2",
    description: "Защитник чистоты и повелитель пены. Его мыльные пузыри способны отразить любую атаку, а резиновые тапочки даруют иммунитет к скользкому полу."
  },
  {
    id: 2,
    title: "ВОВЧИК МАГНАТ",
    rarity: "LEGENDARY",
    serial: "#001-BOSS",
    baseImageUrl: "https://i.postimg.cc/Bnp29Q9p/card2.jpg",
    overlayImageUrl: "https://i.postimg.cc/MGGVW2qy/card-O2.png",
    holoPreset: "holo2",
    description: "Владелец заводов, газет, пароходов и целого пакета сухариков. Раздает автографы на чеках из супермаркета и инвестирует исключительно в кефир."
  },
  {
    id: 3,
    title: "ДИМОН КРИПТАН",
    rarity: "RARE",
    serial: "#021-CRYPTO",
    baseImageUrl: "https://i.postimg.cc/kgsW3X3c/card3.jpg",
    overlayImageUrl: "https://i.postimg.cc/CxkbvHm0/card-O3.png",
    holoPreset: "holo1",
    description: "Купил биткоин на самом пике, но не унывает. Верит в силу блокчейна, силу мемов и в то, что его инвестиции в хомяка обязательно окупятся."
  },
  {
    id: 4,
    title: "НЕЙРОСЕТЬ НЕ ВЫВОЗИТ",
    rarity: "EPIC",
    serial: "#044-FAIL",
    baseImageUrl: "https://i.postimg.cc/FHp05s5V/card4.jpg",
    overlayImageUrl: "https://i.postimg.cc/s227VdsY/card-O4.png",
    holoPreset: "holo2",
    description: "Когда серверам становится слишком жарко, а промпты пользователя заходят слишком далеко. Этот парень держится из последних сил."
  },
  {
    id: 5,
    title: "ПОСЛЕДНИЙ КУСОК",
    rarity: "COMMON",
    serial: "#102-PIZZA",
    baseImageUrl: "https://i.postimg.cc/htsVWPW0/card5.jpg",
    overlayImageUrl: "https://i.postimg.cc/k55Kn3qF/card-O5.png",
    holoPreset: "holo1",
    description: "Тот самый moment за секунду до катаклизма. Вовчик и Димон сошлись в эпической схватке за последний кусок пепперони. Сыр тянется, нервы на пределе."
  }
];

// Экспортируем для использования в основном скрипте app.js
if (typeof module !== 'undefined') { module.exports = cardsData; }
