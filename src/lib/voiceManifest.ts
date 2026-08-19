/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VoiceManifestEntry {
  path: string;
  text: string;
  cooldownMs?: number;
}

export const VOICE_MANIFEST: Record<string, Record<string, VoiceManifestEntry>> = {
  common: {
    hello: {
      path: '/audio/voice/vi-female/common_001_xin_chao.mp3',
      text: 'Xin chào Phương Nhã!',
      cooldownMs: 8000,
    },
    welcome: {
      path: '/audio/voice/vi-female/common_002_chao_mung.mp3',
      text: 'Chào mừng Phương Nhã đến với cuộc phiêu lưu kỳ diệu!',
      cooldownMs: 15000,
    },
    ready: {
      path: '/audio/voice/vi-female/common_003_san_sang.mp3',
      text: 'Sẵn sàng chưa nào?',
      cooldownMs: 5000,
    },
    start: {
      path: '/audio/voice/vi-female/common_004_bat_dau.mp3',
      text: 'Bắt đầu nào!',
      cooldownMs: 5000,
    },
    cheer: {
      path: '/audio/voice/vi-female/common_005_co_len.mp3',
      text: 'Cố lên!',
      cooldownMs: 8000,
    },
    good: {
      path: '/audio/voice/vi-female/common_006_gioi_qua.mp3',
      text: 'Giỏi quá!',
      cooldownMs: 8000,
    },
    great: {
      path: '/audio/voice/vi-female/common_007_tuyet_voi.mp3',
      text: 'Tuyệt vời!',
      cooldownMs: 10000,
    },
    excellent: {
      path: '/audio/voice/vi-female/common_008_xuat_sac.mp3',
      text: 'Xuất sắc!',
      cooldownMs: 12000,
    },
    wellDone: {
      path: '/audio/voice/vi-female/common_009_lam_tot_lam.mp3',
      text: 'Làm tốt lắm!',
      cooldownMs: 8000,
    },
    amazing: {
      path: '/audio/voice/vi-female/common_010_qua_gioi.mp3',
      text: 'Bạn giỏi quá!',
      cooldownMs: 8000,
    },
    tryAgain: {
      path: '/audio/voice/vi-female/common_011_thu_lai.mp3',
      text: 'Thử lại nhé!',
      cooldownMs: 5000,
    },
    almost: {
      path: '/audio/voice/vi-female/common_012_gan_duoc_roi.mp3',
      text: 'Gần được rồi!',
      cooldownMs: 5000,
    },
    correct: {
      path: '/audio/voice/vi-female/common_013_dung_roi.mp3',
      text: 'Đúng rồi!',
      cooldownMs: 4000,
    },
    continue: {
      path: '/audio/voice/vi-female/common_014_tiep_tuc.mp3',
      text: 'Tiếp tục nào!',
      cooldownMs: 5000,
    },
    complete: {
      path: '/audio/voice/vi-female/common_015_hoan_thanh.mp3',
      text: 'Hoàn thành!',
      cooldownMs: 10000,
    },
    victory: {
      path: '/audio/voice/vi-female/common_016_chien_thang.mp3',
      text: 'Chiến thắng!',
      cooldownMs: 10000,
    },
    congrats: {
      path: '/audio/voice/vi-female/common_017_chuc_mung.mp3',
      text: 'Chúc mừng Phương Nhã!',
      cooldownMs: 15000,
    },
    combo: {
      path: '/audio/voice/vi-female/common_018_combo.mp3',
      text: 'Combo tuyệt đẹp!',
      cooldownMs: 6000,
    },
    highScore: {
      path: '/audio/voice/vi-female/common_019_diem_cao.mp3',
      text: 'Điểm cao mới!',
      cooldownMs: 15000,
    },
    rest: {
      path: '/audio/voice/vi-female/common_020_nghi_mot_chut.mp3',
      text: 'Nghỉ một chút nhé!',
      cooldownMs: 10000,
    },
    timeUpSoon: {
      path: '/audio/voice/vi-female/common_021_sap_het_gio.mp3',
      text: 'Sắp hết giờ rồi!',
      cooldownMs: 15000,
    },
    tenSeconds: {
      path: '/audio/voice/vi-female/common_022_con_muoi_giay.mp3',
      text: 'Còn mười giây!',
      cooldownMs: 15000,
    },
    countdown: {
      path: '/audio/voice/vi-female/common_023_ba_hai_mot.mp3',
      text: 'Ba, hai, một!',
      cooldownMs: 5000,
    },
    letsGo: {
      path: '/audio/voice/vi-female/common_024_di_thoi.mp3',
      text: 'Đi thôi!',
      cooldownMs: 8000,
    },
    fun: {
      path: '/audio/voice/vi-female/common_025_that_vui.mp3',
      text: 'Vui quá!',
      cooldownMs: 10000,
    },
  },

  camera: {
    turnOn: {
      path: '/audio/voice/vi-female/camera_001_bat_camera.mp3',
      text: 'Bật camera để bắt đầu nhé!',
      cooldownMs: 10000,
    },
    starting: {
      path: '/audio/voice/vi-female/camera_002_dang_khoi_dong.mp3',
      text: 'Camera đang khởi động.',
      cooldownMs: 8000,
    },
    ready: {
      path: '/audio/voice/vi-female/camera_003_san_sang.mp3',
      text: 'Camera đã sẵn sàng!',
      cooldownMs: 8000,
    },
    putHand: {
      path: '/audio/voice/vi-female/camera_004_dua_tay_vao.mp3',
      text: 'Đưa tay vào camera nhé!',
      cooldownMs: 5000,
    },
    sawHand: {
      path: '/audio/voice/vi-female/camera_005_da_thay_tay.mp3',
      text: 'Mình thấy tay rồi!',
      cooldownMs: 5000,
    },
    bothHands: {
      path: '/audio/voice/vi-female/camera_006_hai_tay.mp3',
      text: 'Đưa cả hai tay vào camera nhé!',
      cooldownMs: 8000,
    },
    sawBothHands: {
      path: '/audio/voice/vi-female/camera_007_da_thay_hai_tay.mp3',
      text: 'Tuyệt! Mình đã thấy cả hai tay.',
      cooldownMs: 8000,
    },
    standFurther: {
      path: '/audio/voice/vi-female/camera_008_dung_xa_hon.mp3',
      text: 'Đứng xa camera thêm một chút nhé!',
      cooldownMs: 5000,
    },
    standCloser: {
      path: '/audio/voice/vi-female/camera_009_dung_gan_hon.mp3',
      text: 'Đứng gần camera thêm một chút nhé!',
      cooldownMs: 5000,
    },
    seeFullBody: {
      path: '/audio/voice/vi-female/camera_010_thay_toan_than.mp3',
      text: 'Hãy đứng để camera nhìn thấy toàn thân nhé!',
      cooldownMs: 8000,
    },
    keepStill: {
      path: '/audio/voice/vi-female/camera_011_giu_yen.mp3',
      text: 'Giữ yên một chút nhé!',
      cooldownMs: 6000,
    },
    calibrating: {
      path: '/audio/voice/vi-female/camera_012_can_chinh.mp3',
      text: 'Đang căn chỉnh camera.',
      cooldownMs: 8000,
    },
    calibrationDone: {
      path: '/audio/voice/vi-female/camera_013_can_chinh_xong.mp3',
      text: 'Căn chỉnh hoàn tất!',
      cooldownMs: 10000,
    },
    lostHand: {
      path: '/audio/voice/vi-female/camera_014_mat_tay.mp3',
      text: 'Mình chưa nhìn thấy tay của bạn.',
      cooldownMs: 5000,
    },
    lostPerson: {
      path: '/audio/voice/vi-female/camera_015_mat_nguoi.mp3',
      text: 'Mình chưa nhìn thấy bạn rõ lắm.',
      cooldownMs: 5000,
    },
    turnBack: {
      path: '/audio/voice/vi-female/camera_016_quay_lai.mp3',
      text: 'Quay lại trước camera nhé!',
      cooldownMs: 8000,
    },
    error: {
      path: '/audio/voice/vi-female/camera_017_camera_loi.mp3',
      text: 'Camera chưa hoạt động. Hãy thử lại nhé!',
      cooldownMs: 10000,
    },
    switchTouch: {
      path: '/audio/voice/vi-female/camera_018_chuyen_cam_ung.mp3',
      text: 'Không nhận được tay chính xác. Hãy chuyển sang điều khiển cảm ứng nhé!',
      cooldownMs: 15000,
    },
  },

  chicken: {
    start: {
      path: '/audio/voice/vi-female/chicken_001_start.mp3',
      text: 'Đưa tay ngắm vào những chú gà nhé! Bong bóng sẽ tự bắn!',
      cooldownMs: 15000,
    },
    moveHand: {
      path: '/audio/voice/vi-female/chicken_002_move_hand.mp3',
      text: 'Di chuyển tay để ngắm nhé!',
      cooldownMs: 8000,
    },
    autoFire: {
      path: '/audio/voice/vi-female/chicken_003_auto_fire.mp3',
      text: 'Bong bóng sẽ tự bắn!',
      cooldownMs: 10000,
    },
    hit: {
      path: '/audio/voice/vi-female/chicken_004_hit.mp3',
      text: 'Trúng rồi!',
      cooldownMs: 4000,
    },
    greatHit: {
      path: '/audio/voice/vi-female/chicken_005_great_hit.mp3',
      text: 'Bắn hay lắm!',
      cooldownMs: 6000,
    },
    combo: {
      path: '/audio/voice/vi-female/chicken_006_combo.mp3',
      text: 'Combo rồi!',
      cooldownMs: 6000,
    },
    gold: {
      path: '/audio/voice/vi-female/chicken_007_gold.mp3',
      text: 'Gà vàng kìa!',
      cooldownMs: 10000,
    },
    fast: {
      path: '/audio/voice/vi-female/chicken_008_fast.mp3',
      text: 'Chú gà này chạy nhanh lắm!',
      cooldownMs: 8000,
    },
    hat: {
      path: '/audio/voice/vi-female/chicken_009_hat.mp3',
      text: 'Chú gà đội mũ cần thêm một phát nữa!',
      cooldownMs: 8000,
    },
    boss: {
      path: '/audio/voice/vi-female/chicken_010_boss.mp3',
      text: 'Boss xuất hiện! Ngắm thật chuẩn nhé!',
      cooldownMs: 15000,
    },
    bossHalf: {
      path: '/audio/voice/vi-female/chicken_011_boss_half.mp3',
      text: 'Boss sắp hết sức rồi!',
      cooldownMs: 10000,
    },
    egg: {
      path: '/audio/voice/vi-female/chicken_012_egg.mp3',
      text: 'Cẩn thận quả trứng!',
      cooldownMs: 2000,
    },
    dodgeLeft: {
      path: '/audio/voice/vi-female/chicken_013_dodge_left.mp3',
      text: 'Né sang trái!',
      cooldownMs: 4000,
    },
    dodgeRight: {
      path: '/audio/voice/vi-female/chicken_014_dodge_right.mp3',
      text: 'Né sang phải!',
      cooldownMs: 4000,
    },
    superFire: {
      path: '/audio/voice/vi-female/chicken_015_super_fire.mp3',
      text: 'Bắn siêu tốc!',
      cooldownMs: 10000,
    },
    handLost: {
      path: '/audio/voice/vi-female/chicken_016_hand_lost.mp3',
      text: 'Đưa tay lại vào camera để tiếp tục bắn nhé!',
      cooldownMs: 5000,
    },
    finish: {
      path: '/audio/voice/vi-female/chicken_017_finish.mp3',
      text: 'Tuyệt vời! Bạn đã bắt được rất nhiều gà!',
      cooldownMs: 15000,
    },
    bossWin: {
      path: '/audio/voice/vi-female/chicken_018_boss_win.mp3',
      text: 'Hạ được Boss rồi! Xuất sắc!',
      cooldownMs: 15000,
    },
  },

  fruit: {
    start: {
      path: '/audio/voice/vi-female/fruit_001_start.mp3',
      text: 'Dùng tay chém những trái cây nhé!',
      cooldownMs: 15000,
    },
    leftHand: {
      path: '/audio/voice/vi-female/fruit_002_left_hand.mp3',
      text: 'Dùng tay trái nào!',
      cooldownMs: 8000,
    },
    rightHand: {
      path: '/audio/voice/vi-female/fruit_003_right_hand.mp3',
      text: 'Dùng tay phải nào!',
      cooldownMs: 8000,
    },
    twoHands: {
      path: '/audio/voice/vi-female/fruit_004_two_hands.mp3',
      text: 'Dùng cả hai tay nào!',
      cooldownMs: 10000,
    },
    slice: {
      path: '/audio/voice/vi-female/fruit_005_slice.mp3',
      text: 'Chém đẹp lắm!',
      cooldownMs: 4000,
    },
    combo: {
      path: '/audio/voice/vi-female/fruit_006_combo.mp3',
      text: 'Combo tuyệt đẹp!',
      cooldownMs: 6000,
    },
    fast: {
      path: '/audio/voice/vi-female/fruit_007_fast.mp3',
      text: 'Nhanh lên nào!',
      cooldownMs: 8000,
    },
    bomb: {
      path: '/audio/voice/vi-female/fruit_008_bomb.mp3',
      text: 'Cẩn thận!',
      cooldownMs: 3000,
    },
    rainbow: {
      path: '/audio/voice/vi-female/fruit_009_rainbow.mp3',
      text: 'Cầu vồng xuất hiện!',
      cooldownMs: 12000,
    },
    bonus: {
      path: '/audio/voice/vi-female/fruit_010_bonus.mp3',
      text: 'Nhận phần thưởng nào!',
      cooldownMs: 10000,
    },
    finish: {
      path: '/audio/voice/vi-female/fruit_011_finish.mp3',
      text: 'Chém trái cây tuyệt lắm!',
      cooldownMs: 15000,
    },
    newRecord: {
      path: '/audio/voice/vi-female/fruit_012_new_record.mp3',
      text: 'Kỷ lục mới!',
      cooldownMs: 15000,
    },
  },

  zombie: {
    start: {
      path: '/audio/voice/vi-female/zombie_001_start.mp3',
      text: 'Hãy giúp các bạn ấy tỉnh lại nhé!',
      cooldownMs: 15000,
    },
    aim: {
      path: '/audio/voice/vi-female/zombie_002_aim.mp3',
      text: 'Ngắm vào mục tiêu nào!',
      cooldownMs: 8000,
    },
    pose: {
      path: '/audio/voice/vi-female/zombie_003_pose.mp3',
      text: 'Làm đúng động tác nhé!',
      cooldownMs: 8000,
    },
    correct: {
      path: '/audio/voice/vi-female/zombie_004_correct.mp3',
      text: 'Đúng rồi!',
      cooldownMs: 4000,
    },
    wrong: {
      path: '/audio/voice/vi-female/zombie_005_wrong.mp3',
      text: 'Thử động tác khác nhé!',
      cooldownMs: 5000,
    },
    dodge: {
      path: '/audio/voice/vi-female/zombie_006_dodge.mp3',
      text: 'Mau né nào!',
      cooldownMs: 4000,
    },
    duck: {
      path: '/audio/voice/vi-female/zombie_007_duck.mp3',
      text: 'Cúi xuống!',
      cooldownMs: 4000,
    },
    jump: {
      path: '/audio/voice/vi-female/zombie_008_jump.mp3',
      text: 'Nhảy lên!',
      cooldownMs: 4000,
    },
    boss: {
      path: '/audio/voice/vi-female/zombie_009_boss.mp3',
      text: 'Boss xuất hiện!',
      cooldownMs: 15000,
    },
    combo: {
      path: '/audio/voice/vi-female/zombie_010_combo.mp3',
      text: 'Combo giải cứu!',
      cooldownMs: 8000,
    },
    finish: {
      path: '/audio/voice/vi-female/zombie_011_finish.mp3',
      text: 'Bạn đã giải cứu tất cả rồi!',
      cooldownMs: 15000,
    },
    bossWin: {
      path: '/audio/voice/vi-female/zombie_012_boss_win.mp3',
      text: 'Boss đã tỉnh lại rồi! Giỏi quá!',
      cooldownMs: 15000,
    },
  },

  star: {
    start: {
      path: '/audio/voice/vi-female/star_001_start.mp3',
      text: 'Đưa tay chạm vào những ngôi sao nhé!',
      cooldownMs: 15000,
    },
    catch: {
      path: '/audio/voice/vi-female/star_002_catch.mp3',
      text: 'Bắt được rồi!',
      cooldownMs: 4000,
    },
    left: {
      path: '/audio/voice/vi-female/star_003_left.mp3',
      text: 'Ngôi sao bên trái!',
      cooldownMs: 6000,
    },
    right: {
      path: '/audio/voice/vi-female/star_004_right.mp3',
      text: 'Ngôi sao bên phải!',
      cooldownMs: 6000,
    },
    high: {
      path: '/audio/voice/vi-female/star_005_high.mp3',
      text: 'Ngôi sao ở trên cao!',
      cooldownMs: 6000,
    },
    rainbow: {
      path: '/audio/voice/vi-female/star_006_rainbow.mp3',
      text: 'Ngôi sao cầu vồng kìa!',
      cooldownMs: 10000,
    },
    diamond: {
      path: '/audio/voice/vi-female/star_007_diamond.mp3',
      text: 'Kim cương!',
      cooldownMs: 8000,
    },
    gift: {
      path: '/audio/voice/vi-female/star_008_gift.mp3',
      text: 'Một món quà!',
      cooldownMs: 10000,
    },
    combo: {
      path: '/audio/voice/vi-female/star_009_combo.mp3',
      text: 'Bắt sao liên tục! Tuyệt lắm!',
      cooldownMs: 8000,
    },
    finish: {
      path: '/audio/voice/vi-female/star_010_finish.mp3',
      text: 'Bạn bắt sao giỏi quá!',
      cooldownMs: 15000,
    },
  },

  pose: {
    start: {
      path: '/audio/voice/vi-female/pose_001_start.mp3',
      text: 'Hãy bắt chước tư thế nhé!',
      cooldownMs: 15000,
    },
    watch: {
      path: '/audio/voice/vi-female/pose_002_watch.mp3',
      text: 'Nhìn kỹ tư thế mẫu nhé!',
      cooldownMs: 8000,
    },
    try: {
      path: '/audio/voice/vi-female/pose_003_try.mp3',
      text: 'Bắt đầu tạo dáng nào!',
      cooldownMs: 8000,
    },
    hold: {
      path: '/audio/voice/vi-female/pose_004_hold.mp3',
      text: 'Giữ nguyên nào!',
      cooldownMs: 6000,
    },
    almost: {
      path: '/audio/voice/vi-female/pose_005_almost.mp3',
      text: 'Đúng rồi! Giữ thêm một chút!',
      cooldownMs: 6000,
    },
    adjust: {
      path: '/audio/voice/vi-female/pose_006_adjust.mp3',
      text: 'Chỉnh lại một chút nhé!',
      cooldownMs: 6000,
    },
    leftArm: {
      path: '/audio/voice/vi-female/pose_007_left_arm.mp3',
      text: 'Nâng tay trái lên một chút!',
      cooldownMs: 6000,
    },
    rightArm: {
      path: '/audio/voice/vi-female/pose_008_right_arm.mp3',
      text: 'Nâng tay phải lên một chút!',
      cooldownMs: 6000,
    },
    straight: {
      path: '/audio/voice/vi-female/pose_009_straight.mp3',
      text: 'Đứng thẳng hơn một chút nhé!',
      cooldownMs: 6000,
    },
    perfect: {
      path: '/audio/voice/vi-female/pose_010_perfect.mp3',
      text: 'Tư thế hoàn hảo!',
      cooldownMs: 8000,
    },
    next: {
      path: '/audio/voice/vi-female/pose_011_next.mp3',
      text: 'Tư thế tiếp theo!',
      cooldownMs: 8000,
    },
    finish: {
      path: '/audio/voice/vi-female/pose_012_finish.mp3',
      text: 'Bắt chước rất giỏi!',
      cooldownMs: 15000,
    },
  },

  dance: {
    start: {
      path: '/audio/voice/vi-female/dance_001_start.mp3',
      text: 'Cùng nhảy nào!',
      cooldownMs: 15000,
    },
    left: {
      path: '/audio/voice/vi-female/dance_002_left.mp3',
      text: 'Sang trái!',
      cooldownMs: 4000,
    },
    right: {
      path: '/audio/voice/vi-female/dance_003_right.mp3',
      text: 'Sang phải!',
      cooldownMs: 4000,
    },
    handsUp: {
      path: '/audio/voice/vi-female/dance_004_hands_up.mp3',
      text: 'Hai tay lên cao!',
      cooldownMs: 6000,
    },
    handsOut: {
      path: '/audio/voice/vi-female/dance_005_hands_out.mp3',
      text: 'Dang hai tay ra!',
      cooldownMs: 6000,
    },
    jump: {
      path: '/audio/voice/vi-female/dance_006_jump.mp3',
      text: 'Nhảy nào!',
      cooldownMs: 5000,
    },
    clap: {
      path: '/audio/voice/vi-female/dance_007_clap.mp3',
      text: 'Vỗ tay!',
      cooldownMs: 5000,
    },
    combo: {
      path: '/audio/voice/vi-female/dance_008_combo.mp3',
      text: 'Đúng nhịp rồi!',
      cooldownMs: 8000,
    },
    perfect: {
      path: '/audio/voice/vi-female/dance_009_perfect.mp3',
      text: 'Điệu nhảy hoàn hảo!',
      cooldownMs: 10000,
    },
    finish: {
      path: '/audio/voice/vi-female/dance_010_finish.mp3',
      text: 'Điệu nhảy tuyệt đẹp!',
      cooldownMs: 15000,
    },
  },

  adventure: {
    start: {
      path: '/audio/voice/vi-female/adventure_001_start.mp3',
      text: 'Cuộc phiêu lưu bắt đầu!',
      cooldownMs: 15000,
    },
    run: {
      path: '/audio/voice/vi-female/adventure_002_run.mp3',
      text: 'Chạy thôi!',
      cooldownMs: 8000,
    },
    jump: {
      path: '/audio/voice/vi-female/adventure_003_jump.mp3',
      text: 'Nhảy!',
      cooldownMs: 4000,
    },
    duck: {
      path: '/audio/voice/vi-female/adventure_004_duck.mp3',
      text: 'Cúi xuống!',
      cooldownMs: 4000,
    },
    left: {
      path: '/audio/voice/vi-female/adventure_005_left.mp3',
      text: 'Sang trái!',
      cooldownMs: 5000,
    },
    right: {
      path: '/audio/voice/vi-female/adventure_006_right.mp3',
      text: 'Sang phải!',
      cooldownMs: 5000,
    },
    star: {
      path: '/audio/voice/vi-female/adventure_007_star.mp3',
      text: 'Ngôi sao kìa!',
      cooldownMs: 6000,
    },
    diamond: {
      path: '/audio/voice/vi-female/adventure_008_diamond.mp3',
      text: 'Kim cương phía trước!',
      cooldownMs: 8000,
    },
    danger: {
      path: '/audio/voice/vi-female/adventure_009_danger.mp3',
      text: 'Cẩn thận!',
      cooldownMs: 4000,
    },
    boss: {
      path: '/audio/voice/vi-female/adventure_010_boss.mp3',
      text: 'Boss đang tới!',
      cooldownMs: 15000,
    },
    bossAttack: {
      path: '/audio/voice/vi-female/adventure_011_boss_attack.mp3',
      text: 'Mau né đòn của Boss!',
      cooldownMs: 6000,
    },
    worldComplete: {
      path: '/audio/voice/vi-female/adventure_012_world_complete.mp3',
      text: 'Hoàn thành thế giới!',
      cooldownMs: 15000,
    },
    unlock: {
      path: '/audio/voice/vi-female/adventure_013_unlock.mp3',
      text: 'Một thế giới mới đã mở!',
      cooldownMs: 15000,
    },
    finish: {
      path: '/audio/voice/vi-female/adventure_014_finish.mp3',
      text: 'Bạn đã hoàn thành cuộc phiêu lưu!',
      cooldownMs: 15000,
    },
  },

  workout: {
    start: {
      path: '/audio/voice/vi-female/workout_001_start.mp3',
      text: 'Cùng vận động nhé!',
      cooldownMs: 15000,
    },
    warmup: {
      path: '/audio/voice/vi-female/workout_002_warmup.mp3',
      text: 'Khởi động nào!',
      cooldownMs: 15000,
    },
    stretch: {
      path: '/audio/voice/vi-female/workout_003_stretch.mp3',
      text: 'Vươn vai thật nhẹ nhé!',
      cooldownMs: 10000,
    },
    ready: {
      path: '/audio/voice/vi-female/workout_004_ready.mp3',
      text: 'Cơ thể sẵn sàng rồi!',
      cooldownMs: 10000,
    },
    next: {
      path: '/audio/voice/vi-female/workout_005_next.mp3',
      text: 'Chuyển sang bài tiếp theo nhé!',
      cooldownMs: 10000,
    },
    halfWay: {
      path: '/audio/voice/vi-female/workout_006_half.mp3',
      text: 'Bạn đã đi được nửa chặng đường!',
      cooldownMs: 15000,
    },
    rest: {
      path: '/audio/voice/vi-female/workout_007_rest.mp3',
      text: 'Nghỉ một chút nhé!',
      cooldownMs: 10000,
    },
    water: {
      path: '/audio/voice/vi-female/workout_008_water.mp3',
      text: 'Nhớ uống một chút nước nhé!',
      cooldownMs: 15000,
    },
    continue: {
      path: '/audio/voice/vi-female/workout_009_continue.mp3',
      text: 'Tiếp tục nào!',
      cooldownMs: 10000,
    },
    last: {
      path: '/audio/voice/vi-female/workout_010_last.mp3',
      text: 'Bài cuối cùng rồi!',
      cooldownMs: 15000,
    },
    cooldown: {
      path: '/audio/voice/vi-female/workout_011_cooldown.mp3',
      text: 'Thả lỏng cơ thể nhé!',
      cooldownMs: 15000,
    },
    breathe: {
      path: '/audio/voice/vi-female/workout_012_breathe.mp3',
      text: 'Hít vào thật nhẹ, rồi thở ra nào!',
      cooldownMs: 10000,
    },
    finish: {
      path: '/audio/voice/vi-female/workout_013_finish.mp3',
      text: 'Bài vận động hoàn thành!',
      cooldownMs: 15000,
    },
    greatJob: {
      path: '/audio/voice/vi-female/workout_014_great_job.mp3',
      text: 'Hôm nay bạn vận động rất tốt!',
      cooldownMs: 15000,
    },
  },

  race: {
    ready: {
      path: '/audio/voice/vi-female/race_001_ready.mp3',
      text: 'Sẵn sàng đua chưa?',
      cooldownMs: 10000,
    },
    hands: {
      path: '/audio/voice/vi-female/race_002_hands.mp3',
      text: 'Hai tay cầm vô lăng nào!',
      cooldownMs: 8000,
    },
    straight: {
      path: '/audio/voice/vi-female/race_003_straight.mp3',
      text: 'Giữ thẳng!',
      cooldownMs: 6000,
    },
    left: {
      path: '/audio/voice/vi-female/race_004_left.mp3',
      text: 'Rẽ trái!',
      cooldownMs: 4000,
    },
    right: {
      path: '/audio/voice/vi-female/race_005_right.mp3',
      text: 'Rẽ phải!',
      cooldownMs: 4000,
    },
    countdown: {
      path: '/audio/voice/vi-female/race_006_countdown.mp3',
      text: 'Ba, hai, một!',
      cooldownMs: 5000,
    },
    go: {
      path: '/audio/voice/vi-female/race_007_go.mp3',
      text: 'Xuất phát!',
      cooldownMs: 5000,
    },
    fast: {
      path: '/audio/voice/vi-female/race_008_fast.mp3',
      text: 'Tăng tốc!',
      cooldownMs: 6000,
    },
    nitro: {
      path: '/audio/voice/vi-female/race_009_nitro.mp3',
      text: 'Nitro!',
      cooldownMs: 4000,
    },
    boost: {
      path: '/audio/voice/vi-female/race_010_boost.mp3',
      text: 'Tăng tốc siêu nhanh!',
      cooldownMs: 6000,
    },
    brake: {
      path: '/audio/voice/vi-female/race_011_brake.mp3',
      text: 'Phanh nào!',
      cooldownMs: 4000,
    },
    first: {
      path: '/audio/voice/vi-female/race_012_first.mp3',
      text: 'Bạn đang dẫn đầu!',
      cooldownMs: 10000,
    },
    second: {
      path: '/audio/voice/vi-female/race_013_second.mp3',
      text: 'Sắp lên hạng nhất rồi!',
      cooldownMs: 10000,
    },
    finalLap: {
      path: '/audio/voice/vi-female/race_014_final_lap.mp3',
      text: 'Vòng cuối cùng!',
      cooldownMs: 15000,
    },
    finish: {
      path: '/audio/voice/vi-female/race_015_finish.mp3',
      text: 'Về đích!',
      cooldownMs: 15000,
    },
    win: {
      path: '/audio/voice/vi-female/race_016_win.mp3',
      text: 'Bạn chiến thắng!',
      cooldownMs: 15000,
    },
    newRecord: {
      path: '/audio/voice/vi-female/race_017_new_record.mp3',
      text: 'Kỷ lục vòng đua mới!',
      cooldownMs: 15000,
    },
    nextPlayer: {
      path: '/audio/voice/vi-female/race_018_next_player.mp3',
      text: 'Đến lượt người chơi tiếp theo!',
      cooldownMs: 15000,
    },
    calibStraight: {
      path: '/audio/voice/vi-female/race_019_calibration_straight.mp3',
      text: 'Giữ hai tay thẳng phía trước nhé!',
      cooldownMs: 8000,
    },
    calibLeft: {
      path: '/audio/voice/vi-female/race_020_calibration_left.mp3',
      text: 'Xoay vô lăng sang trái!',
      cooldownMs: 8000,
    },
    calibRight: {
      path: '/audio/voice/vi-female/race_021_calibration_right.mp3',
      text: 'Xoay vô lăng sang phải!',
      cooldownMs: 8000,
    },
    calibDone: {
      path: '/audio/voice/vi-female/race_022_calibration_done.mp3',
      text: 'Căn chỉnh vô lăng hoàn tất!',
      cooldownMs: 10000,
    },
  },

  ludo: {
    start: {
      path: '/audio/voice/vi-female/ludo_001_start.mp3',
      text: 'Bắt đầu chơi Cờ Cá Ngựa nhé!',
      cooldownMs: 15000,
    },
    yourTurn: {
      path: '/audio/voice/vi-female/ludo_002_your_turn.mp3',
      text: 'Đến lượt bạn!',
      cooldownMs: 10000,
    },
    roll: {
      path: '/audio/voice/vi-female/ludo_003_roll.mp3',
      text: 'Tung xúc xắc nào!',
      cooldownMs: 8000,
    },
    one: {
      path: '/audio/voice/vi-female/ludo_004_one.mp3',
      text: 'Một điểm!',
      cooldownMs: 4000,
    },
    two: {
      path: '/audio/voice/vi-female/ludo_005_two.mp3',
      text: 'Hai điểm!',
      cooldownMs: 4000,
    },
    three: {
      path: '/audio/voice/vi-female/ludo_006_three.mp3',
      text: 'Ba điểm!',
      cooldownMs: 4000,
    },
    four: {
      path: '/audio/voice/vi-female/ludo_007_four.mp3',
      text: 'Bốn điểm!',
      cooldownMs: 4000,
    },
    five: {
      path: '/audio/voice/vi-female/ludo_008_five.mp3',
      text: 'Năm điểm!',
      cooldownMs: 4000,
    },
    six: {
      path: '/audio/voice/vi-female/ludo_009_six.mp3',
      text: 'Sáu điểm! Tuyệt quá!',
      cooldownMs: 6000,
    },
    choose: {
      path: '/audio/voice/vi-female/ludo_010_choose.mp3',
      text: 'Chọn quân để đi nhé!',
      cooldownMs: 8000,
    },
    capture: {
      path: '/audio/voice/vi-female/ludo_011_capture.mp3',
      text: 'Bắt được quân rồi!',
      cooldownMs: 8000,
    },
    home: {
      path: '/audio/voice/vi-female/ludo_012_home.mp3',
      text: 'Về chuồng rồi!',
      cooldownMs: 8000,
    },
    again: {
      path: '/audio/voice/vi-female/ludo_013_again.mp3',
      text: 'Bạn được tung thêm một lần nữa!',
      cooldownMs: 8000,
    },
    win: {
      path: '/audio/voice/vi-female/ludo_014_win.mp3',
      text: 'Bạn chiến thắng!',
      cooldownMs: 15000,
    },
  },

  pet: {
    hello: {
      path: '/audio/voice/vi-female/pet_001_hello.mp3',
      text: 'Xin chào bạn nhỏ!',
      cooldownMs: 10000,
    },
    hungry: {
      path: '/audio/voice/vi-female/pet_002_hungry.mp3',
      text: 'Mình hơi đói rồi!',
      cooldownMs: 10000,
    },
    feed: {
      path: '/audio/voice/vi-female/pet_003_feed.mp3',
      text: 'Cho mình ăn nhé!',
      cooldownMs: 10000,
    },
    yummy: {
      path: '/audio/voice/vi-female/pet_004_yummy.mp3',
      text: 'Ngon quá!',
      cooldownMs: 6000,
    },
    play: {
      path: '/audio/voice/vi-female/pet_005_play.mp3',
      text: 'Chơi cùng mình nhé!',
      cooldownMs: 10000,
    },
    happy: {
      path: '/audio/voice/vi-female/pet_006_happy.mp3',
      text: 'Mình vui quá!',
      cooldownMs: 8000,
    },
    bath: {
      path: '/audio/voice/vi-female/pet_007_bath.mp3',
      text: 'Tắm thật sạch nào!',
      cooldownMs: 10000,
    },
    clean: {
      path: '/audio/voice/vi-female/pet_008_clean.mp3',
      text: 'Sạch sẽ rồi!',
      cooldownMs: 8000,
    },
    sleep: {
      path: '/audio/voice/vi-female/pet_009_sleep.mp3',
      text: 'Mình buồn ngủ rồi!',
      cooldownMs: 10000,
    },
    levelUp: {
      path: '/audio/voice/vi-female/pet_010_level_up.mp3',
      text: 'Lên cấp rồi!',
      cooldownMs: 10000,
    },
    love: {
      path: '/audio/voice/vi-female/pet_011_love.mp3',
      text: 'Mình thích Phương Nhã lắm!',
      cooldownMs: 15000,
    },
    bye: {
      path: '/audio/voice/vi-female/pet_012_bye.mp3',
      text: 'Hẹn gặp lại nhé!',
      cooldownMs: 10000,
    },
  },

  parent: {
    start: {
      path: '/audio/voice/vi-female/parent_001_start.mp3',
      text: 'Cùng bố mẹ vận động nào!',
      cooldownMs: 15000,
    },
    childTurn: {
      path: '/audio/voice/vi-female/parent_002_child_turn.mp3',
      text: 'Đến lượt bé!',
      cooldownMs: 10000,
    },
    parentTurn: {
      path: '/audio/voice/vi-female/parent_003_parent_turn.mp3',
      text: 'Đến lượt bố hoặc mẹ!',
      cooldownMs: 10000,
    },
    jumpThree: {
      path: '/audio/voice/vi-female/parent_004_jump_three.mp3',
      text: 'Hãy nhảy ba lần nhé!',
      cooldownMs: 10000,
    },
    one: {
      path: '/audio/voice/vi-female/parent_005_one.mp3',
      text: 'Một!',
      cooldownMs: 3000,
    },
    two: {
      path: '/audio/voice/vi-female/parent_006_two.mp3',
      text: 'Hai!',
      cooldownMs: 3000,
    },
    three: {
      path: '/audio/voice/vi-female/parent_007_three.mp3',
      text: 'Ba! Hoàn thành!',
      cooldownMs: 8000,
    },
    clap: {
      path: '/audio/voice/vi-female/parent_008_clap.mp3',
      text: 'Cùng vỗ tay nào!',
      cooldownMs: 8000,
    },
    oneMore: {
      path: '/audio/voice/vi-female/parent_009_one_more.mp3',
      text: 'Còn một lần nữa!',
      cooldownMs: 6000,
    },
    switch: {
      path: '/audio/voice/vi-female/parent_010_switch.mp3',
      text: 'Đổi người nào!',
      cooldownMs: 8000,
    },
    teamwork: {
      path: '/audio/voice/vi-female/parent_011_teamwork.mp3',
      text: 'Phối hợp tuyệt lắm!',
      cooldownMs: 10000,
    },
    finish: {
      path: '/audio/voice/vi-female/parent_012_finish.mp3',
      text: 'Cả nhà làm rất tốt!',
      cooldownMs: 15000,
    },
  },

  progress: {
    missionComplete: {
      path: '/audio/voice/vi-female/progress_001_mission_complete.mp3',
      text: 'Nhiệm vụ hoàn thành!',
      cooldownMs: 10000,
    },
    reward: {
      path: '/audio/voice/vi-female/progress_002_reward.mp3',
      text: 'Nhận phần thưởng nào!',
      cooldownMs: 10000,
    },
    achievement: {
      path: '/audio/voice/vi-female/progress_003_achievement.mp3',
      text: 'Bạn vừa mở được một huy hiệu mới!',
      cooldownMs: 15000,
    },
    newChar: {
      path: '/audio/voice/vi-female/progress_004_new_character.mp3',
      text: 'Một người bạn mới đã xuất hiện!',
      cooldownMs: 15000,
    },
    newWorld: {
      path: '/audio/voice/vi-female/progress_005_new_world.mp3',
      text: 'Thế giới mới đã được mở!',
      cooldownMs: 15000,
    },
    newOutfit: {
      path: '/audio/voice/vi-female/progress_006_new_outfit.mp3',
      text: 'Bạn vừa nhận được trang phục mới!',
      cooldownMs: 15000,
    },
    dailyDone: {
      path: '/audio/voice/vi-female/progress_007_daily_done.mp3',
      text: 'Bạn đã hoàn thành nhiệm vụ hôm nay!',
      cooldownMs: 15000,
    },
    streak: {
      path: '/audio/voice/vi-female/progress_008_streak.mp3',
      text: 'Chuỗi ngày tuyệt vời!',
      cooldownMs: 15000,
    },
  },

  system: {
    tryAgain: {
      path: '/audio/voice/vi-female/system_001_try_again.mp3',
      text: 'Có một chút trục trặc. Hãy thử lại nhé!',
      cooldownMs: 8000,
    },
    cameraRetry: {
      path: '/audio/voice/vi-female/system_002_camera_retry.mp3',
      text: 'Mình chưa kết nối được camera. Hãy thử lại nhé!',
      cooldownMs: 10000,
    },
    touchMode: {
      path: '/audio/voice/vi-female/system_003_touch_mode.mp3',
      text: 'Bạn có thể chuyển sang điều khiển cảm ứng nhé!',
      cooldownMs: 10000,
    },
    pause: {
      path: '/audio/voice/vi-female/system_004_pause.mp3',
      text: 'Trò chơi đã tạm dừng.',
      cooldownMs: 5000,
    },
    resume: {
      path: '/audio/voice/vi-female/system_005_resume.mp3',
      text: 'Tiếp tục chơi nào!',
      cooldownMs: 5000,
    },
    exit: {
      path: '/audio/voice/vi-female/system_006_exit.mp3',
      text: 'Bạn muốn thoát trò chơi phải không?',
      cooldownMs: 10000,
    },
    saved: {
      path: '/audio/voice/vi-female/system_007_saved.mp3',
      text: 'Tiến trình đã được lưu!',
      cooldownMs: 8000,
    },
    noVoice: {
      path: '/audio/voice/vi-female/system_008_no_voice.mp3',
      text: 'Âm thanh hướng dẫn hiện chưa khả dụng.',
      cooldownMs: 10000,
    },
  },

  extra: {
    line_001: {
      path: '/audio/voice/vi-female/extra_001.mp3',
      text: 'Xin chào bạn nhỏ! Mình là Bara. Hôm nay chúng mình cùng vận động và phiêu lưu nhé!',
      cooldownMs: 4500,
    },
    line_002: {
      path: '/audio/voice/vi-female/extra_002.mp3',
      text: 'Chào mừng bạn đến với vương quốc kỳ diệu! Cùng Bara bắt đầu thôi nào!',
      cooldownMs: 4500,
    },
    line_003: {
      path: '/audio/voice/vi-female/extra_003.mp3',
      text: 'Bara rất vui được gặp bạn! Hôm nay chúng mình sẽ có thật nhiều niềm vui!',
      cooldownMs: 4500,
    },
    line_004: {
      path: '/audio/voice/vi-female/extra_004.mp3',
      text: 'Bạn hãy đứng trước camera và lùi lại một chút để mình nhìn thấy toàn thân nhé!',
      cooldownMs: 4500,
    },
    line_005: {
      path: '/audio/voice/vi-female/extra_005.mp3',
      text: 'Bạn ơi, lùi ra sau một chút nha!',
      cooldownMs: 4500,
    },
    line_006: {
      path: '/audio/voice/vi-female/extra_006.mp3',
      text: 'Tiến lại gần mình một chút nhé!',
      cooldownMs: 4500,
    },
    line_007: {
      path: '/audio/voice/vi-female/extra_007.mp3',
      text: 'Mình chưa nhìn thấy đôi chân của bạn. Bạn lùi ra sau một chút nhé!',
      cooldownMs: 4500,
    },
    line_008: {
      path: '/audio/voice/vi-female/extra_008.mp3',
      text: 'Bạn đứng vào giữa màn hình nào!',
      cooldownMs: 4500,
    },
    line_009: {
      path: '/audio/voice/vi-female/extra_009.mp3',
      text: 'Tuyệt vời! Mình đã nhìn thấy bạn rất rõ rồi!',
      cooldownMs: 4500,
    },
    line_010: {
      path: '/audio/voice/vi-female/extra_010.mp3',
      text: 'Ba...',
      cooldownMs: 4500,
    },
    line_011: {
      path: '/audio/voice/vi-female/extra_011.mp3',
      text: 'Hai...',
      cooldownMs: 4500,
    },
    line_012: {
      path: '/audio/voice/vi-female/extra_012.mp3',
      text: 'Một...',
      cooldownMs: 4500,
    },
    line_013: {
      path: '/audio/voice/vi-female/extra_013.mp3',
      text: 'Bắt đầu phiêu lưu!',
      cooldownMs: 4500,
    },
    line_014: {
      path: '/audio/voice/vi-female/extra_014.mp3',
      text: 'Đứng thẳng người và sẵn sàng nhé!',
      cooldownMs: 4500,
    },
    line_015: {
      path: '/audio/voice/vi-female/extra_015.mp3',
      text: 'Giơ tay trái lên nào!',
      cooldownMs: 4500,
    },
    line_016: {
      path: '/audio/voice/vi-female/extra_016.mp3',
      text: 'Bây giờ là tay phải nha!',
      cooldownMs: 4500,
    },
    line_017: {
      path: '/audio/voice/vi-female/extra_017.mp3',
      text: 'Hai tay lên cao thật đẹp!',
      cooldownMs: 4500,
    },
    line_018: {
      path: '/audio/voice/vi-female/extra_018.mp3',
      text: 'Dang hai tay thật rộng như cánh chim nào!',
      cooldownMs: 4500,
    },
    line_019: {
      path: '/audio/voice/vi-female/extra_019.mp3',
      text: 'Chuẩn bị... Nhảy!',
      cooldownMs: 4500,
    },
    line_020: {
      path: '/audio/voice/vi-female/extra_020.mp3',
      text: 'Cúi thấp người xuống nào!',
      cooldownMs: 4500,
    },
    line_021: {
      path: '/audio/voice/vi-female/extra_021.mp3',
      text: 'Nghiêng người sang bên trái nhé!',
      cooldownMs: 4500,
    },
    line_022: {
      path: '/audio/voice/vi-female/extra_022.mp3',
      text: 'Sang bên phải nào!',
      cooldownMs: 4500,
    },
    line_023: {
      path: '/audio/voice/vi-female/extra_023.mp3',
      text: 'Vỗ tay thật to nào!',
      cooldownMs: 4500,
    },
    line_024: {
      path: '/audio/voice/vi-female/extra_024.mp3',
      text: 'Vẫy tay chào bạn bè nào!',
      cooldownMs: 4500,
    },
    line_025: {
      path: '/audio/voice/vi-female/extra_025.mp3',
      text: 'Tuyệt quá! Cầu vồng lấp lánh đã xuất hiện!',
      cooldownMs: 4500,
    },
    line_026: {
      path: '/audio/voice/vi-female/extra_026.mp3',
      text: 'Tuyệt vời quá!',
      cooldownMs: 4500,
    },
    line_027: {
      path: '/audio/voice/vi-female/extra_027.mp3',
      text: 'Giỏi quá bạn ơi!',
      cooldownMs: 4500,
    },
    line_028: {
      path: '/audio/voice/vi-female/extra_028.mp3',
      text: 'Chính xác luôn!',
      cooldownMs: 4500,
    },
    line_029: {
      path: '/audio/voice/vi-female/extra_029.mp3',
      text: 'Hay lắm!',
      cooldownMs: 4500,
    },
    line_030: {
      path: '/audio/voice/vi-female/extra_030.mp3',
      text: 'Đúng rồi nè!',
      cooldownMs: 4500,
    },
    line_031: {
      path: '/audio/voice/vi-female/extra_031.mp3',
      text: 'Bạn làm tốt lắm!',
      cooldownMs: 4500,
    },
    line_032: {
      path: '/audio/voice/vi-female/extra_032.mp3',
      text: 'Wow, bạn dẻo dai quá!',
      cooldownMs: 4500,
    },
    line_033: {
      path: '/audio/voice/vi-female/extra_033.mp3',
      text: 'Tiếp tục phát huy nhé!',
      cooldownMs: 4500,
    },
    line_034: {
      path: '/audio/voice/vi-female/extra_034.mp3',
      text: 'Quá đỉnh luôn!',
      cooldownMs: 4500,
    },
    line_035: {
      path: '/audio/voice/vi-female/extra_035.mp3',
      text: 'Gần đúng rồi, bạn thử lại một lần nữa nhé!',
      cooldownMs: 4500,
    },
    line_036: {
      path: '/audio/voice/vi-female/extra_036.mp3',
      text: 'Một lần nữa nào, bạn làm được mà!',
      cooldownMs: 4500,
    },
    line_037: {
      path: '/audio/voice/vi-female/extra_037.mp3',
      text: 'Giơ tay cao hơn một chút nữa nhé!',
      cooldownMs: 4500,
    },
    line_038: {
      path: '/audio/voice/vi-female/extra_038.mp3',
      text: 'Cố lên nào, bạn sắp làm được rồi!',
      cooldownMs: 4500,
    },
    line_039: {
      path: '/audio/voice/vi-female/extra_039.mp3',
      text: 'Nhớ đứng ở chỗ rộng và không có đồ vật xung quanh nhé!',
      cooldownMs: 4500,
    },
    line_040: {
      path: '/audio/voice/vi-female/extra_040.mp3',
      text: 'Chuẩn bị hai tay nào!',
      cooldownMs: 4500,
    },
    line_041: {
      path: '/audio/voice/vi-female/extra_041.mp3',
      text: 'Trái cây tới rồi! Chém trái cây nhé!',
      cooldownMs: 4500,
    },
    line_042: {
      path: '/audio/voice/vi-female/extra_042.mp3',
      text: 'Chém nào!',
      cooldownMs: 4500,
    },
    line_043: {
      path: '/audio/voice/vi-female/extra_043.mp3',
      text: 'Tuyệt vời! Chém trúng hai quả!',
      cooldownMs: 4500,
    },
    line_044: {
      path: '/audio/voice/vi-female/extra_044.mp3',
      text: 'Wow! Ba quả cùng lúc!',
      cooldownMs: 4500,
    },
    line_045: {
      path: '/audio/voice/vi-female/extra_045.mp3',
      text: 'Chuỗi chém siêu đỉnh x5!',
      cooldownMs: 4500,
    },
    line_046: {
      path: '/audio/voice/vi-female/extra_046.mp3',
      text: 'Cầu vồng xuất hiện rồi! Quét sạch trái cây!',
      cooldownMs: 4500,
    },
    line_047: {
      path: '/audio/voice/vi-female/extra_047.mp3',
      text: 'Ối! Mây đen rồi! Cẩn thận nhé!',
      cooldownMs: 4500,
    },
    line_048: {
      path: '/audio/voice/vi-female/extra_048.mp3',
      text: 'Giỏi quá! Bạn chém được rất nhiều trái cây!',
      cooldownMs: 4500,
    },
    line_049: {
      path: '/audio/voice/vi-female/extra_049.mp3',
      text: 'Đưa tay ngắm vào những chú gà tinh nghịch nhé! Bong bóng sẽ tự bắn!',
      cooldownMs: 4500,
    },
    line_050: {
      path: '/audio/voice/vi-female/extra_050.mp3',
      text: 'Gà vàng kìa! Nhanh lên!',
      cooldownMs: 4500,
    },
    line_051: {
      path: '/audio/voice/vi-female/extra_051.mp3',
      text: 'Bạn gà đội mũ cần hai bong bóng nè!',
      cooldownMs: 4500,
    },
    line_052: {
      path: '/audio/voice/vi-female/extra_052.mp3',
      text: 'Né nào!',
      cooldownMs: 4500,
    },
    line_053: {
      path: '/audio/voice/vi-female/extra_053.mp3',
      text: 'Oa! Gà khổng lồ tinh nghịch kìa! Bắn bong bóng thật khéo nhé!',
      cooldownMs: 4500,
    },
    line_054: {
      path: '/audio/voice/vi-female/extra_054.mp3',
      text: 'Tuyệt lắm! Bạn đã đưa rất nhiều bạn gà về chuồng!',
      cooldownMs: 4500,
    },
    line_055: {
      path: '/audio/voice/vi-female/extra_055.mp3',
      text: 'Các bạn quái vật bị buồn ngủ rồi! Dùng ánh sáng và kẹo phép thuật giúp các bạn ấy tỉnh lại nhé!',
      cooldownMs: 4500,
    },
    line_056: {
      path: '/audio/voice/vi-female/extra_056.mp3',
      text: 'Quái vật đang tới!',
      cooldownMs: 4500,
    },
    line_057: {
      path: '/audio/voice/vi-female/extra_057.mp3',
      text: 'Dùng phép màu cầu vồng nào!',
      cooldownMs: 4500,
    },
    line_058: {
      path: '/audio/voice/vi-female/extra_058.mp3',
      text: 'Giỏi lắm! Bạn ấy tỉnh lại rồi!',
      cooldownMs: 4500,
    },
    line_059: {
      path: '/audio/voice/vi-female/extra_059.mp3',
      text: 'Mây buồn ngủ bay tới, cúi thấp người xuống nào!',
      cooldownMs: 4500,
    },
    line_060: {
      path: '/audio/voice/vi-female/extra_060.mp3',
      text: 'Nhảy qua vũng kẹo trơn nào!',
      cooldownMs: 4500,
    },
    line_061: {
      path: '/audio/voice/vi-female/extra_061.mp3',
      text: 'Vua Quái Vật Buồn Ngủ xuất hiện rồi! Hãy làm đúng các động tác để đánh thức bạn ấy nhé!',
      cooldownMs: 4500,
    },
    line_062: {
      path: '/audio/voice/vi-female/extra_062.mp3',
      text: 'Bạn ấy tỉnh rồi! Tuyệt quá! Cùng nhau ăn bánh kem thôi!',
      cooldownMs: 4500,
    },
    line_063: {
      path: '/audio/voice/vi-female/extra_063.mp3',
      text: 'Xuất sắc! Tất cả quái vật đã vui vẻ tỉnh lại rồi!',
      cooldownMs: 4500,
    },
    line_064: {
      path: '/audio/voice/vi-female/extra_064.mp3',
      text: 'Dùng đôi tay khéo léo để bắt thật nhiều ngôi sao lấp lánh nhé!',
      cooldownMs: 4500,
    },
    line_065: {
      path: '/audio/voice/vi-female/extra_065.mp3',
      text: 'Oa, ngôi sao cầu vồng kìa! Bắt lấy mau!',
      cooldownMs: 4500,
    },
    line_066: {
      path: '/audio/voice/vi-female/extra_066.mp3',
      text: 'Kim cương quý giá xuất hiện rồi, bắt lấy nào!',
      cooldownMs: 4500,
    },
    line_067: {
      path: '/audio/voice/vi-female/extra_067.mp3',
      text: 'Một hộp quà bí mật! Tuyệt quá!',
      cooldownMs: 4500,
    },
    line_068: {
      path: '/audio/voice/vi-female/extra_068.mp3',
      text: 'Chuỗi năm lần liên tiếp rồi! Giỏi quá!',
      cooldownMs: 4500,
    },
    line_069: {
      path: '/audio/voice/vi-female/extra_069.mp3',
      text: 'Wow! Mười lần liên tiếp hoàn hảo!',
      cooldownMs: 4500,
    },
    line_070: {
      path: '/audio/voice/vi-female/extra_070.mp3',
      text: 'Hoàn thành rồi! Bạn bắt được thật nhiều sao!',
      cooldownMs: 4500,
    },
    line_071: {
      path: '/audio/voice/vi-female/extra_071.mp3',
      text: 'Cùng Bara khám phá Khu Rừng Kỳ Diệu nhé!',
      cooldownMs: 4500,
    },
    line_072: {
      path: '/audio/voice/vi-female/extra_072.mp3',
      text: 'Chào mừng bạn đến với Thành Phố Kẹo Ngọt thơm lừng!',
      cooldownMs: 4500,
    },
    line_073: {
      path: '/audio/voice/vi-female/extra_073.mp3',
      text: 'Cùng lặn xuống Đại Dương Xanh Thẳm ngắm san hô nào!',
      cooldownMs: 4500,
    },
    line_074: {
      path: '/audio/voice/vi-female/extra_074.mp3',
      text: 'Chúng mình đang bay lên Lâu Đài Trên Mây bồng bềnh!',
      cooldownMs: 4500,
    },
    line_075: {
      path: '/audio/voice/vi-female/extra_075.mp3',
      text: 'Khám phá Vũ Trụ bao la cùng các vì sao!',
      cooldownMs: 4500,
    },
    line_076: {
      path: '/audio/voice/vi-female/extra_076.mp3',
      text: 'Xứ Sở Kỳ Lân lấp lánh cầu vồng kì diệu!',
      cooldownMs: 4500,
    },
    line_077: {
      path: '/audio/voice/vi-female/extra_077.mp3',
      text: 'Mây Mưa Khổng Lồ xuất hiện! Hãy giơ hai tay tạo cầu vồng dọn sạch mây đen nhé!',
      cooldownMs: 4500,
    },
    line_078: {
      path: '/audio/voice/vi-female/extra_078.mp3',
      text: 'Tuyệt vời! Chúng mình đã vượt qua màn chơi xuất sắc!',
      cooldownMs: 4500,
    },
    line_079: {
      path: '/audio/voice/vi-female/extra_079.mp3',
      text: 'Hãy làm tư thế thật giống mình trên màn hình nhé!',
      cooldownMs: 4500,
    },
    line_080: {
      path: '/audio/voice/vi-female/extra_080.mp3',
      text: 'Giữ nguyên tư thế trong ba giây nào...',
      cooldownMs: 4500,
    },
    line_081: {
      path: '/audio/voice/vi-female/extra_081.mp3',
      text: 'Tư thế chuẩn không cần chỉnh luôn!',
      cooldownMs: 4500,
    },
    line_082: {
      path: '/audio/voice/vi-female/extra_082.mp3',
      text: 'Cùng hòa vào điệu nhạc và nhảy múa cùng Bara nào!',
      cooldownMs: 4500,
    },
    line_083: {
      path: '/audio/voice/vi-female/extra_083.mp3',
      text: 'Đúng nhịp điệu rồi, nhảy đẹp lắm!',
      cooldownMs: 4500,
    },
    line_084: {
      path: '/audio/voice/vi-female/extra_084.mp3',
      text: 'Vũ điệu hoàn thành thật xuất sắc!',
      cooldownMs: 4500,
    },
    line_085: {
      path: '/audio/voice/vi-female/extra_085.mp3',
      text: 'Bạn ấy thích được vuốt ve lắm đó!',
      cooldownMs: 4500,
    },
    line_086: {
      path: '/audio/voice/vi-female/extra_086.mp3',
      text: 'Măm măm, món ăn ngon tuyệt!',
      cooldownMs: 4500,
    },
    line_087: {
      path: '/audio/voice/vi-female/extra_087.mp3',
      text: 'Xà phòng thơm ngát, sạch sẽ mát mẻ rồi!',
      cooldownMs: 4500,
    },
    line_088: {
      path: '/audio/voice/vi-female/extra_088.mp3',
      text: 'Bộ lông mượt mà lấp lánh rồi nè!',
      cooldownMs: 4500,
    },
    line_089: {
      path: '/audio/voice/vi-female/extra_089.mp3',
      text: 'Chúc mừng! Bạn thú cưng đã lên cấp mới!',
      cooldownMs: 4500,
    },
    line_090: {
      path: '/audio/voice/vi-female/extra_090.mp3',
      text: 'Chào mừng bạn đến với buổi vận động 5 phút vui khỏe mỗi ngày!',
      cooldownMs: 4500,
    },
    line_091: {
      path: '/audio/voice/vi-female/extra_091.mp3',
      text: 'Cùng thử thách với bài tập năng động 10 phút tràn đầy năng lượng nhé!',
      cooldownMs: 4500,
    },
    line_092: {
      path: '/audio/voice/vi-female/extra_092.mp3',
      text: 'Bạn đang làm rất tốt, cố gắng lên nào!',
      cooldownMs: 4500,
    },
    line_093: {
      path: '/audio/voice/vi-female/extra_093.mp3',
      text: 'Nghỉ giải lao một chút uống nước nhé!',
      cooldownMs: 4500,
    },
    line_094: {
      path: '/audio/voice/vi-female/extra_094.mp3',
      text: 'Hoàn thành xuất sắc bài tập hôm nay! Bạn thật là tuyệt vời!',
      cooldownMs: 4500,
    },
    line_095: {
      path: '/audio/voice/vi-female/extra_095.mp3',
      text: 'Trò chơi tiếp sức gia đình! Bố mẹ và bé cùng phối hợp nhé!',
      cooldownMs: 4500,
    },
    line_096: {
      path: '/audio/voice/vi-female/extra_096.mp3',
      text: 'Lượt của bé, bé chuẩn bị làm động tác nhé!',
      cooldownMs: 4500,
    },
    line_097: {
      path: '/audio/voice/vi-female/extra_097.mp3',
      text: 'Bây giờ tới lượt bố hoặc mẹ làm động tác nè!',
      cooldownMs: 4500,
    },
    line_098: {
      path: '/audio/voice/vi-female/extra_098.mp3',
      text: 'Gia đình mình phối hợp thật là ăn ý và tuyệt vời!',
      cooldownMs: 4500,
    },
    line_099: {
      path: '/audio/voice/vi-female/extra_099.mp3',
      text: 'Chào mừng các bạn đến với Cờ Cá Ngựa - Đường Đua Kỳ Diệu! Cùng tung xúc xắc và đua nào!',
      cooldownMs: 4500,
    },
    line_100: {
      path: '/audio/voice/vi-female/extra_100.mp3',
      text: 'Bạn có thể đưa một quân ra khỏi chuồng nè!',
      cooldownMs: 4500,
    },
    line_101: {
      path: '/audio/voice/vi-female/extra_101.mp3',
      text: 'Hãy chạm vào quân bạn muốn di chuyển nhé!',
      cooldownMs: 4500,
    },
    line_102: {
      path: '/audio/voice/vi-female/extra_102.mp3',
      text: 'Tung được sáu điểm! Bạn được tung thêm một lần nữa nè!',
      cooldownMs: 4500,
    },
    line_103: {
      path: '/audio/voice/vi-female/extra_103.mp3',
      text: 'Ồ! Đi trúng ô Cầu Vồng, tiến thêm hai bước!',
      cooldownMs: 4500,
    },
    line_104: {
      path: '/audio/voice/vi-female/extra_104.mp3',
      text: 'Bạn nhận được một ngôi sao may mắn lấp lánh!',
      cooldownMs: 4500,
    },
    line_105: {
      path: '/audio/voice/vi-female/extra_105.mp3',
      text: 'Trận đấu hoàn thành rồi! Cả nhóm chơi rất tuyệt vời!',
      cooldownMs: 4500,
    },
    line_106: {
      path: '/audio/voice/vi-female/extra_106.mp3',
      text: 'Chào mừng bạn đến với Gara Bara Speed Racing! Hãy chọn chiếc xe yêu thích nhé!',
      cooldownMs: 4500,
    },
    line_107: {
      path: '/audio/voice/vi-female/extra_107.mp3',
      text: 'Đặt hai tay ra phía trước như đang cầm vô lăng nhé!',
      cooldownMs: 4500,
    },
    line_108: {
      path: '/audio/voice/vi-female/extra_108.mp3',
      text: 'Nghiêng hai tay sang trái nào!',
      cooldownMs: 4500,
    },
    line_109: {
      path: '/audio/voice/vi-female/extra_109.mp3',
      text: 'Bây giờ nghiêng sang phải nha!',
      cooldownMs: 4500,
    },
    line_110: {
      path: '/audio/voice/vi-female/extra_110.mp3',
      text: 'Tuyệt rồi! Vô lăng đã sẵn sàng! Chúng mình cùng đua nhé!',
      cooldownMs: 4500,
    },
    line_111: {
      path: '/audio/voice/vi-female/extra_111.mp3',
      text: 'Cua trái phía trước! Ôm cua nào!',
      cooldownMs: 4500,
    },
    line_112: {
      path: '/audio/voice/vi-female/extra_112.mp3',
      text: 'Chuẩn bị rẽ phải!',
      cooldownMs: 4500,
    },
    line_113: {
      path: '/audio/voice/vi-female/extra_113.mp3',
      text: 'Drift đẹp lắm!',
      cooldownMs: 4500,
    },
    line_114: {
      path: '/audio/voice/vi-female/extra_114.mp3',
      text: 'Drift hoàn hảo tuyệt đỉnh!',
      cooldownMs: 4500,
    },
    line_115: {
      path: '/audio/voice/vi-female/extra_115.mp3',
      text: 'Nitro đã sẵn sàng!',
      cooldownMs: 4500,
    },
    line_116: {
      path: '/audio/voice/vi-female/extra_116.mp3',
      text: 'Tăng tốc thần tốc nào!',
      cooldownMs: 4500,
    },
    line_117: {
      path: '/audio/voice/vi-female/extra_117.mp3',
      text: 'Đã qua Checkpoint! Cộng thêm thời gian!',
      cooldownMs: 4500,
    },
    line_118: {
      path: '/audio/voice/vi-female/extra_118.mp3',
      text: 'Vòng cuối cùng rồi! Cố lên bạn ơi!',
      cooldownMs: 4500,
    },
    line_119: {
      path: '/audio/voice/vi-female/extra_119.mp3',
      text: 'Bảo vệ phép thuật đã kích hoạt!',
      cooldownMs: 4500,
    },
    line_120: {
      path: '/audio/voice/vi-female/extra_120.mp3',
      text: 'Ngôi sao may mắn cộng điểm tốc độ!',
      cooldownMs: 4500,
    },
    line_121: {
      path: '/audio/voice/vi-female/extra_121.mp3',
      text: 'Tuyệt vời! Bạn đã xuất sắc về nhất cuộc đua!',
      cooldownMs: 4500,
    },
    line_122: {
      path: '/audio/voice/vi-female/extra_122.mp3',
      text: 'Bạn lái xe rất cừ! Lần sau chúng mình sẽ về nhất nhé!',
      cooldownMs: 4500,
    }
  },
  runtime: {
    line_001: {
      path: '/audio/voice/vi-female/runtime_001.mp3',
      text: 'Bé hãy lùi ra xa camera một chút để hiển thị đầy đủ cơ thể, từ đầu đến chân nhé!',
      cooldownMs: 2500,
    },
    line_002: {
      path: '/audio/voice/vi-female/runtime_002.mp3',
      text: 'Bé hãy đưa hai tay ra trước như đang cầm vô lăng và đứng thẳng nhé!',
      cooldownMs: 2500,
    },
    line_003: {
      path: '/audio/voice/vi-female/runtime_003.mp3',
      text: 'Bé hãy đứng thẳng trước camera để thấy phần thân trên và hai vai nhé!',
      cooldownMs: 2500,
    },
    line_004: {
      path: '/audio/voice/vi-female/runtime_004.mp3',
      text: 'Bé hãy đứng trước camera và đưa cổ tay sẵn sàng nhé!',
      cooldownMs: 2500,
    },
    line_005: {
      path: '/audio/voice/vi-female/runtime_005.mp3',
      text: 'Thành công rồi! Chuẩn bị bắt đầu nào!',
      cooldownMs: 2500,
    },
    line_006: {
      path: '/audio/voice/vi-female/runtime_006.mp3',
      text: 'Cùng nhảy múa theo điệu nhạc vui nhộn nào!',
      cooldownMs: 2500,
    },
    line_007: {
      path: '/audio/voice/vi-female/runtime_007.mp3',
      text: 'Hãy làm theo các tư thế mẫu siêu dễ thương nào!',
      cooldownMs: 2500,
    },
    line_008: {
      path: '/audio/voice/vi-female/runtime_008.mp3',
      text: 'Xuất sắc! Bạn đã vượt qua tất cả thử thách tư thế!',
      cooldownMs: 2500,
    },
    line_009: {
      path: '/audio/voice/vi-female/runtime_009.mp3',
      text: 'Xin chào các bạn nhỏ, đây là giọng đọc với cao độ và tốc độ bạn đã chọn!',
      cooldownMs: 2500,
    },
    line_010: {
      path: '/audio/voice/vi-female/runtime_010.mp3',
      text: 'Lùi lại một chút để mình nhìn thấy toàn thân nhé!',
      cooldownMs: 2500,
    },
    line_011: {
      path: '/audio/voice/vi-female/runtime_011.mp3',
      text: 'Toàn thân đã sẵn sàng!',
      cooldownMs: 2500,
    },
    line_012: {
      path: '/audio/voice/vi-female/runtime_012.mp3',
      text: 'Hãy tạo dáng theo hình mẫu trên màn hình nhé!',
      cooldownMs: 2500,
    },
    line_013: {
      path: '/audio/voice/vi-female/runtime_013.mp3',
      text: 'Ba, hai, một... cười lên nào!',
      cooldownMs: 2500,
    },
    line_014: {
      path: '/audio/voice/vi-female/runtime_014.mp3',
      text: 'Fashion Show hoàn thành! Bé trình diễn rất tuyệt vời!',
      cooldownMs: 2500,
    },
    line_015: {
      path: '/audio/voice/vi-female/runtime_015.mp3',
      text: 'Chào mừng đến với Gương Phép Thuật!',
      cooldownMs: 2500,
    },
    line_016: {
      path: '/audio/voice/vi-female/runtime_016.mp3',
      text: 'Đã mở khóa một trang phục mới!',
      cooldownMs: 2500,
    },
    line_017: {
      path: '/audio/voice/vi-female/runtime_017.mp3',
      text: 'Đã lưu bộ trang phục cá tính của bé!',
      cooldownMs: 2500,
    },
    line_018: {
      path: '/audio/voice/vi-female/runtime_018.mp3',
      text: 'Phối đồ bất ngờ thành công!',
      cooldownMs: 2500,
    },
    line_019: {
      path: '/audio/voice/vi-female/runtime_019.mp3',
      text: 'Đã cất hết quần áo!',
      cooldownMs: 2500,
    },
    line_020: {
      path: '/audio/voice/vi-female/runtime_020.mp3',
      text: 'Ba, hai, một... tạo dáng!',
      cooldownMs: 2500,
    },
    line_021: {
      path: '/audio/voice/vi-female/runtime_021.mp3',
      text: 'Chào mừng trở lại! Mình tiếp tục chơi nhé!',
      cooldownMs: 2500,
    },
    line_022: {
      path: '/audio/voice/vi-female/runtime_022.mp3',
      text: 'Đã hoàn tác nước vừa chọn!',
      cooldownMs: 2500,
    },
    line_023: {
      path: '/audio/voice/vi-female/runtime_023.mp3',
      text: 'Rất tiếc! Không có quân nào đi được. Đổi lượt tiếp theo nhé!',
      cooldownMs: 2500,
    },
  },
};
