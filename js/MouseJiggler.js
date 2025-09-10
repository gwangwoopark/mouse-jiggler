/**
 * MouseJiggler - 메인 클래스
 * 마우스 지글러의 핵심 기능을 담당
 */
class MouseJiggler {
    constructor() {
        // 기본 상태 변수들
        this.isRunning = false;
        this.wakeLock = null;
        this.intervalTimer = null;
        this.animationTimer = null;
        this.progressTimer = null;
        this.currentInterval = 10; // 기본 10초
        this.currentSpeed = 'normal'; // 초고속 기본
        
        // 프로그레스 관리
        this.cycleStartTime = 0;
        this.currentCycleDuration = 0;
        this.animationStartTime = 0;
        this.animationDuration = 0;
        this.totalInterval = 0;
        
        // Three.js 변수들
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gridGroup = null;
        this.animationId = null;
        this.backgroundSphere = null;
        this.gridSphere = null;
        
        // Random Walk 변수들
        this.x = 0;
        this.y = 0;
        this.z = 50; // 카메라 높이
        this.velocityX = 0;
        this.velocityY = 0;
        this.direction = Math.random() * Math.PI * 2;
        this.targetDirection = this.direction;
        this.lockDirection = false; // 방향 고정 플래그
        
        // 기본 움직임 파라미터 (더 빠른 속도)
        this.baseWalkSpeed = 0.08; // 0.015 → 0.08 (약 5배 증가)
        this.baseMomentum = 0.92; // 관성 감소로 더 즉각적인 반응
        this.baseDirectionChangeRate = 0.06; // 방향 전환 빈도 증가
        this.baseRandomNoise = 0.015; // 노이즈 증가로 더 다이나믹한 움직임
        this.directionChangeTimer = 0;
        this.directionChangeInterval = 40 + Math.random() * 60; // 방향 전환 간격 단축
        
        // 동적 파라미터
        this.walkSpeed = this.baseWalkSpeed;
        this.momentum = this.baseMomentum;
        this.directionChangeRate = this.baseDirectionChangeRate;
        this.randomNoise = this.baseRandomNoise;
        
        // 회전 각도 (구 회전용)
        this.phi = 0;
        this.theta = 0;
        
        // 축 기반 회전 시스템
        this.rotationAxis = new THREE.Vector3(1, 0, 0); // 현재 회전축
        this.rotationAngle = 0; // 현재 회전 각도
        this.rotationSpeed = 0.05; // 기본 회전 속도 (충분한 회전을 위해 증가)
        
        
        // DOM 요소 캐싱
        this.progressBar = document.getElementById('progressFill');
        this.progressLabel = document.getElementById('progressLabel');
        this.progressTime = document.getElementById('progressTime');
    }

    /**
     * 초기화 메서드
     */
    init() {
        // 컴포넌트 초기화
        this.animationController = new AnimationController(this);
        this.timingManager = new TimingManager(this);
        this.uiController = new UIController(this);
        
        this.initThreeJS();
        this.initEventListeners();
    }

    /**
     * Three.js 씬 초기화
     */
    initThreeJS() {
        const container = document.getElementById('webgl-container');
        
        // Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // 검정색 배경 (구와 대비)
        
        // 렌더링 지속성을 위한 설정
        this.preserveDrawingBuffer = true;
        
        // Camera 생성 (구 외부에서 구를 관찰하는 각도)
        this.camera = new THREE.PerspectiveCamera(
            45, // 적당한 시야각
            1, // 350x350 정사각형
            1, 
            1000
        );
        // 구 반지름 설정
        this.sphereRadius = 50;
        // 카메라를 구 전체가 보이도록 적당한 거리에 배치
        this.cameraDistance = 180; // 구 전체가 잘 보이는 거리
        this.camera.position.set(this.cameraDistance, 0, 0);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer 생성 (잘상 방지 설정)
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            alpha: false, // 배경 알파 비활성화
            stencil: false, // 스텐실 버퍼 비활성화
            depth: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true // 화면 지속성
        });
        this.renderer.setSize(350, 350); // 고정 크기
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);
        
        // 격자 생성
        this.animationController.createGrid();
        
        // 초기 카메라 조정
        setTimeout(() => this.adjustCameraForContainer(), 100);
        
        // 리사이즈 이벤트
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * 이벤트 리스너 초기화
     */
    initEventListeners() {
        document.addEventListener('touchstart', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => e.preventDefault());
    }

    /**
     * 시작 메서드
     */
    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        this.animationController.updateSpeedSettings();
        this.timingManager.startProgressTracking();
        
        // 포아송 분포 모드 - 단일 사이클로 시작
        this.timingManager.startIntervalCycle();
    }

    /**
     * 정지 메서드
     */
    stop() {
        this.isRunning = false;
        this.uiController.releaseWakeLock();
        
        if (this.intervalTimer) {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
        
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        
        this.timingManager.clearTimers();
        this.animationController.stopAnimation();
        this.animationController.unlockDirection(); // 방향 고정 해제
        this.updateStatus('stoppedStatus', false);
        this.updateProgress(0, 'stoppedStatus', '0:00');
        
        // 사용자가 직접 중지한 경우에만 카메라 위치 초기화
        this.resetCameraPosition();
    }
    
    /**
     * 카메라 위치 초기화 (사용자 중지 시에만)
     */
    resetCameraPosition() {
        this.phi = 0;
        this.theta = 0;
        this.camera.position.set(this.cameraDistance, 0, 0);
        this.camera.lookAt(0, 0, 0);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 재시작 메서드
     */
    restart() {
        if (this.isRunning) {
            this.stop();
            setTimeout(() => this.start(), 100);
        }
    }

    /**
     * 창 크기 조정 처리
     */
    onWindowResize() {
        // 컨테이너 크기에 따라 카메라 거리 조정
        this.adjustCameraForContainer();
    }
    
    /**
     * 컨테이너 크기에 맞춰 카메라 거리 조정
     */
    adjustCameraForContainer() {
        const container = document.getElementById('webgl-container');
        if (!container) return;
        
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const containerSize = Math.min(containerWidth, containerHeight);
        
        // 컨테이너 크기에 비례하여 카메라 거리 조정
        // 350px 기준으로 180 거리, 300px일 때는 약 154 거리
        this.cameraDistance = (containerSize / 350) * 180;
        
        // 카메라 위치 업데이트
        this.camera.position.set(this.cameraDistance, 0, 0);
        this.camera.lookAt(0, 0, 0);
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(containerWidth, containerHeight);
        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();
    }
    
    // 컴포넌트에 위임할 메서드들
    updateStatus(text, active = false) {
        return this.uiController.updateStatus(text, active);
    }
    
    updateProgress(progress, label, timeText, isActive = false) {
        return this.uiController.updateProgress(progress, label, timeText, isActive);
    }
    
    formatTime(seconds) {
        return this.uiController.formatTime(seconds);
    }
    
    async requestWakeLock() {
        return this.uiController.requestWakeLock();
    }
    
    releaseWakeLock() {
        return this.uiController.releaseWakeLock();
    }
}

// 전역으로 노출
window.MouseJiggler = MouseJiggler;