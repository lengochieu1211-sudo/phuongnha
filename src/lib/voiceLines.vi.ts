/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const VOICE_LINES = {
  // Chào hỏi & Khởi động
  welcome: [
    'Xin chào bạn nhỏ! Mình là Bara. Hôm nay chúng mình cùng vận động và phiêu lưu nhé!',
    'Chào mừng bạn đến với vương quốc kỳ diệu! Cùng Bara bắt đầu thôi nào!',
    'Bara rất vui được gặp bạn! Hôm nay chúng mình sẽ có thật nhiều niềm vui!',
  ],

  // Camera & Calibration
  camera: {
    standBefore: 'Bạn hãy đứng trước camera và lùi lại một chút để mình nhìn thấy toàn thân nhé!',
    tooNear: 'Bạn ơi, lùi ra sau một chút nha!',
    tooFar: 'Tiến lại gần mình một chút nhé!',
    noLegs: 'Mình chưa nhìn thấy đôi chân của bạn. Bạn lùi ra sau một chút nhé!',
    notCentered: 'Bạn đứng vào giữa màn hình nào!',
    detectedOk: 'Tuyệt vời! Mình đã nhìn thấy bạn rất rõ rồi!',
    countdown3: 'Ba...',
    countdown2: 'Hai...',
    countdown1: 'Một...',
    start: 'Bắt đầu phiêu lưu!',
  },

  // Hướng dẫn động tác
  gestures: {
    standing: 'Đứng thẳng người và sẵn sàng nhé!',
    leftArmUp: 'Giơ tay trái lên nào!',
    rightArmUp: 'Bây giờ là tay phải nha!',
    bothArmsUp: 'Hai tay lên cao thật đẹp!',
    handsSpread: 'Dang hai tay thật rộng như cánh chim nào!',
    jump: 'Chuẩn bị... Nhảy!',
    duck: 'Cúi thấp người xuống nào!',
    tiltLeft: 'Nghiêng người sang bên trái nhé!',
    tiltRight: 'Sang bên phải nào!',
    clap: 'Vỗ tay thật to nào!',
    wave: 'Vẫy tay chào bạn bè nào!',
    rainbowSkill: 'Tuyệt quá! Cầu vồng lấp lánh đã xuất hiện!',
  },

  // Lời khen ngẫu nhiên
  praise: [
    'Tuyệt vời quá!',
    'Giỏi quá bạn ơi!',
    'Chính xác luôn!',
    'Hay lắm!',
    'Đúng rồi nè!',
    'Xuất sắc!',
    'Bạn làm tốt lắm!',
    'Wow, bạn dẻo dai quá!',
    'Tiếp tục phát huy nhé!',
    'Quá đỉnh luôn!',
  ],

  // Động viên khi chưa chuẩn
  encouragement: [
    'Gần đúng rồi, bạn thử lại một lần nữa nhé!',
    'Một lần nữa nào, bạn làm được mà!',
    'Giơ tay cao hơn một chút nữa nhé!',
    'Cố lên nào, bạn sắp làm được rồi!',
  ],

  // An toàn khi vận động
  safety: {
    warmup: 'Nhớ đứng ở chỗ rộng và không có đồ vật xung quanh nhé!',
  },

  // Fruit Slash
  fruitslash: {
    ready: 'Chuẩn bị hai tay nào!',
    start: 'Trái cây tới rồi! Chém trái cây nhé!',
    slashPrompt: 'Chém nào!',
    double: 'Tuyệt vời! Chém trúng hai quả!',
    triple: 'Wow! Ba quả cùng lúc!',
    combo5: 'Chuỗi chém siêu đỉnh x5!',
    rainbowSkill: 'Cầu vồng xuất hiện rồi! Quét sạch trái cây!',
    inkCloud: 'Ối! Mây đen rồi! Cẩn thận nhé!',
    finish: 'Giỏi quá! Bạn chém được rất nhiều trái cây!',
  },

  // Gà Tinh Nghịch (Chicken Blaster)
  chickenblaster: {
    start: 'Đưa tay ngắm vào những chú gà tinh nghịch nhé! Bong bóng sẽ tự bắn!',
    lockTarget: 'Đúng rồi!',
    goldenChicken: 'Gà vàng kìa! Nhanh lên!',
    hatChicken: 'Bạn gà đội mũ cần hai bong bóng nè!',
    dodgeEgg: 'Né nào!',
    highCombo: 'Giỏi quá!',
    giantBoss: 'Oa! Gà khổng lồ tinh nghịch kìa! Bắn bong bóng thật khéo nhé!',
    finish: 'Tuyệt lắm! Bạn đã đưa rất nhiều bạn gà về chuồng!',
  },

  // Zombie Kẹo Ngọt (Sweet Zoombie / Quái Vật Ngủ Quên)
  sweetzombie: {
    start: 'Các bạn quái vật bị buồn ngủ rồi! Dùng ánh sáng và kẹo phép thuật giúp các bạn ấy tỉnh lại nhé!',
    monsterApproaching: 'Quái vật đang tới!',
    rainbowBlast: 'Dùng phép màu cầu vồng nào!',
    monsterWoke: 'Giỏi lắm! Bạn ấy tỉnh lại rồi!',
    duckCloud: 'Mây buồn ngủ bay tới, cúi thấp người xuống nào!',
    jumpPuddle: 'Nhảy qua vũng kẹo trơn nào!',
    bossAlert: 'Vua Quái Vật Buồn Ngủ xuất hiện rồi! Hãy làm đúng các động tác để đánh thức bạn ấy nhé!',
    bossWoke: 'Bạn ấy tỉnh rồi! Tuyệt quá! Cùng nhau ăn bánh kem thôi!',
    finish: 'Xuất sắc! Tất cả quái vật đã vui vẻ tỉnh lại rồi!',
  },

  // Star Catcher
  starcatcher: {
    start: 'Dùng đôi tay khéo léo để bắt thật nhiều ngôi sao lấp lánh nhé!',
    rainbowStar: 'Oa, ngôi sao cầu vồng kìa! Bắt lấy mau!',
    diamond: 'Kim cương quý giá xuất hiện rồi, bắt lấy nào!',
    giftBox: 'Một hộp quà bí mật! Tuyệt quá!',
    combo5: 'Chuỗi năm lần liên tiếp rồi! Giỏi quá!',
    combo10: 'Wow! Mười lần liên tiếp hoàn hảo!',
    finish: 'Hoàn thành rồi! Bạn bắt được thật nhiều sao!',
  },

  // Adventure
  adventure: {
    startWorld1: 'Cùng Bara khám phá Khu Rừng Kỳ Diệu nhé!',
    startWorld2: 'Chào mừng bạn đến với Thành Phố Kẹo Ngọt thơm lừng!',
    startWorld3: 'Cùng lặn xuống Đại Dương Xanh Thẳm ngắm san hô nào!',
    startWorld4: 'Chúng mình đang bay lên Lâu Đài Trên Mây bồng bềnh!',
    startWorld5: 'Khám phá Vũ Trụ bao la cùng các vì sao!',
    startWorld6: 'Xứ Sở Kỳ Lân lấp lánh cầu vồng kì diệu!',
    bossAlert: 'Mây Mưa Khổng Lồ xuất hiện! Hãy giơ hai tay tạo cầu vồng dọn sạch mây đen nhé!',
    complete: 'Tuyệt vời! Chúng mình đã vượt qua màn chơi xuất sắc!',
  },

  // Pose Mimic
  mimic: {
    start: 'Hãy làm tư thế thật giống mình trên màn hình nhé!',
    hold: 'Giữ nguyên tư thế trong ba giây nào...',
    perfectPose: 'Tư thế chuẩn không cần chỉnh luôn!',
  },

  // Dance
  dance: {
    start: 'Cùng hòa vào điệu nhạc và nhảy múa cùng Bara nào!',
    onBeat: 'Đúng nhịp điệu rồi, nhảy đẹp lắm!',
    finish: 'Vũ điệu hoàn thành thật xuất sắc!',
  },

  // Pet Care
  petcare: {
    pet: 'Bạn ấy thích được vuốt ve lắm đó!',
    feed: 'Măm măm, món ăn ngon tuyệt!',
    bath: 'Xà phòng thơm ngát, sạch sẽ mát mẻ rồi!',
    brush: 'Bộ lông mượt mà lấp lánh rồi nè!',
    levelUp: 'Chúc mừng! Bạn thú cưng đã lên cấp mới!',
  },

  // Workout Mode
  workout: {
    start5min: 'Chào mừng bạn đến với buổi vận động 5 phút vui khỏe mỗi ngày!',
    start10min: 'Cùng thử thách với bài tập năng động 10 phút tràn đầy năng lượng nhé!',
    halfway: 'Bạn đang làm rất tốt, cố gắng lên nào!',
    restBreak: 'Nghỉ giải lao một chút uống nước nhé!',
    finish: 'Hoàn thành xuất sắc bài tập hôm nay! Bạn thật là tuyệt vời!',
  },

  // Parent Play
  parentPlay: {
    start: 'Trò chơi tiếp sức gia đình! Bố mẹ và bé cùng phối hợp nhé!',
    childTurn: 'Lượt của bé, bé chuẩn bị làm động tác nhé!',
    parentTurn: 'Bây giờ tới lượt bố hoặc mẹ làm động tác nè!',
    familyWin: 'Gia đình mình phối hợp thật là ăn ý và tuyệt vời!',
  },

  // Cờ Cá Ngựa - Đường Đua Kỳ Diệu
  ludo: {
    start: 'Chào mừng các bạn đến với Cờ Cá Ngựa - Đường Đua Kỳ Diệu! Cùng tung xúc xắc và đua nào!',
    turn: (name: string) => `Đến lượt của ${name} rồi nha!`,
    rollResult: (name: string, val: number) => {
      const numWords = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu'];
      return `${name} tung được ${numWords[val - 1]} điểm!`;
    },
    spawnReady: 'Bạn có thể đưa một quân ra khỏi chuồng nè!',
    selectPiece: 'Hãy chạm vào quân bạn muốn di chuyển nhé!',
    moveSteps: (name: string, steps: number) => `${name} tiến lên ${steps} bước!`,
    rollSixBonus: 'Tung được sáu điểm! Bạn được tung thêm một lần nữa nè!',
    capturePop: (victim: string) => `Ối! Bạn ${victim} bay về chuồng rồi! Cố lên nhé!`,
    reachHome: (name: string) => `Tuyệt vời! Một quân của ${name} đã về đích an toàn!`,
    rainbowJump: 'Ồ! Đi trúng ô Cầu Vồng, tiến thêm hai bước!',
    starBonus: 'Bạn nhận được một ngôi sao may mắn lấp lánh!',
    winnerFirst: (name: string) => `Chúc mừng ${name} đã xuất sắc về đích đầu tiên!`,
    allFinish: 'Trận đấu hoàn thành rồi! Cả nhóm chơi rất tuyệt vời!',
  },

  // BARA SPEED RACING - ĐƯỜNG ĐUA KỲ DIỆU
  racing: {
    garageWelcome: 'Chào mừng bạn đến với Gara Bara Speed Racing! Hãy chọn chiếc xe yêu thích nhé!',
    holdSteering: 'Đặt hai tay ra phía trước như đang cầm vô lăng nhé!',
    calibLeft: 'Nghiêng hai tay sang trái nào!',
    calibRight: 'Bây giờ nghiêng sang phải nha!',
    calibSuccess: 'Tuyệt rồi! Vô lăng đã sẵn sàng! Chúng mình cùng đua nhé!',
    countdown3: 'Ba...',
    countdown2: 'Hai...',
    countdown1: 'Một...',
    go: 'Xuất phát!',
    turnLeft: 'Cua trái phía trước! Ôm cua nào!',
    turnRight: 'Chuẩn bị rẽ phải!',
    driftGood: 'Drift đẹp lắm!',
    driftPerfect: 'Drift hoàn hảo tuyệt đỉnh!',
    nitroReady: 'Nitro đã sẵn sàng!',
    nitroBoost: 'Tăng tốc thần tốc nào!',
    checkpoint: 'Đã qua Checkpoint! Cộng thêm thời gian!',
    finalLap: 'Vòng cuối cùng rồi! Cố lên bạn ơi!',
    itemShield: 'Bảo vệ phép thuật đã kích hoạt!',
    itemStar: 'Ngôi sao may mắn cộng điểm tốc độ!',
    firstPlace: 'Tuyệt vời! Bạn đã xuất sắc về nhất cuộc đua!',
    finishGood: 'Bạn lái xe rất cừ! Lần sau chúng mình sẽ về nhất nhé!',
  },
};
