import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Toast, {type ToastConfig} from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {colors, radius, spacing} from '../theme';

type Variant = 'success' | 'info' | 'warning' | 'danger';

interface ToastProps {
  variant: Variant;
  actionLabel?: string;
  onAction?: () => void;
}

const VARIANT_STYLE: Record<Variant, {icon: string; color: string}> = {
  success: {icon: 'check-circle', color: colors.success},
  info: {icon: 'information', color: colors.info},
  warning: {icon: 'bell-alert', color: colors.warning},
  danger: {icon: 'trash-can', color: colors.danger},
};

function AppToastView({
  text1,
  text2,
  props,
}: {
  text1?: string;
  text2?: string;
  props: ToastProps;
}) {
  const v = VARIANT_STYLE[props.variant];
  return (
    <View style={styles.toast} accessibilityLiveRegion="polite">
      <Icon name={v.icon} size={22} color={v.color} />
      <View style={styles.texts}>
        {text1 ? (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={styles.message} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
      {props.actionLabel && props.onAction ? (
        <Pressable
          onPress={() => {
            props.onAction?.();
            Toast.hide();
          }}
          hitSlop={10}
          accessibilityRole="button"
          style={styles.action}>
          <Text style={styles.actionText}>{props.actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const toastConfig: ToastConfig = {
  app: ({text1, text2, props}) => (
    <AppToastView text1={text1} text2={text2} props={props as ToastProps} />
  ),
};

/** Shows the app's standard toast. */
export function showToast(
  text1: string,
  options: {
    text2?: string;
    variant?: Variant;
    actionLabel?: string;
    onAction?: () => void;
  } = {},
) {
  const {text2, variant = 'success', actionLabel, onAction} = options;
  Toast.show({
    type: 'app',
    text1,
    text2,
    position: 'bottom',
    bottomOffset: 110,
    visibilityTime: actionLabel ? 4500 : 2500,
    props: {variant, actionLabel, onAction} satisfies ToastProps,
  });
}

const styles = StyleSheet.create({
  toast: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  texts: {flex: 1},
  title: {color: colors.text, fontWeight: '700', fontSize: 15},
  message: {color: colors.textSecondary, fontSize: 13, marginTop: 2},
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  actionText: {color: colors.accent, fontWeight: '800', fontSize: 14},
});
