// API 기본 URL
const API_BASE = '/api/inquiries';

// 현재 선택된 상태 (항상 전체)
let currentStatus = 'all';

// DOM 요소
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
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
        loadInquiries('all');
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
        <div class="inquiry-card" data-id="${inquiry.id}" data-original-memo="${escapeHtml(inquiry.memo || '')}">
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
            <div class="inquiry-memo">
                <div class="memo-label">
                    <span>메모</span>
                    <button class="memo-edit-btn" onclick="toggleMemoEdit(${inquiry.id})" data-id="${inquiry.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
                <div class="memo-display" id="memo-display-${inquiry.id}">
                    ${inquiry.memo ? escapeHtml(inquiry.memo).replace(/\n/g, '<br>') : '<span class="memo-placeholder">메모를 입력하세요.</span>'}
                </div>
                <div class="memo-edit" id="memo-edit-${inquiry.id}" style="display: none;">
                    <textarea class="memo-textarea" id="memo-textarea-${inquiry.id}" placeholder="메모를 입력하세요.">${escapeHtml(inquiry.memo || '')}</textarea>
                    <div class="memo-actions">
                        <button class="memo-save-btn" onclick="saveMemo(${inquiry.id})">저장</button>
                        <button class="memo-cancel-btn" onclick="cancelMemoEdit(${inquiry.id})">취소</button>
                    </div>
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

// 메모 편집 모드 토글
function toggleMemoEdit(id) {
    const displayEl = document.getElementById(`memo-display-${id}`);
    const editEl = document.getElementById(`memo-edit-${id}`);
    const textarea = document.getElementById(`memo-textarea-${id}`);
    
    if (!displayEl || !editEl || !textarea) {
        console.error('Memo elements not found for id:', id);
        return;
    }
    
    // 원본 메모 저장
    const card = document.querySelector(`.inquiry-card[data-id="${id}"]`);
    if (card && !card.dataset.originalMemo) {
        card.dataset.originalMemo = textarea.value;
    }
    
    if (editEl.style.display === 'none' || editEl.style.display === '') {
        displayEl.style.display = 'none';
        editEl.style.display = 'block';
        textarea.focus();
    } else {
        displayEl.style.display = 'block';
        editEl.style.display = 'none';
    }
}

// 메모 편집 취소
function cancelMemoEdit(id) {
    const displayEl = document.getElementById(`memo-display-${id}`);
    const editEl = document.getElementById(`memo-edit-${id}`);
    const textarea = document.getElementById(`memo-textarea-${id}`);
    
    if (!displayEl || !editEl || !textarea) {
        console.error('Memo elements not found for id:', id);
        return;
    }
    
    // 원래 값으로 복원 (카드에서 데이터 가져오기)
    const card = document.querySelector(`.inquiry-card[data-id="${id}"]`);
    if (card) {
        const originalMemo = card.dataset.originalMemo || '';
        textarea.value = originalMemo;
    }
    
    displayEl.style.display = 'block';
    editEl.style.display = 'none';
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
            // 메모 표시 업데이트
            const displayEl = document.getElementById(`memo-display-${id}`);
            const editEl = document.getElementById(`memo-edit-${id}`);
            
            if (!displayEl || !editEl) {
                console.error('Display or edit element not found for id:', id);
                return;
            }
            
            if (memo) {
                displayEl.innerHTML = escapeHtml(memo).replace(/\n/g, '<br>');
            } else {
                displayEl.innerHTML = '<span class="memo-placeholder">메모를 입력하세요.</span>';
            }
            
            // 원본 메모 저장
            const card = document.querySelector(`.inquiry-card[data-id="${id}"]`);
            if (card) {
                card.dataset.originalMemo = memo;
            }
            
            displayEl.style.display = 'block';
            editEl.style.display = 'none';
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
window.toggleMemoEdit = toggleMemoEdit;
window.cancelMemoEdit = cancelMemoEdit;
window.saveMemo = saveMemo;