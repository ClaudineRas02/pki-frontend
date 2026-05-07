import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { theme } from '../theme';

const STATIC_USER = 'admin';
const STATIC_PASS = 'admin123';

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username === STATIC_USER && password === STATIC_PASS) {
        onLogin();
      } else {
        Alert.alert('Erreur', 'Identifiants incorrects.');
      }
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <Text style={styles.label}>UTILISATEUR</Text>
      <TextInput
        style={styles.input}
        placeholder="admin"
        placeholderTextColor={theme.colors.textDim}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text style={styles.label}>MOT DE PASSE</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={theme.colors.textDim}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Vérification...' : 'Se connecter'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  label: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.panelSoft,
    color: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});