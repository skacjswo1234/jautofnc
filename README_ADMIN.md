# 관리자 화면 설정 가이드

## Cloudflare D1 데이터베이스 설정

### 1. 데이터베이스 정보
- **데이터베이스 ID**: `c0b7b2c0-4e66-47ee-af54-6fcefde5ba0d`
- **변수명**: `jautofnc-db`
- **바인드명**: `jautofnc-db`

### 2. 스키마 생성

`schema.sql` 파일의 내용을 사용하여 데이터베이스 스키마를 생성하세요:

```bash
# 로컬 개발 환경에서
npx wrangler d1 execute jautofnc-db --file=schema.sql

# 프로덕션 환경에서
npx wrangler d1 execute jautofnc-db --file=schema.sql --remote
```

### 3. Cloudflare Pages 설정

#### wrangler.toml 파일 생성 (프로젝트 루트)

```toml
name = "jautofnc"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "jautofnc-db"
database_name = "jautofnc-db"
database_id = "c0b7b2c0-4e66-47ee-af54-6fcefde5ba0d"
```

#### Pages 프로젝트 설정

1. Cloudflare Dashboard에서 Pages 프로젝트 생성
2. 환경 변수 설정:
   - 변수명: `jautofnc-db`
   - 바인드명: `jautofnc-db`
3. D1 데이터베이스 연결:
   - 데이터베이스 ID: `c0b7b2c0-4e66-47ee-af54-6fcefde5ba0d`

## 파일 구조

```
jautofnc/
├── functions/
│   └── api/
│       └── inquiries.ts      # API 엔드포인트
├── admin.html                 # 관리자 화면 HTML
├── admin.css                  # 관리자 화면 스타일
├── admin.js                   # 관리자 화면 JavaScript
├── schema.sql                 # 데이터베이스 스키마
└── wrangler.toml              # Cloudflare 설정 (선택사항)
```

## API 엔드포인트

### GET /api/inquiries
문의 목록 조회

**Query Parameters:**
- `status` (optional): `all`, `pending`, `contacted`, `completed`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "phone1": "010",
      "phone2": "1234",
      "phone3": "5678",
      "car_name": "소나타",
      "rent_type": "렌트",
      "months": "48개월",
      "business_type": "개인",
      "created_at": "2024-01-01T00:00:00Z",
      "status": "pending"
    }
  ]
}
```

### DELETE /api/inquiries?id={id}
문의 삭제

**Query Parameters:**
- `id`: 문의 ID

**Response:**
```json
{
  "success": true,
  "message": "Inquiry deleted successfully"
}
```

### PATCH /api/inquiries
문의 상태 업데이트

**Request Body:**
```json
{
  "id": 1,
  "status": "contacted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

## 사용 방법

1. 관리자 화면 접속: `https://your-domain.pages.dev/admin.html`
2. 왼쪽 네비게이션에서 상태별로 문의를 필터링할 수 있습니다.
3. 각 문의 카드에서 상태를 변경하거나 삭제할 수 있습니다.
4. 모바일에서는 오른쪽 상단 메뉴 버튼을 클릭하여 네비게이션을 열 수 있습니다.

## 디자인 특징

- **컬러톤**: #0042fc (파란색)와 흰색
- **폰트**: Paperlogy 폰트 패밀리 사용
- **PC 디자인**: 왼쪽 사이드바 네비게이션, 오른쪽 콘텐츠 영역
- **모바일 디자인**: 오른쪽 상단 햄버거 메뉴, 클릭 시 오른쪽에서 왼쪽으로 슬라이드되는 사이드바

## 테이블 스키마

### inquiries 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INTEGER | 기본키 (자동증가) |
| name | TEXT | 이름 |
| phone1 | TEXT | 전화번호 앞자리 |
| phone2 | TEXT | 전화번호 중간자리 |
| phone3 | TEXT | 전화번호 뒷자리 |
| car_name | TEXT | 차량명 (NULL 가능) |
| rent_type | TEXT | 렌트/리스 |
| months | TEXT | 개월수 |
| business_type | TEXT | 사업자구분 |
| created_at | DATETIME | 생성일시 (기본값: CURRENT_TIMESTAMP) |
| status | TEXT | 상태 (기본값: 'pending') |

**상태 값:**
- `pending`: 대기중
- `contacted`: 연락완료
- `completed`: 처리완료

**인덱스:**
- `idx_created_at`: created_at 컬럼 (DESC)
- `idx_status`: status 컬럼
