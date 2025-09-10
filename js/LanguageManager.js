class LanguageManager {
  constructor() {
    this.currentLanguage = 'en'; // 기본 언어를 영어로 변경
    this.translations = {
      ko: {
        title: 'Mouse Jiggler',
        instructions: '마우스를 아래 구체에 올려놓고 화면 꺼짐을 방지하세요.',
        wakeLockInfo: '💡 일부 브라우저에서는 화면 절전 방지가 지원되지 않습니다. Chrome/Edge 사용을 권장합니다.',
        speed: '속도',
        interval: '간격',
        slow: '느림',
        normal: '보통',
        fast: '빠름',
        interval10: '10초',
        interval30: '30초',
        continuous: '연속',
        waiting: '대기 중...',
        active: '활성 중...',
        moving: '움직이는 중...',
        paused: '일시정지됨',
        waitingStatus: '대기 중',
        movingStatus: '회전 중',
        stoppedStatus: '중지됨',
        continuousMode: '연속 모드',
        aboutLink: '서비스 소개',
        faqLink: '자주 묻는 질문',
        privacyLink: '개인정보처리방침',
        termsLink: '이용약관',
        copyright: '© 2025 Mouse Jiggler. 무료로 제공되는 서비스입니다.'
      },
      en: {
        title: 'Mouse Jiggler',
        instructions: 'Place your mouse over the sphere and prevent screen sleep.',
        wakeLockInfo: '💡 Screen wake lock is not supported in some browsers. Chrome/Edge is recommended.',
        speed: 'Speed',
        interval: 'Interval',
        slow: 'Slow',
        normal: 'Normal',
        fast: 'Fast',
        interval10: '10 sec',
        interval30: '30 sec',
        continuous: 'Continuous',
        waiting: 'Waiting...',
        active: 'Active...',
        moving: 'Moving...',
        paused: 'Paused',
        waitingStatus: 'Waiting',
        movingStatus: 'Moving',
        stoppedStatus: 'Stopped',
        continuousMode: 'Continuous Mode',
        aboutLink: 'About',
        faqLink: 'FAQ',
        privacyLink: 'Privacy Policy',
        termsLink: 'Terms of Service',
        copyright: '© 2025 Mouse Jiggler. Free service provided.'
      }
    };
    
    this.initLanguage();
  }
  
  initLanguage() {
    // URL 파라미터에서 언어 확인
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    
    if (urlLang && this.translations[urlLang]) {
      this.currentLanguage = urlLang;
    } else {
      // 저장된 언어 설정 확인
      const savedLanguage = localStorage.getItem('mouse-jiggler-language');
      if (savedLanguage && this.translations[savedLanguage]) {
        this.currentLanguage = savedLanguage;
      } else {
        // 브라우저 언어 설정 확인
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('ko')) {
          this.currentLanguage = 'ko';
        } else {
          this.currentLanguage = 'en'; // 기본값 영어
        }
      }
    }
    
    this.updateLanguageButton();
    this.translatePage();
    this.updateMetaTags();
  }
  
  switchLanguage() {
    this.currentLanguage = this.currentLanguage === 'ko' ? 'en' : 'ko';
    localStorage.setItem('mouse-jiggler-language', this.currentLanguage);
    
    this.updateLanguageButton();
    this.translatePage();
    this.updateMetaTags();
    this.updateCurrentStatus();
  }
  
  updateLanguageButton() {
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.textContent = this.currentLanguage === 'ko' ? 'EN' : '한글';
    }
    
    // 푸터 링크들에 언어 파라미터 업데이트
    this.updateFooterLinks();
  }
  
  updateFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('.html')) {
        // 기존 파라미터 제거 후 현재 언어 추가
        const baseUrl = href.split('?')[0];
        link.setAttribute('href', `${baseUrl}?lang=${this.currentLanguage}`);
      }
    });
  }
  
  translatePage() {
    // data-translate 속성이 있는 요소들 번역
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.translations[this.currentLanguage][key];
      if (translation) {
        element.textContent = translation;
      }
    });
    
    // data-translate-title 속성이 있는 요소들 번역 (링크 텍스트용)
    const titleElements = document.querySelectorAll('[data-translate-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-translate-title');
      const translation = this.translations[this.currentLanguage][key];
      if (translation) {
        element.textContent = translation;
      }
    });
    
    // HTML lang 속성 업데이트
    document.documentElement.lang = this.currentLanguage;
  }
  
  updateMetaTags() {
    const metaTags = {
      ko: {
        title: 'Mouse Jiggler - 마우스 지글러 | 화면 절전 방지 도구',
        description: '마우스 자동 움직임으로 화면 절전과 화면 보호기를 방지하는 무료 웹 도구. Mouse Jiggler, Mouse Mover로 자리 비움 방지 및 컴퓨터 활성 상태 유지.',
        keywords: '마우스 지글러, mouse jiggler, mouse mover, 마우스 무버, 화면 꺼짐 방지, 자리 비움 방지, 화면 절전 방지, 화면 보호기 방지, wake app, 컴퓨터 깨우기'
      },
      en: {
        title: 'Mouse Jiggler - Prevent Screen Sleep | Keep Computer Awake',
        description: 'Free web tool that prevents screen sleep and screensaver by automatically moving your mouse. Keep your computer active with Mouse Jiggler and Mouse Mover.',
        keywords: 'mouse jiggler, mouse mover, prevent screen sleep, keep awake, screensaver prevention, computer active, wake app, automatic mouse movement'
      }
    };
    
    const currentMeta = metaTags[this.currentLanguage];
    
    // Title 업데이트
    document.title = currentMeta.title;
    
    // Meta description 업데이트
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.content = currentMeta.description;
    }
    
    // Meta keywords 업데이트
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.content = currentMeta.keywords;
    }
    
    // Open Graph 태그 업데이트
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = currentMeta.title;
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.content = currentMeta.description;
    }
    
    // Twitter 태그 업데이트
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.content = currentMeta.title;
    }
    
    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.content = currentMeta.description;
    }
  }
  
  getText(key) {
    return this.translations[this.currentLanguage][key] || key;
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  updateCurrentStatus() {
    // 현재 실행 중인 상태 텍스트를 새 언어로 업데이트
    const statusText = document.getElementById('statusText');
    if (statusText && statusText.textContent) {
      // 현재 텍스트가 번역 키인지 확인하고 업데이트
      const currentText = statusText.textContent;
      
      // 기존 한국어/영어 상태 텍스트를 키로 역매핑
      const statusKeyMap = {
        '대기 중': 'waitingStatus',
        'Waiting': 'waitingStatus',
        '회전 중': 'movingStatus', 
        'Moving': 'movingStatus',
        '중지됨': 'stoppedStatus',
        'Stopped': 'stoppedStatus'
      };
      
      // 연속 모드 패턴 매칭
      if (currentText.includes('연속 모드') || currentText.includes('Continuous Mode')) {
        const continuousMode = this.getText('continuousMode');
        const movingStatus = this.getText('movingStatus');
        const match = currentText.match(/\(([0-9.]+)초?\)/);
        if (match) {
          statusText.textContent = `${continuousMode} - ${movingStatus} (${match[1]}초)`;
        }
        return;
      }
      
      const statusKey = statusKeyMap[currentText.trim()];
      if (statusKey) {
        statusText.textContent = this.getText(statusKey);
      }
    }
  }
}

// 전역 변수로 언어 매니저 인스턴스 생성
window.languageManager = new LanguageManager();