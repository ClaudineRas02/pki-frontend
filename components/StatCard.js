import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function StatCard({ value, label, tint }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  value: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 16,
  },
});
