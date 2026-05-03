import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function InlineMessage({ message, tone = 'info' }) {
  if (!message) {
    return null;
  }

  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'success'
        ? theme.colors.success
        : theme.colors.primary;

  return (
    <View style={[styles.box, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(8, 17, 31, 0.55)',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
