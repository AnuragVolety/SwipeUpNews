import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Text, View, TextInput, Button, StyleSheet, TouchableOpacity, Platform, ToastAndroid,  AlertIOS} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './Screens/HomeScreen.js'
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import * as firebase from "firebase";
import * as SecureStore from 'expo-secure-store';

const AuthContext = React.createContext();

const config = {
  apiKey: "AIzaSyDfGRu9oR1kY8csWwe4WxIcbtVIB-Ksb7Q",
  authDomain: "inshorts-clone-29227.firebaseapp.com",
  databaseURL: "https://inshorts-clone-29227.firebaseio.com",
  projectId: "inshorts-clone-29227",
  storageBucket: "inshorts-clone-29227.appspot.com",
  messagingSenderId: "253970298763",
  appId: "1:253970298763:web:e842b77a1e1003d42de18e",
  measurementId: "G-RT2NKLE4H3"
}

try {
  firebase.initializeApp(config);
} catch (err) {
  console.log(err);
}

let isLoggedIn = false;


function SignInScreen() {
  const recaptchaVerifier = React.useRef(null);
  const [phoneNumber, setPhoneNumber] = React.useState();
  const [verificationId, setVerificationId] = React.useState();
  const [verificationCode, setVerificationCode] = React.useState();
  const firebaseConfig = firebase.apps.length ? firebase.app().options : undefined;
  const [message, showMessage] = React.useState((!firebaseConfig || Platform.OS === 'web')
    ? { text: "To get started, provide a valid firebase config in App.js and open this snack on an iOS or Android device."}
    : undefined);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signIn } = React.useContext(AuthContext);
  // const isUserLoggedIn = await SecureStore.getItemAsync('userId');
  // console.log(isUserLoggedIn);

  return (
    isLoggedIn? <View><Text>Loading...</Text></View> :
    <View style={{ padding: 20, marginTop: 50 }}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      <Text style={{ marginTop: 20 }}>Enter phone number</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17 }}
        placeholder="Enter phone number along with country code"
        value={phoneNumber}
        autoFocus
        autoCompleteType="tel"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        onChangeText={(phoneNumber) => setPhoneNumber(phoneNumber)}
      />
      <Button
        title="Send Verification Code"
        disabled={!phoneNumber}
        onPress={async () => {
          try {
            const phoneProvider = new firebase.auth.PhoneAuthProvider();
            const verificationId = await phoneProvider.verifyPhoneNumber(
              phoneNumber,
              recaptchaVerifier.current
            );
            setVerificationId(verificationId);
            const msg = "Verification code has been sent to your phone.";
            if (Platform.OS === 'android') {
              ToastAndroid.show(msg, ToastAndroid.SHORT)
            } else {
              AlertIOS.alert(msg);
            }
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: "red" });
          }
        }}
      />
      <Text style={{ marginTop: 20 }}>Enter Verification code</Text>
      <TextInput
        style={{ marginVertical: 10, fontSize: 17 }}
        editable={!!verificationId}
        placeholder="123456"
        onChangeText={setVerificationCode}
      />
      <Button
        title="Confirm Verification Code"
        disabled={!verificationId}
        onPress={async () => {
          try {
            const credential = firebase.auth.PhoneAuthProvider.credential(
              verificationId,
              verificationCode
            );
            const response = await firebase.auth().signInWithCredential(credential);
            const successfulMsg = "Phone authentication successful 👍"
            if (Platform.OS === 'android') {
              ToastAndroid.show(successfulMsg, ToastAndroid.SHORT)
            } else {
              AlertIOS.alert(successfulMsg);
            }
            const userId = response.user.uid
            await SecureStore.setItemAsync('userId', userId)
            signIn({ userId })
          } catch (err) {
            showMessage({ text: `Error: ${err.message}`, color: "red" });
          }
        }}
      />
      {message ? (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: 0xffffffee, justifyContent: "center" }]}
          onPress={() => showMessage(undefined)}>
          <Text style={{color: message.color || "blue", fontSize: 17, textAlign: "center", margin: 20, }}>
            {message.text}
          </Text>
        </TouchableOpacity>
      ) : undefined}
    </View>
  );
}

const Stack = createStackNavigator();

export default function App({navigation}) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );
  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await SecureStore.getItemAsync('userId');
        isLoggedIn = userToken !== null
      } catch (e) {
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async data => {
        dispatch({ type: 'SIGN_IN', token: 'dummy-auth-token' });
      },
      signOut: () => dispatch({ type: 'SIGN_OUT' }),
      signUp: async data => {
        dispatch({ type: 'SIGN_IN', token: 'dummy-auth-token' });
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.userToken == null ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : (
            <Stack.Screen name="Home" component={HomeScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
