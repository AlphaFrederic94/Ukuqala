// This file is used to fix the Firebase compat version import issues
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/messaging';
import 'firebase/compat/analytics';

export default firebase;
