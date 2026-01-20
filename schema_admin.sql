-- 관리자 테이블 스키마
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', '+9 hours'))
);

-- 기본 관리자 비밀번호: admin123 (실제 사용 시 변경 필요)
-- 비밀번호는 평문으로 저장 (단순 비교용)
INSERT OR IGNORE INTO admin (password) VALUES ('admin123');
