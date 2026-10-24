import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {colors, spacing, typography} from '../theme';

interface Props {
  icon: string;
  title: string;
  message: string;
}

export function EmptyState({icon, title, message}: Props) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.haloOuter}>
        <View style={styles.haloInner}>
          <Icon name={icon} size={34} color={colors.accent} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xxl,
  },
  haloOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  haloInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {...typography.heading, color: colors.text, marginBottom: spacing.xs},
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
