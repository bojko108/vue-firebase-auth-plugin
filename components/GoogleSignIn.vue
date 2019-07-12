<template>
  <div id="firebaseui-auth-container"></div>
</template>
<script>
import * as firebase from "firebase/app";
import "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";

export default {
  name: "GoogleSignIn",
  data() {
    return {};
  },
  mounted() {
    const ui =
      firebaseui.auth.AuthUI.getInstance() ||
      new firebaseui.auth.AuthUI(firebase.auth());

    ui.start("#firebaseui-auth-container", {
      signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
      signInFlow: "popup",
      callbacks: {
        signInSuccessWithAuthResult: (authResult, redirectUrl) => {
          // Process result. This will not trigger on merge conflicts.
          // On success redirect to signInSuccessUrl.
          return false;
        },
        // signInFailure callback must be provided to handle merge conflicts which
        // occur when an existing credential is linked to an anonymous user.
        signInFailure: function(error) {
          console.log(error);
          // For merge conflicts, the error.code will be
          // 'firebaseui/anonymous-upgrade-merge-conflict'.
          if (error.code != "firebaseui/anonymous-upgrade-merge-conflict") {
            return Promise.resolve();
          }
          // The credential the user tried to sign in with.
          var cred = error.credential;
          // If using Firebase Realtime Database. The anonymous user data has to be
          // copied to the non-anonymous user.
          var app = firebase.app();
          // Save anonymous user data first.
          return app
            .database()
            .ref("users/" + firebase.auth().currentUser.uid)
            .once("value")
            .then(function(snapshot) {
              data = snapshot.val();
              // This will trigger onAuthStateChanged listener which
              // could trigger a redirect to another page.
              // Ensure the upgrade flow is not interrupted by that callback
              // and that this is given enough time to complete before
              // redirection.
              return firebase.auth().signInWithCredential(cred);
            })
            .then(function(user) {
              // Original Anonymous Auth instance now has the new user.
              return app
                .database()
                .ref("users/" + user.uid)
                .set(data);
            })
            .then(function() {
              // Delete anonymnous user.
              return anonymousUser.delete();
            })
            .then(function() {
              // Clear data in case a new user signs in, and the state change
              // triggers.
              data = null;
              // FirebaseUI will reset and the UI cleared when this promise
              // resolves.
              // signInSuccessWithAuthResult will not run. Successful sign-in
              // logic has to be run explicitly.
              window.location.assign("<url-to-redirect-to-on-success>");
            });
        }
      }
    });
  }
};
</script>
<style scoped>
</style>
