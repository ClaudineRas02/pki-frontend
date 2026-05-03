import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export function TopHero({ title, subtitle, meta }) {
  return (
    <View style={styles.hero}>
      <View style={styles.dotField} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#071427',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 32,
    padding: theme.spacing.xl,
    overflow: 'hidden',
  },
  dotField: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -60,
    top: -80,
    borderRadius: 220,
    backgroundColor: 'rgba(93, 156, 255, 0.11)',
  },
  title: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 38,
  },
  subtitle: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 18,
  },
  meta: {
    marginTop: 18,
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});
