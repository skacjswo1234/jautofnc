// API 기본 URL
const API_BASE = '/api/inquiries';

// 현재 선택된 상태
let currentStatus = 'all';

// DOM 요소
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const navItems = document.querySelectorAll('.nav-item');
const inquiriesList = document.getElementById('inquiriesList');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const contentTitle = document.getElementById('contentTitle');

// 상태별 제목 매핑
const statusTitles = {
    all: '전체 문의',
    pending: '대기중 문의',
    contacted: '연락완료 문의',
    completed: '처리완료 문의'
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadInquiries('all');
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 네비게이션 아이템 클릭
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const status = item.dataset.status;
            selectNavItem(status);
            loadInquiries(status);
        });
    });

    // 모바일 메뉴 버튼
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // 모바일 오버레이 클릭
    mobileOverlay.addEventListener('click', closeMobileMenu);

    // 새로고침 버튼
    refreshBtn.addEventListener('click', () => {
        loadInquiries(currentStatus);
    });
}

// 모바일 메뉴 토글
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// 모바일 메뉴 닫기
function closeMobileMenu() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// 네비게이션 아이템 선택
function selectNavItem(status) {
    currentStatus = status;
    contentTitle.textContent = statusTitles[status] || '전체 문의';
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.status === status) {
            item.classList.add('active');
        }
    });
}

// 문의 목록 로드
async function loadInquiries(status = 'all') {
    showLoading();
    
    try {
        const url = status === 'all' 
            ? API_BASE 
            : `${API_BASE}?status=${status}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            displayInquiries(result.data);
            updateCounts(result.data);
        } else {
            showError('문의 목록을 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('Error loading inquiries:', error);
        showError('문의 목록을 불러오는데 실패했습니다.');
    } finally {
        hideLoading();
    }
}

// 문의 목록 표시
function displayInquiries(inquiries) {
    if (inquiries.length === 0) {
        inquiriesList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-3-3v6m-9 1V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <h3>문의가 없습니다</h3>
                <p>새로운 문의가 등록되면 여기에 표시됩니다.</p>
            </div>
        `;
        return;
    }

    inquiriesList.innerHTML = inquiries.map(inquiry => `
        <div class="inquiry-card" data-id="${inquiry.id}">
            <div class="inquiry-header">
                <div class="inquiry-info">
                    <div class="inquiry-name">${escapeHtml(inquiry.name)}</div>
                    <div class="inquiry-phone">${escapeHtml(inquiry.phone1)}-${escapeHtml(inquiry.phone2)}-${escapeHtml(inquiry.phone3)}</div>
                </div>
                <div class="inquiry-status ${inquiry.status}">
                    ${getStatusText(inquiry.status)}
                </div>
            </div>
            <div class="inquiry-details">
                <div class="detail-item">
                    <span class="detail-label">차량명</span>
                    <span class="detail-value">${escapeHtml(inquiry.car_name || '-')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">렌트/리스</span>
                    <span class="detail-value">${escapeHtml(inquiry.rent_type)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">개월수</span>
                    <span class="detail-value">${escapeHtml(inquiry.months)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">사업자구분</span>
                    <span class="detail-value">${escapeHtml(inquiry.business_type)}</span>
                </div>
            </div>
            <div class="inquiry-footer">
                <div class="inquiry-date">${formatDate(inquiry.created_at)}</div>
                <div class="inquiry-actions">
                    <select class="status-select action-btn status-btn" onchange="updateStatus(${inquiry.id}, this.value)">
                        <option value="pending" ${inquiry.status === 'pending' ? 'selected' : ''}>대기중</option>
                        <option value="contacted" ${inquiry.status === 'contacted' ? 'selected' : ''}>연락완료</option>
                        <option value="completed" ${inquiry.status === 'completed' ? 'selected' : ''}>처리완료</option>
                    </select>
                    <button class="action-btn delete-btn" onclick="deleteInquiry(${inquiry.id})">삭제</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 상태 텍스트 변환
function getStatusText(status) {
    const statusMap = {
        pending: '대기중',
        contacted: '연락완료',
        completed: '처리완료'
    };
    return statusMap[status] || status;
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 상태 업데이트
async function updateStatus(id, status) {
    try {
        const response = await fetch(API_BASE, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, status }),
        });

        const result = await response.json();

        if (result.success) {
            loadInquiries(currentStatus);
        } else {
            alert('상태 업데이트에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('상태 업데이트에 실패했습니다.');
    }
}

// 문의 삭제
async function deleteInquiry(id) {
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}?id=${id}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            loadInquiries(currentStatus);
        } else {
            alert('삭제에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        alert('삭제에 실패했습니다.');
    }
}

// 카운트 업데이트
async function updateCounts(inquiries) {
    const counts = {
        all: 0,
        pending: 0,
        contacted: 0,
        completed: 0
    };

    // 전체 문의 목록 가져오기
    try {
        const response = await fetch(API_BASE);
        const result = await response.json();
        const allInquiries = result.data || [];
        
        counts.all = allInquiries.length;
        
        allInquiries.forEach(inquiry => {
            if (counts.hasOwnProperty(inquiry.status)) {
                counts[inquiry.status]++;
            }
        });
    } catch (error) {
        console.error('Error loading counts:', error);
    }

    document.getElementById('countAll').textContent = counts.all;
    document.getElementById('countPending').textContent = counts.pending;
    document.getElementById('countContacted').textContent = counts.contacted;
    document.getElementById('countCompleted').textContent = counts.completed;
}

// 로딩 표시
function showLoading() {
    loading.classList.remove('hidden');
    inquiriesList.innerHTML = '';
    inquiriesList.appendChild(loading);
}

// 로딩 숨김
function hideLoading() {
    loading.classList.add('hidden');
}

// 에러 표시
function showError(message) {
    inquiriesList.innerHTML = `
        <div class="empty-state">
            <h3>오류 발생</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// 전역 함수로 export (HTML에서 직접 호출하기 위해)
window.updateStatus = updateStatus;
window.deleteInquiry = deleteInquiry;
