import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const toneMap = {
  success: { backgroundColor: 'rgba(46, 204, 113, 0.12)', color: theme.colors.success },
  warning: { backgroundColor: 'rgba(245, 178, 60, 0.14)', color: theme.colors.warning },
  danger: { backgroundColor: 'rgba(255, 107, 107, 0.14)', color: theme.colors.danger },
  info: { backgroundColor: 'rgba(93, 156, 255, 0.14)', color: theme.colors.primary },
  accent: { backgroundColor: 'rgba(67, 217, 189, 0.14)', color: theme.colors.accent },
};

export function Pill({ label, tone = 'info' }) {
  const palette = toneMap[tone] || toneMap.info;

  return (
    <View style={[styles.pill, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
