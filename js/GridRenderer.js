/**
 * GridRenderer - 격자 렌더링 담당 컴포넌트
 * 구형 격자 생성 및 관리
 */
class GridRenderer {
    constructor(mouseJiggler) {
        this.mouseJiggler = mouseJiggler;
    }

    /**
     * 구형 격자 생성 (텍스쳐 기반)
     */
    createGrid() {
        this.mouseJiggler.gridGroup = new THREE.Group();
        
        const sphereRadius = 50;
        const gridDensity = { meridians: 96, parallels: 64 };
        
        // 체크무늬 텍스쳐 생성
        const checkerTexture = this.createGridTexture(gridDensity);
        
        // 텍스쳐가 적용된 구 생성
        this.createTexturedSphere(sphereRadius, checkerTexture);
        
        // 회전축 표시 라인 생성 (비활성화)
        // this.createAxisVisualization();
        
        this.mouseJiggler.scene.add(this.mouseJiggler.gridGroup);
    }
    
    /**
     * Equirectangular projection 격자 텍스쳐 생성
     */
    createGridTexture(gridDensity) {
        const canvas = document.createElement('canvas');
        const width = 1024; // 경도 방향 (2:1 비율)
        const height = 512; // 위도 방향
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // 배경 색상 (흰색)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // 격자 선 설정 (검정색, 두꺼운 선)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        // Equirectangular projection 격자 그리기
        this.drawEquirectangularGrid(ctx, width, height, gridDensity);
        
        // Three.js 텍스쳐로 변환
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = false;
        
        return texture;
    }
    
    /**
     * 단순한 직사각형 격자 생성 (가로세로 선)
     */
    drawEquirectangularGrid(ctx, width, height, gridDensity) {
        // 배경을 흰색으로
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // 격자 선 설정
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // 세로선 그리기 (경도선)
        const meridianStep = width / gridDensity.meridians;
        for (let i = 0; i <= gridDensity.meridians; i++) {
            const x = i * meridianStep;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        
        // 가로선 그리기 (위도선)
        const parallelStep = height / gridDensity.parallels;
        for (let i = 0; i <= gridDensity.parallels; i++) {
            const y = i * parallelStep;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        
        ctx.stroke();
    }
    
    
    
    /**
     * 텍스쳐가 적용된 구 생성
     */
    createTexturedSphere(radius, texture) {
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide // 외부 시점이므로 FrontSide 사용
        });
        
        this.mouseJiggler.gridSphere = new THREE.Mesh(geometry, material);
        this.mouseJiggler.gridGroup.add(this.mouseJiggler.gridSphere);
    }
    
}

// 전역으로 노출
window.GridRenderer = GridRenderer;