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
     * Wake Lock 요청
     */
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.mouseJiggler.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock acquired');
            } else {
                console.log('Wake Lock API not supported');
            }
        } catch (err) {
            console.error('Wake Lock request failed:', err);
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