import * as Firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import GoogleSignIn from './components/GoogleSignIn.vue';

export default {
  install(Vue, options = {}) {
    const { config } = options;
    if (!config) {
      throw 'Auth plugin requires firebase config object!';
    }

    const firebase = Firebase.initializeApp(config);
    const auth = firebase.auth();

    /**
     * Register a global component for GoogleSignIn button
     */
    Vue.component('google-sign-in', GoogleSignIn);

    /**
     * Register firebase authentication methods
     */
    Vue.prototype.$auth = {
      createUserWithEmailAndPassword: async (email, pass) => {
        try {
          return await auth.createUserWithEmailAndPassword(email, pass);
        } catch (ex) {
          return ex;
        }
      },
      signInWithEmailAndPassword: async (email, pass) => {
        try {
          await auth.signInWithEmailAndPassword(email, pass);
        } catch (ex) {
          return ex;
        }
      },
      signOut: async () => {
        try {
          await auth.signOut();
        } catch (ex) {
          return ex;
        }
      },
      getCurrentUser: () => {
        return auth.currentUser;
      },
      getUserInfo: async () => {
        try {
          if (auth.currentUser) {
            const userRef = firebase.database().ref(`users/${auth.currentUser.uid}`);
            const result = (await userRef.once('value')).val();
            return result;
          }
        } catch (ex) {
          console.log(ex);
        }
      }
    };

    auth.onAuthStateChanged(user => {
      if (user) {
        Vue.prototype.$emit('login', user);
      } else {
        Vue.prototype.$emit('logout');
      }
    });
  }
};
