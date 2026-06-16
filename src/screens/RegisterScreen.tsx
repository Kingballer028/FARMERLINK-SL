import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function RegisterScreen({ navigation }: any) {
  const [role, setRole] = useState('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyGoogleToken, registerWithEmail } = useContext(AuthContext);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '960009541350-pcvvgtl4vg12njl5t5p9tqvqq9rve3d8.apps.googleusercontent.com',
    androidClientId: '960009541350-pcvvgtl4vg12njl5t5p9tqvqq9rve3d8.apps.googleusercontent.com',
    iosClientId: '960009541350-pcvvgtl4vg12njl5t5p9tqvqq9rve3d8.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleRegister(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Registration Failed', response.error?.message || 'Failed to authenticate with Google');
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleRegister = async (idToken: string) => {
    setIsLoading(true);
    try {
      await verifyGoogleToken(idToken, role, true);
    } catch (error: any) {
      Alert.alert('Registration Error', error.message || 'Something went wrong.');
      setIsLoading(false);
    }
  };

  const handleWebRegister = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.idToken) {
        await verifyGoogleToken(credential.idToken, role, true);
      } else {
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      Alert.alert('Registration Error', error.message || 'Failed to register.');
    }
  };

  const handleEmailRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await registerWithEmail(email, password, role);
    } catch (error: any) {
      let msg = error.message || 'Failed to register.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      Alert.alert('Registration Error', msg);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity style={[styles.roleBtn, role === 'buyer' && styles.roleBtnActive]} onPress={() => setRole('buyer')}>
          <Text style={role === 'buyer' ? styles.roleTextActive : styles.roleText}>Buyer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roleBtn, role === 'farmer' && styles.roleBtnActive]} onPress={() => setRole('farmer')}>
          <Text style={role === 'farmer' ? styles.roleTextActive : styles.roleText}>Farmer</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleEmailRegister} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        disabled={isLoading}
        onPress={() => {
          if (Platform.OS === 'web') {
            handleWebRegister();
          } else {
            promptAsync();
          }
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="logo-google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5', width: '100%', maxWidth: 500, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2e7d32' },
  subtitle: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 20, color: '#333' },
  roleContainer: { flexDirection: 'row', marginBottom: 30, justifyContent: 'center' },
  roleBtn: { paddingVertical: 10, paddingHorizontal: 30, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, marginHorizontal: 5 },
  roleBtnActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  roleText: { color: '#555', fontWeight: 'bold' },
  roleTextActive: { color: '#fff', fontWeight: 'bold' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  button: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  googleButton: {
    backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  googleButtonText: { color: '#444', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#2e7d32', textAlign: 'center', marginTop: 10, fontSize: 16 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 10, color: '#888', fontWeight: 'bold' }
});
