/**
 * TimingManager - 30초 고정 사이클 내 포아송 분포 활동 관리
 * 고정된 30초 주기 내에서 포아송 분포로 활동/대기 영역 관리
 */
class TimingManager {
    constructor(mouseJiggler) {
        this.mouseJiggler = mouseJiggler;
        this.currentCycle = null;
        this.currentActivityIndex = 0;
        this.cycleTimer = null;
        this.activityTimer = null;
    }

    /**
     * 간격 설정에 따른 사이클 스케줄 생성
     */
    generateCycleSchedule() {
        const interval = this.mouseJiggler.currentInterval;
        
        if (interval === 0) {
            // 연속 모드: 30초 내에서 랜덤한 시간 동안 한 방향으로 회전
            const rotationDuration = this.generateNormalRandom(8, 4, 3, 15); // 3~15초 범위, 평균 8초
            
            return {
                totalDuration: rotationDuration,
                activities: [{
                    start: 0,
                    end: rotationDuration,
                    duration: rotationDuration
                }]
            };
        } else {
            // 간격 모드: 10초 또는 30초
            const totalCycleDuration = interval;
            
            // 정규분포로 회전 지속 시간 결정
            const meanDuration = interval * 0.5; // 평균 50%
            const stdDev = interval * 0.1; // 표준편차 10%
            const rotationDuration = this.generateNormalRandom(
                meanDuration, 
                stdDev, 
                interval * 0.2, // 최소 20%
                interval * 0.8  // 최대 80%
            );
            
            // 바로 시작하는 활동 패턴: 회전(d) -> 멈춤(interval-d)
            const activity = {
                start: 0, // 즉시 시작
                end: rotationDuration,
                duration: rotationDuration
            };
            
            return {
                totalDuration: totalCycleDuration,
                activities: [activity] // 단일 활동, 즉시 시작
            };
        }
    }
    
    /**
     * 정규분포 랜덤 값 생성 (Box-Muller 변환)
     */
    generateNormalRandom(mean, stdDev, min, max) {
        let u1 = 0, u2 = 0;
        while(u1 === 0) u1 = Math.random(); // 0 방지
        while(u2 === 0) u2 = Math.random(); // 0 방지
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const result = z0 * stdDev + mean;
        
        // 범위 제한
        return Math.max(min, Math.min(max, result));
    }

    /**
     * 간격 사이클 시작 (설정된 간격에 따라)
     */
    startIntervalCycle() {
        this.mouseJiggler.cycleStartTime = Date.now();
        this.currentCycle = this.generateCycleSchedule();
        this.mouseJiggler.totalInterval = this.currentCycle.totalDuration;
        this.currentActivityIndex = 0;
        
        // 사이클 전체를 위한 회전축 설정 (한 번만)
        this.mouseJiggler.animationController.setFixedDirection();
        
        // 프로그레스 바에 활동 구간 표시
        this.displayActivityZones();
        
        // 초기 상태 설정
        this.mouseJiggler.updateStatus('대기 중', false);
        
        // 사이클 내 활동 시작
        this.scheduleNextActivity();
        
        // 다음 사이클 타이머 설정
        const interval = this.mouseJiggler.currentInterval;
        if (interval > 0) {
            // 간격 모드: 설정된 시간 후 다음 사이클
            this.cycleTimer = setTimeout(() => {
                if (this.mouseJiggler.isRunning) {
                    this.startIntervalCycle();
                }
            }, interval * 1000);
        } else {
            // 연속 모드: 현재 사이클 시간이 끝나면 새 사이클 (새 방향)
            this.cycleTimer = setTimeout(() => {
                if (this.mouseJiggler.isRunning) {
                    this.startIntervalCycle();
                }
            }, this.currentCycle.totalDuration * 1000);
        }
    }
    
    /**
     * 프로그레스 바에 활동 구간과 시간 마커 표시
     */
    displayActivityZones() {
        const progressZones = document.getElementById('progressZones');
        if (!progressZones || !this.currentCycle) return;
        
        // 기존 구간 제거
        progressZones.innerHTML = '';
        
        // 각 활동 구간을 시각적으로 표시
        this.currentCycle.activities.forEach((activity, index) => {
            const zone = document.createElement('div');
            zone.className = 'activity-zone';
            
            const startPercent = (activity.start / this.currentCycle.totalDuration) * 100;
            const widthPercent = (activity.duration / this.currentCycle.totalDuration) * 100;
            
            zone.style.left = `${startPercent}%`;
            zone.style.width = `${widthPercent}%`;
            
            progressZones.appendChild(zone);
            
            // 활동 종료 시점에 시간 마커 추가
            const endPercent = (activity.end / this.currentCycle.totalDuration) * 100;
            const timeMarker = document.createElement('div');
            timeMarker.className = 'time-marker';
            timeMarker.style.left = `${endPercent}%`;
            timeMarker.textContent = `${activity.duration.toFixed(1)}s`;
            
            progressZones.appendChild(timeMarker);
        });
        
        // 총 시간 마커 추가
        const endMarker = document.createElement('div');
        endMarker.className = 'time-marker';
        endMarker.style.left = '100%';
        if (this.mouseJiggler.currentInterval === 0) {
            // 연속 모드: 현재 회전 시간 표시
            endMarker.textContent = this.currentCycle.totalDuration.toFixed(1) + 's';
        } else {
            // 간격 모드: 총 간격 시간 표시
            endMarker.textContent = this.mouseJiggler.currentInterval + 's';
        }
        progressZones.appendChild(endMarker);
    }
    
    /**
     * 다음 활동 예약 (즉시 시작)
     */
    scheduleNextActivity() {
        if (!this.currentCycle || this.currentActivityIndex >= this.currentCycle.activities.length) {
            this.mouseJiggler.updateStatus('대기 중', false);
            return;
        }
        
        const activity = this.currentCycle.activities[this.currentActivityIndex];
        
        // 즉시 시작 (딜레이 없음)
        if (this.mouseJiggler.isRunning) {
            this.startActivity(activity);
        }
    }
    
    /**
     * 활동 시작 (즉시 회전 시작)
     */
    startActivity(activity) {
        // 이미 설정된 축으로 애니메이션 시작 (축 재설정 안함)
        this.mouseJiggler.animationController.animate();
        this.mouseJiggler.animationStartTime = Date.now();
        this.mouseJiggler.updateStatus('회전 중', true);
        
        // 회전 종료 예약
        this.activityTimer = setTimeout(() => {
            this.mouseJiggler.animationController.stopAnimation();
            this.mouseJiggler.animationStartTime = 0;
            
            this.mouseJiggler.updateStatus('대기 중', false);
            
            // 더 이상 다음 활동 스케줄링 안함 (한 번만 회전)
            this.currentActivityIndex++;
        }, activity.duration * 1000);
    }

    /**
     * 프로그레스 추적 시작 (설정된 간격에 따라)
     */
    startProgressTracking() {
        if (this.mouseJiggler.progressTimer) {
            clearInterval(this.mouseJiggler.progressTimer);
        }
        
        this.mouseJiggler.progressTimer = setInterval(() => {
            const now = Date.now();
            const cycleElapsed = (now - this.mouseJiggler.cycleStartTime) / 1000;
            
            // 간격에 따른 프로그레스 계산
            const interval = this.mouseJiggler.currentInterval;
            let cycleProgress;
            
            if (interval === 0) {
                // 연속 모드: 현재 회전 시간 기준
                cycleProgress = Math.min(cycleElapsed / this.currentCycle.totalDuration, 1);
            } else {
                // 간격 모드: 설정된 시간 기준
                cycleProgress = Math.min(cycleElapsed / interval, 1);
            }
            
            // 현재 활동 상태 확인
            let statusText = '대기 중';
            let isActive = false;
            
            // 회전 중인지 확인: animationId가 있고 animationStartTime이 설정되어 있으면 회전 중
            if (this.mouseJiggler.animationId && this.mouseJiggler.animationStartTime > 0) {
                const animElapsed = (now - this.mouseJiggler.animationStartTime) / 1000;
                if (interval === 0) {
                    statusText = `연속 모드 - 회전 중 (${this.currentCycle.totalDuration.toFixed(1)}초)`;
                } else {
                    const currentActivity = this.currentCycle.activities[0]; // 첫 번째 활동
                    if (currentActivity && animElapsed <= currentActivity.duration) {
                        const animProgress = Math.min(animElapsed / currentActivity.duration, 1);
                        statusText = `애니메이션 실행 중 (${(animProgress * 100).toFixed(0)}%)`;
                    }
                }
                isActive = true;
            }
            
            this.mouseJiggler.updateProgress(cycleProgress, statusText, this.mouseJiggler.formatTime(cycleElapsed), isActive);
        }, 100);
    }

    
    /**
     * 타이머 정리
     */
    clearTimers() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
        if (this.activityTimer) {
            clearTimeout(this.activityTimer);
            this.activityTimer = null;
        }
    }
}

// 전역으로 노출
window.TimingManager = TimingManager;