export const RELEASE_NOTES = [
  'Đua xe 2 người: một camera, P1/P2 độc lập và luôn có fallback bàn phím/cảm ứng khi Pose không khả dụng.',
  'Garage & FBX: giữ đủ catalog xe/model, thêm fallback an toàn khi WebGL lỗi hoặc thiết bị yếu.',
  'Camera/MediaPipe: giảm tải Pose 2P, dừng camera/model đúng vòng đời khi rời màn chơi.',
  'Ổn định game: cleanup timeout/RAF/audio để hạn chế callback chạy ngầm khi thoát/vào lại.',
  'PC/Mobile/Android TV: cải thiện responsive, focus điều khiển và chính sách FBX nặng theo thiết bị.',
  'Release Gate: TypeScript + assets + voice + build + Runtime Golden desktop/mobile và forced no-WebGL.',
] as const;

export const BUILD_INFO = {
  version: __APP_VERSION__,
  buildTimeIso: __BUILD_TIME__,
  commitSha: __COMMIT_SHA__,
  channel: __BUILD_CHANNEL__,
  notes: RELEASE_NOTES,
} as const;

export function formatBuildTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}
