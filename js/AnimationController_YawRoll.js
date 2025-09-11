/**
 * AnimationController - BACKUP: Yaw/Roll Rotation System
 * 백업된 Y축 yaw 회전 + 카메라 Z축 roll 회전 시스템
 * 날짜: 2025-09-11
 */
class AnimationController_YawRoll_Backup {
    constructor(mouseJiggler) {
        this.mouseJiggler = mouseJiggler;
        this.gridRenderer = new GridRenderer(mouseJiggler);
    }

    /**
     * 격자 생성 (GridRenderer 위임)
     */
    createGrid() {
        this.gridRenderer.createGrid();
    }

    /**
     * 방향 업데이트
     */
    updateDirection() {
        // 방향이 고정된 경우 업데이트 건너뛰기
        if (this.mouseJiggler.lockDirection) {
            return;
        }
        
        this.mouseJiggler.directionChangeTimer++;
        
        if (this.mouseJiggler.directionChangeTimer >= this.mouseJiggler.directionChangeInterval) {
            this.mouseJiggler.targetDirection = Math.random() * Math.PI * 2;
            this.mouseJiggler.directionChangeTimer = 0;
            this.mouseJiggler.directionChangeInterval = 80 + Math.random() * 120;
        }
        
        // 부드러운 방향 전환
        let angleDiff = this.mouseJiggler.targetDirection - this.mouseJiggler.direction;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.mouseJiggler.direction += angleDiff * this.mouseJiggler.directionChangeRate;
    }
    
    /**
     * Y축 회전 설정 (yaw)
     */
    setFixedDirection() {
        // Y축 회전 설정
        this.mouseJiggler.rotationAngle = 0;
        this.mouseJiggler.lockDirection = true;
        this.mouseJiggler.isRolling = false;
        
        // 구 회전 초기화 (카메라 롤링을 위해 구는 단순하게)
        if (this.mouseJiggler.gridSphere) {
            this.mouseJiggler.gridSphere.rotation.set(0, 0, 0);
        }
        
        // 카메라 롤 각도 초기화
        if (!this.mouseJiggler.cameraRoll) {
            this.mouseJiggler.cameraRoll = 0;
        }
    }
    
    /**
     * 1초 동안 카메라 Z축 roll 회전 시작
     */
    startRollTransition() {
        if (!this.mouseJiggler.camera) return;
        
        this.mouseJiggler.isRolling = true;
        const startRoll = this.mouseJiggler.cameraRoll || 0;
        const targetRoll = startRoll + (Math.random() * Math.PI * 2); // 랜덤 추가 회전
        const duration = 1000; // 1초
        const startTime = Date.now();
        
        const rollAnimation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 부드러운 전환 (easeInOut)
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // 카메라 롤 각도 보간
            const currentRoll = startRoll + (targetRoll - startRoll) * easeProgress;
            this.mouseJiggler.cameraRoll = currentRoll;
            
            // 카메라 롤 적용
            this.applyCameraRoll();
            
            // 렌더링
            this.mouseJiggler.renderer.render(this.mouseJiggler.scene, this.mouseJiggler.camera);
            
            if (progress < 1) {
                requestAnimationFrame(rollAnimation);
            } else {
                // Roll 완료
                this.mouseJiggler.isRolling = false;
                this.mouseJiggler.cameraRoll = targetRoll;
            }
        };
        
        rollAnimation();
    }
    
    /**
     * 카메라에 Z축 롤 회전 적용
     */
    applyCameraRoll() {
        if (this.mouseJiggler.camera && this.mouseJiggler.cameraRoll !== undefined) {
            // 카메라 Z축 롤 회전 설정
            this.mouseJiggler.camera.rotation.z = this.mouseJiggler.cameraRoll;
        }
    }
    
    
    /**
     * 방향 고정 해제
     */
    unlockDirection() {
        this.mouseJiggler.lockDirection = false;
    }

    /**
     * 위치 업데이트 (축 기반 회전)
     */
    updatePosition() {
        if (!this.mouseJiggler.isRunning) return;
        
        // 축 기반 회전 시스템
        if (this.mouseJiggler.lockDirection) {
            // 설정된 축을 기준으로 회전
            this.mouseJiggler.rotationAngle += this.mouseJiggler.rotationSpeed;
            this.updateSphereRotation();
        } else {
            // 기존 카메라 궁도 시스템 (대기 상태에서는 사용 안함)
            this.updateDirection();
            
            // 구면 좌표계에서의 운동 속도 계산
            const targetVelPhi = Math.cos(this.mouseJiggler.direction) * this.mouseJiggler.walkSpeed;
            const targetVelTheta = Math.sin(this.mouseJiggler.direction) * this.mouseJiggler.walkSpeed;
            
            // 관성 적용
            this.mouseJiggler.velocityX = this.mouseJiggler.velocityX * this.mouseJiggler.momentum + targetVelPhi * (1 - this.mouseJiggler.momentum);
            this.mouseJiggler.velocityY = this.mouseJiggler.velocityY * this.mouseJiggler.momentum + targetVelTheta * (1 - this.mouseJiggler.momentum);
            
            // 랜덤 노이즈
            this.mouseJiggler.velocityX += (Math.random() - 0.5) * this.mouseJiggler.randomNoise;
            this.mouseJiggler.velocityY += (Math.random() - 0.5) * this.mouseJiggler.randomNoise;
            
            // 카메라 궁도 각도 업데이트
            this.mouseJiggler.phi = (this.mouseJiggler.phi || 0) + this.mouseJiggler.velocityX;
            this.mouseJiggler.theta = (this.mouseJiggler.theta || 0) + this.mouseJiggler.velocityY;
            
            // theta 범위 제한 (위아래 각도 제한 - 더 넓은 범위)
            this.mouseJiggler.theta = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.mouseJiggler.theta)); // 더 넓은 수직 움직임
            
            this.updateCameraOrbit();
        }
    }
    
    
    /**
     * Y축(yaw) 회전 업데이트 (구만 회전)
     */
    updateSphereRotation() {
        if (this.mouseJiggler.gridSphere && !this.mouseJiggler.isRolling) {
            // 구는 Y축만 회전
            this.mouseJiggler.gridSphere.rotation.set(
                0, // X축 0
                this.mouseJiggler.rotationAngle, // Y축 yaw 회전
                0  // Z축 0
            );
        }
        
        // 롤링 중이 아니면 카메라 롤 적용
        if (!this.mouseJiggler.isRolling) {
            this.applyCameraRoll();
        }
    }
    
    /**
     * 카메라 적도 영역 고정 - Y=0 주변만 보임
     */
    updateCameraOrbit() {
        const distance = this.mouseJiggler.cameraDistance;
        
        // 카메라 고정 위치 (적도 영역)
        this.mouseJiggler.camera.position.set(distance, 0, 0);
        
        // 구의 중심을 보도록 설정
        this.mouseJiggler.camera.lookAt(0, 0, 0);
        
        // 카메라 롤 적용
        this.applyCameraRoll();
    }

    /**
     * 메인 애니메이션 루프
     */
    animate() {
        if (this.mouseJiggler.isRunning) {
            this.mouseJiggler.animationId = requestAnimationFrame(() => this.animate());
            this.updatePosition();
            this.mouseJiggler.renderer.render(this.mouseJiggler.scene, this.mouseJiggler.camera);
        }
    }
    
    /**
     * 사이클 간 위치 유지를 위한 애니메이션 재시작
     */
    resumeFromCurrentPosition() {
        // 현재 위치에서 다시 시작
        // 별도 초기화 없이 바로 애니메이션 시작
        this.animate();
    }

    /**
     * 속도 설정 업데이트
     */
    updateSpeedSettings() {
        const speedMultipliers = {
            'slow': { speed: 0.25, momentum: 0.99, rate: 0.005, noise: 0.0005, rotation: 0.01 },
            'normal': { speed: 0.5, momentum: 0.98, rate: 0.01, noise: 0.001, rotation: 0.02 },
            'fast': { speed: 1, momentum: 0.96, rate: 0.025, noise: 0.003, rotation: 0.05 },
            'ultrafast': { speed: 2, momentum: 0.94, rate: 0.04, noise: 0.005, rotation: 0.08 }
        };
        
        const multiplier = speedMultipliers[this.mouseJiggler.currentSpeed] || speedMultipliers['normal'];
        this.mouseJiggler.walkSpeed = this.mouseJiggler.baseWalkSpeed * multiplier.speed;
        this.mouseJiggler.momentum = multiplier.momentum;
        this.mouseJiggler.directionChangeRate = multiplier.rate;
        this.mouseJiggler.randomNoise = multiplier.noise;
        this.mouseJiggler.rotationSpeed = multiplier.rotation;
    }

    /**
     * 애니메이션 중지 (현재 위치 유지)
     */
    stopAnimation() {
        if (this.mouseJiggler.animationId) {
            cancelAnimationFrame(this.mouseJiggler.animationId);
            this.mouseJiggler.animationId = null;
        }
        
        if (this.mouseJiggler.animationTimer) {
            clearTimeout(this.mouseJiggler.animationTimer);
            this.mouseJiggler.animationTimer = null;
        }
        
        // 위치 초기화 없이 현재 위치에서 멈춤
        // 마지막 프레임 렌더링만 수행
        this.mouseJiggler.renderer.render(this.mouseJiggler.scene, this.mouseJiggler.camera);
    }
}

// 백업용 - 직접 노출하지 않음
// window.AnimationController_YawRoll_Backup = AnimationController_YawRoll_Backup;