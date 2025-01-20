// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import {getFirestore} from "@firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

    apiKey: "AIzaSyD2ggIs-KIIpINm5gqmx7PfVLF6OgA4uao",

    authDomain: "groceries-90029.firebaseapp.com",

    projectId: "groceries-90029",

    storageBucket: "groceries-90029.firebasestorage.app",

    messagingSenderId: "236361122719",

    appId: "1:236361122719:web:6518bed692f801ae99f3aa",

    measurementId: "G-YVS4PL0Z42"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };