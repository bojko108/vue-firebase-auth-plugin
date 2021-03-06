import * as Firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import GoogleSignIn from './components/GoogleSignIn.vue';

import eventsPlugin from 'vue-event-emitter-plugin';

export default {
  install(Vue, options = {}) {
    const { config } = options;
    if (!config) {
      throw 'Auth plugin requires firebase config object!';
    }

    if (!Vue.prototype.$events) {
      Vue.use(eventsPlugin);
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
      auth,
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
      getUserRoles: async () => {
        try {
          if (auth.currentUser) {
            const userRef = firebase.database().ref(`users/${auth.currentUser.uid}`);
            const result = (await userRef.once('value')).val();
            return result;
          }
        } catch (ex) {
          console.log(ex);
        }
      },
      isAdmin: async () => {
        try {
          const userRoles = await getUserRoles();
          return userRoles ? userRoles.admin : false;
        } catch (ex) {
          console.log(ex);
          return false;
        }
      }
    };

    auth.onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified) {
          Vue.prototype.$events.emit('login', user);
        } else {
          Vue.prototype.$events.emit('email-not-verified', user);
        }
      } else {
        Vue.prototype.$events.emit('logout');
      }
    });
  }
};
