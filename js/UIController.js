/**
 * UIController - UI 상태 관리 및 업데이트 담당 컴포넌트
 * 프로그레스 바, 상태 표시, 사용자 인터페이스 제어
 */
class UIController {
    constructor(mouseJiggler) {
        this.mouseJiggler = mouseJiggler;
        this.initControls();
    }

    /**
     * 컨트롤 초기화
     */
    initControls() {
        // 속도 선택 이벤트
        const speedSelect = document.getElementById('speedSelect');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.mouseJiggler.currentSpeed = e.target.value;
                console.log('Speed changed to:', e.target.value);
                
                // 실행 중이면 설정 업데이트
                if (this.mouseJiggler.isRunning) {
                    this.mouseJiggler.animationController.updateSpeedSettings();
                }
            });
        }

        // 간격 선택 이벤트
        const intervalSelect = document.getElementById('intervalSelect');
        if (intervalSelect) {
            intervalSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value === 'continuous') {
                    this.mouseJiggler.currentInterval = 0; // 연속 모드
                } else {
                    this.mouseJiggler.currentInterval = parseInt(value);
                }
                console.log('Interval changed to:', this.mouseJiggler.currentInterval);
                
                // 실행 중이면 완전히 중지 후 새로 시작
                if (this.mouseJiggler.isRunning) {
                    this.mouseJiggler.stop();
                    setTimeout(() => {
                        this.mouseJiggler.start();
                    }, 100);
                }
            });
        }
    }

    /**
     * 상태 업데이트
     */
    updateStatus(text, active = false) {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusDot) {
            statusDot.className = active ? 'status-dot active' : 'status-dot waiting';
        }
    }

    /**
     * 프로그레스 업데이트
     */
    updateProgress(progress, label, timeText, isActive = false) {
        const progressFill = document.getElementById('progressFill');
        const progressLabel = document.getElementById('progressLabel');
        const progressTime = document.getElementById('progressTime');
        
        if (progressFill) {
            progressFill.style.width = (progress * 100) + '%';
            // 회전 중일 때는 초록색(active), 대기 중일 때는 빨간색(waiting)
            progressFill.className = isActive ? 'progress-fill active' : 'progress-fill waiting';
        }
        
        if (progressLabel) {
            progressLabel.textContent = label;
        }
        
        if (progressTime) {
            progressTime.textContent = timeText;
        }
    }

    /**
     * 시간 포맷팅
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Wake Lock 요청 (사용자 상호작용 후)
     */
    async requestWakeLock() {
        try {
            // Wake Lock API 지원 여부 상세 체크
            if (!('wakeLock' in navigator)) {
                console.log('❌ Wake Lock API not supported in this browser');
                this.showFallbackMessage('API_NOT_SUPPORTED');
                return;
            }

            // HTTPS 체크
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                console.log('❌ Wake Lock requires HTTPS or localhost');
                this.showFallbackMessage('HTTPS_REQUIRED');
                return;
            }

            // 문서가 숨겨져 있는지 체크
            if (document.hidden) {
                console.log('⚠️ Document is hidden, Wake Lock may fail');
            }

            this.mouseJiggler.wakeLock = await navigator.wakeLock.request('screen');
            console.log('✅ Screen Wake Lock acquired successfully');
            
            // 성공 시 경고 메시지 숨기기
            this.hideFallbackMessage();
            
            // Wake Lock이 해제되었을 때의 처리
            this.mouseJiggler.wakeLock.addEventListener('release', () => {
                console.log('⚠️ Wake Lock released');
                if (this.mouseJiggler.isRunning) {
                    console.log('🔄 Attempting to reacquire Wake Lock...');
                    setTimeout(() => this.requestWakeLock(), 1000);
                }
            });
            
        } catch (err) {
            console.error('❌ Wake Lock request failed:', err.name, err.message);
            
            // 에러 유형별 처리
            if (err.name === 'NotAllowedError') {
                this.showFallbackMessage('PERMISSION_DENIED');
            } else if (err.name === 'AbortError') {
                this.showFallbackMessage('ABORTED');
            } else {
                this.showFallbackMessage('GENERAL_ERROR', err.message);
            }
        }
    }
    
    /**
     * Wake Lock 대체 안내 메시지
     */
    showFallbackMessage(errorType, errorMessage = '') {
        const wakeLockInfo = document.getElementById('wakeLockInfo');
        if (!wakeLockInfo) return;

        let message = '';
        
        switch (errorType) {
            case 'API_NOT_SUPPORTED':
                message = '⚠️ 이 브라우저는 화면 절전 방지를 지원하지 않습니다.';
                break;
            case 'HTTPS_REQUIRED':
                message = '🔒 HTTPS 연결이 필요합니다. 로컬 서버나 HTTPS 사이트에서 사용하세요.';
                break;
            case 'PERMISSION_DENIED':
                message = '❌ 권한이 거부되었습니다. 브라우저 설정을 확인하거나 페이지를 새로고침하세요.';
                break;
            case 'ABORTED':
                message = '⏸️ Wake Lock이 중단되었습니다. 다른 앱이나 시스템 설정 때문일 수 있습니다.';
                break;
            default:
                message = `💡 화면 절전 방지가 지원되지 않습니다. Chrome/Edge 사용을 권장합니다.`;
        }
        
        wakeLockInfo.textContent = message;
        wakeLockInfo.classList.add('show');
        
        // 콘솔에 상세 정보
        console.log(`
🔋 Wake Lock 문제: ${errorType}
📱 대안:
   • 화면 밝기를 최대로 설정
   • 화면 시간 초과를 늘림 (설정 > 디스플레이)
   • Chrome/Edge 브라우저 사용
   • HTTPS 사이트에서 실행
${errorMessage ? `\n상세 오류: ${errorMessage}` : ''}
        `);
    }
    
    /**
     * Wake Lock 메시지 숨기기
     */
    hideFallbackMessage() {
        const wakeLockInfo = document.getElementById('wakeLockInfo');
        if (wakeLockInfo) {
            wakeLockInfo.classList.remove('show');
        }
    }

    /**
     * Wake Lock 해제
     */
    releaseWakeLock() {
        if (this.mouseJiggler.wakeLock) {
            this.mouseJiggler.wakeLock.release();
            this.mouseJiggler.wakeLock = null;
            console.log('Screen Wake Lock released');
        }
    }

}

// 전역으로 노출
window.UIController = UIController;