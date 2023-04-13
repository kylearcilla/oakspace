import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDDkpi29J7e7sPeFc98Ajg_DBcrq_qPjHo",
    authDomain: "luciole-383414.firebaseapp.com",
    projectId: "luciole-383414",
    storageBucket: "luciole-383414.appspot.com",
    messagingSenderId: "554073039798",
    appId: "1:554073039798:web:c03cdb179f3d46f0a95717",
    measurementId: "G-6MNSNB820F"
  };

firebase.initializeApp(firebaseConfig);

export default firebase.auth();