import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  compact = false,
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        tone === 'ghost' && styles.ghost,
        tone === 'danger' && styles.danger,
        tone === 'soft' && styles.soft,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'ghost' && styles.ghostLabel,
          tone === 'danger' && styles.dangerLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  compact: {
    minHeight: 40,
  },
  soft: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primarySoft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: 'transparent',
    borderColor: '#70303a',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: '#06101d',
    fontWeight: '700',
    fontSize: 15,
  },
  ghostLabel: {
    color: theme.colors.text,
  },
  dangerLabel: {
    color: theme.colors.danger,
  },
});
