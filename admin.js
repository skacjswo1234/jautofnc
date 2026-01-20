// API 기본 URL
const API_BASE = '/api/inquiries';

// 페이징 설정
const ITEMS_PER_PAGE = 100;
let currentPage = 1;
let totalItems = 0;
let allInquiries = [];

// DOM 요소
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
const inquiriesList = document.getElementById('inquiriesList');
const tableWrapper = document.getElementById('tableWrapper');
const inquiriesTable = document.getElementById('inquiriesTable');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const contentTitle = document.getElementById('contentTitle');
const pagination = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// 상태별 제목 매핑
const statusTitles = {
    all: '전체 문의',
    pending: '대기중 문의',
    contacted: '연락완료 문의',
    completed: '처리완료 문의'
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 로그인 체크
    if (!localStorage.getItem('admin_logged_in')) {
        window.location.href = '/login.html';
        return;
    }
    
    initEventListeners();
    loadInquiries('all');
    contentTitle.textContent = '문의 리스트';
});

// 이벤트 리스너 초기화
function initEventListeners() {
    // 모바일 메뉴 버튼
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // 모바일 오버레이 클릭
    mobileOverlay.addEventListener('click', closeMobileMenu);

    // 새로고침 버튼
    refreshBtn.addEventListener('click', () => {
        currentPage = 1;
        loadInquiries('all');
    });

    // 페이징 버튼
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPage();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            displayPage();
        }
    });

    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('admin_logged_in');
                window.location.href = '/login.html';
            }
        });
    }
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
            allInquiries = result.data || [];
            totalItems = allInquiries.length;
            currentPage = 1;
            displayPage();
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

// 현재 페이지 표시
function displayPage() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = allInquiries.slice(startIndex, endIndex);
    
    displayInquiries(pageData);
    updatePagination();
}

// 페이징 정보 업데이트
function updatePagination() {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalItems === 0) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    pageInfo.textContent = `${currentPage} / ${totalPages} (총 ${totalItems}건)`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// 문의 목록 표시 (테이블 형식)
function displayInquiries(inquiries) {
    if (inquiries.length === 0 && totalItems === 0) {
        tableWrapper.style.display = 'none';
        pagination.style.display = 'none';
        inquiriesList.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    
    inquiriesList.innerHTML = inquiries.map((inquiry, index) => `
        <tr data-id="${inquiry.id}" data-original-memo="${escapeHtml(inquiry.memo || '')}">
            <td>${startIndex + index + 1}</td>
            <td>${escapeHtml(inquiry.name)}</td>
            <td>${escapeHtml(inquiry.phone1)}-${escapeHtml(inquiry.phone2)}-${escapeHtml(inquiry.phone3)}</td>
            <td>${escapeHtml(inquiry.car_name || '-')}</td>
            <td>${escapeHtml(inquiry.rent_type)}</td>
            <td>${escapeHtml(inquiry.months)}</td>
            <td>${escapeHtml(inquiry.business_type)}</td>
            <td>
                <span class="inquiry-status ${inquiry.status}">${getStatusText(inquiry.status)}</span>
            </td>
            <td>${formatDate(inquiry.created_at)}</td>
            <td>
                <button class="memo-btn ${inquiry.memo ? 'has-memo' : ''}" onclick="toggleMemoEdit(${inquiry.id})" title="메모">
                    ${inquiry.memo ? '📝' : '+'}
                </button>
            </td>
            <td>
                <div class="table-actions-modern">
                    <div class="status-chips">
                        <button class="status-chip ${inquiry.status === 'pending' ? 'active' : ''}" data-status="pending" onclick="updateStatus(${inquiry.id}, 'pending')">대기</button>
                        <button class="status-chip ${inquiry.status === 'contacted' ? 'active' : ''}" data-status="contacted" onclick="updateStatus(${inquiry.id}, 'contacted')">연락</button>
                        <button class="status-chip ${inquiry.status === 'completed' ? 'active' : ''}" data-status="completed" onclick="updateStatus(${inquiry.id}, 'completed')">완료</button>
                    </div>
                    <button class="delete-btn-modern" onclick="deleteInquiry(${inquiry.id})" title="삭제">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableWrapper.style.display = 'block';
    
    // 메모 편집 모달 추가
    addMemoModals(inquiries);
}

// 메모 편집 모달 추가
function addMemoModals(inquiries) {
    const existingModals = document.querySelectorAll('.memo-modal');
    existingModals.forEach(modal => modal.remove());
    
    inquiries.forEach(inquiry => {
        const modal = document.createElement('div');
        modal.className = 'memo-modal';
        modal.id = `memo-modal-${inquiry.id}`;
        modal.innerHTML = `
            <div class="memo-modal-content">
                <div class="memo-modal-header">
                    <h3>메모 편집</h3>
                    <button class="memo-modal-close" onclick="closeMemoModal(${inquiry.id})">&times;</button>
                </div>
                <div class="memo-modal-body">
                    <textarea class="memo-textarea" id="memo-textarea-${inquiry.id}" placeholder="메모를 입력하세요.">${escapeHtml(inquiry.memo || '')}</textarea>
                </div>
                <div class="memo-modal-footer">
                    <button class="memo-save-btn" onclick="saveMemo(${inquiry.id})">저장</button>
                    <button class="memo-cancel-btn" onclick="closeMemoModal(${inquiry.id})">취소</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    });
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

// 날짜 포맷팅 (한국 시간 기준)
function formatDate(dateString) {
    // 데이터베이스에 저장된 날짜 문자열을 파싱
    // 형식: "YYYY-MM-DD HH:MM:SS" 또는 ISO 형식
    let date;
    
    if (dateString.includes('T')) {
        // ISO 형식인 경우 (예: "2024-01-01T12:00:00Z")
        // 데이터베이스에 한국 시간으로 저장되었으므로, UTC로 해석하지 않고 로컬로 파싱
        const dateStr = dateString.replace('Z', '').replace('T', ' ');
        const [datePart, timePart] = dateStr.split(' ');
        const [y, m, d] = datePart.split('-');
        const [h, min, sec] = timePart.split(':');
        date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(sec || 0));
    } else {
        // "YYYY-MM-DD HH:MM:SS" 형식인 경우
        const [datePart, timePart] = dateString.split(' ');
        const [y, m, d] = datePart.split('-');
        const [h, min, sec] = (timePart || '').split(':');
        date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h || 0), parseInt(min || 0), parseInt(sec || 0));
    }
    
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
            loadInquiries('all');
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
            loadInquiries('all');
        } else {
            alert('삭제에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        alert('삭제에 실패했습니다.');
    }
}

// 메모 편집 모드 토글 (모달 열기)
function toggleMemoEdit(id) {
    const modal = document.getElementById(`memo-modal-${id}`);
    if (modal) {
        modal.classList.add('active');
        const textarea = document.getElementById(`memo-textarea-${id}`);
        if (textarea) {
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row && !row.dataset.originalMemo) {
                row.dataset.originalMemo = textarea.value;
            }
            setTimeout(() => textarea.focus(), 100);
        }
    }
}

// 메모 모달 닫기
function closeMemoModal(id) {
    const modal = document.getElementById(`memo-modal-${id}`);
    if (modal) {
        const textarea = document.getElementById(`memo-textarea-${id}`);
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row && textarea) {
            const originalMemo = row.dataset.originalMemo || '';
            textarea.value = originalMemo;
        }
        modal.classList.remove('active');
    }
}

// 메모 저장
async function saveMemo(id) {
    const textarea = document.getElementById(`memo-textarea-${id}`);
    if (!textarea) {
        console.error('Textarea not found for id:', id);
        return;
    }
    
    const memo = textarea.value.trim();
    
    try {
        const response = await fetch(API_BASE, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, memo }),
        });

        const result = await response.json();

        if (result.success) {
            // 전체 데이터 업데이트
            const inquiryIndex = allInquiries.findIndex(inq => inq.id === id);
            if (inquiryIndex !== -1) {
                allInquiries[inquiryIndex].memo = memo;
            }
            
            // 현재 페이지 다시 표시
            displayPage();
            
            // 모달 닫기
            closeMemoModal(id);
        } else {
            alert('메모 저장에 실패했습니다: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving memo:', error);
        alert('메모 저장에 실패했습니다.');
    }
}

// 로딩 표시
function showLoading() {
    loading.style.display = 'flex';
    tableWrapper.style.display = 'none';
    pagination.style.display = 'none';
}

// 로딩 숨김
function hideLoading() {
    loading.style.display = 'none';
}

// 에러 표시
function showError(message) {
    loading.style.display = 'none';
    tableWrapper.style.display = 'block';
    inquiriesList.innerHTML = `
        <tr>
            <td colspan="11" style="text-align: center; padding: 40px 20px; color: #ff4444;">
                <h3>오류 발생</h3>
                <p>${escapeHtml(message)}</p>
            </td>
        </tr>
    `;
    pagination.style.display = 'none';
}

// 전역 함수로 export (HTML에서 직접 호출하기 위해)
window.updateStatus = updateStatus;
window.deleteInquiry = deleteInquiry;
window.toggleMemoEdit = toggleMemoEdit;
window.closeMemoModal = closeMemoModal;
window.saveMemo = saveMemo;