-- 문의 테이블 스키마
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone1 TEXT NOT NULL,
    phone2 TEXT NOT NULL,
    phone3 TEXT NOT NULL,
    car_name TEXT,
    rent_type TEXT NOT NULL, 
    months TEXT NOT NULL,
    business_type TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now', '+9 hours')),
    status TEXT DEFAULT 'pending',
    memo TEXT 
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status ON inquiries(status);
