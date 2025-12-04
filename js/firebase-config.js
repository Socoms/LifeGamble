// Firebase 설정 파일
// Firebase Console에서 프로젝트 설정 > 일반 > 앱에서 config 정보를 가져와서 아래에 입력하세요

const firebaseConfig = {
    apiKey: "AIzaSyBZX8PaYQl3d2DCH-CdhL8iGzYHof4zaC8",
    authDomain: "lifegamble.firebaseapp.com",
    projectId: "lifegamble",
    storageBucket: "lifegamble.firebasestorage.app",
    messagingSenderId: "375269684902",
    appId: "1:375269684902:web:3f1d37f7f0d4965fbba667",
    measurementId: "G-V2KB8FL3VM"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();

