/**
 * AnimationController - BACKUP: Random Direction Rotation System
 * 백업된 무작위 방향 3D 축 회전 시스템 (원래 마우스 지글러 방식)
 * 날짜: 2025-09-11
 */
class AnimationController_RandomRotation_Backup {
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
     * 새로운 회전축 설정 (무작위 방향 회전)
     */
    setFixedDirection() {
        // 랜덤한 3D 축 생성 (정규화된 벡터)
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        const z = (Math.random() - 0.5) * 2;
        
        this.mouseJiggler.rotationAxis = new THREE.Vector3(x, y, z).normalize();
        this.mouseJiggler.rotationAngle = 0; // 회전 각도 초기화
        this.mouseJiggler.lockDirection = true;
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
     * 축 기반 구 회전 업데이트
     */
    updateSphereRotation() {
        if (this.mouseJiggler.gridSphere) {
            // 회전 행렬 생성
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationAxis(this.mouseJiggler.rotationAxis, this.mouseJiggler.rotationAngle);
            
            // 구에 회전 적용
            this.mouseJiggler.gridSphere.rotation.setFromRotationMatrix(rotationMatrix);
        }
    }
    
    /**
     * 카메라 궁도 운동 업데이트 (구 밖에서 가까운 거리)
     */
    updateCameraOrbit() {
        const distance = this.mouseJiggler.cameraDistance;
        
        // 구면 좌표계로 카메라 위치 계산
        const x = distance * Math.cos(this.mouseJiggler.theta) * Math.cos(this.mouseJiggler.phi);
        const y = distance * Math.sin(this.mouseJiggler.theta);
        const z = distance * Math.cos(this.mouseJiggler.theta) * Math.sin(this.mouseJiggler.phi);
        
        // 카메라 위치 업데이트
        this.mouseJiggler.camera.position.set(x, y, z);
        
        // 항상 구의 중심을 보도록 설정
        this.mouseJiggler.camera.lookAt(0, 0, 0);
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
// window.AnimationController_RandomRotation_Backup = AnimationController_RandomRotation_Backup;