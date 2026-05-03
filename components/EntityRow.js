import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Pill } from './Pill';

export function EntityRow({
  title,
  subtitle,
  meta,
  badgeLabel,
  badgeTone,
  onPress,
  actions,
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={styles.side}>
        {badgeLabel ? <Pill label={badgeLabel} tone={badgeTone} /> : null}
        {actions}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  side: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 17,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  meta: {
    color: theme.colors.textDim,
    fontSize: 13,
  },
});
