# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: LifeGamble)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 등록

1. Firebase Console에서 프로젝트 선택
2. 왼쪽 메뉴에서 "프로젝트 설정" (톱니바퀴 아이콘) 클릭
3. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
4. 앱 닉네임 입력 (예: LifeGamble Web)
5. "앱 등록" 클릭

## 3. Firebase 설정 정보 복사

앱 등록 후 나타나는 설정 정보를 복사합니다:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## 4. 설정 파일 업데이트

`js/firebase-config.js` 파일을 열고 위에서 복사한 설정 정보로 업데이트하세요.

## 5. Authentication 활성화

1. Firebase Console 왼쪽 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "Sign-in method" 탭 클릭
4. "이메일/비밀번호" 클릭
5. "사용 설정" 토글을 켜기
6. "저장" 클릭

## 6. Firestore Database 설정

1. Firebase Console 왼쪽 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발 중)
4. 위치 선택 (asia-northeast3 - 서울 권장)
5. "사용 설정" 클릭

## 7. Firestore 보안 규칙 (선택사항)

개발 중에는 테스트 모드로 충분하지만, 프로덕션에서는 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. 완료!

이제 게임을 실행하면 회원가입/로그인 기능이 작동합니다.

## 주의사항

- `firebase-config.js` 파일의 설정 정보는 공개되어도 안전합니다 (클라이언트 측 코드)
- 하지만 Firebase Console에서 API 키 제한을 설정하는 것을 권장합니다
- 프로덕션 배포 전에 Firestore 보안 규칙을 반드시 설정하세요


