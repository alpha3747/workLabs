import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {NewTaskInput} from '../types/task';
import {fontFamily, colors, radius, spacing, typography} from '../theme';
import {DueDatePicker, DueDateSummary} from './DueDatePicker';
import {PressableScale} from './PressableScale';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void;
}

const HIDDEN_OFFSET = 420;

/**
 * Bottom sheet for capturing a task fast: type a title, optionally tap a due
 * date chip, hit send. Priority and everything else live on the task screen.
 */
export function QuickAddSheet({visible, onClose, onSubmit}: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const titleRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDueDate(null);
      setOpenCount(c => c + 1);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 3,
      }).start();
      // Focus after the sheet starts moving so the keyboard rises with it.
      const timer = setTimeout(() => titleRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
    translateY.setValue(HIDDEN_OFFSET);
  }, [visible, translateY]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: HIDDEN_OFFSET,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({title, dueDate});
    close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              transform: [{translateY}],
            },
          ]}>
          <View style={styles.handle} />
          <Text style={styles.heading}>New task</Text>

          <TextInput
            ref={titleRef}
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            returnKeyType="done"
            onSubmitEditing={submit}
            submitBehavior="submit"
            maxLength={200}
            accessibilityLabel="Task title"
          />

          <View style={styles.chips}>
            <DueDatePicker
              key={openCount}
              value={dueDate}
              onChange={setDueDate}
            />
          </View>

          <View style={styles.footer}>
            <DueDateSummary value={dueDate} />
            <PressableScale
              onPress={submit}
              disabled={!canSubmit}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel="Add task"
              accessibilityState={{disabled: !canSubmit}}
              style={[styles.send, !canSubmit && styles.sendDisabled]}>
              <Icon name="arrow-up" size={24} color={colors.onAccent} />
            </PressableScale>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 6,
    borderTopRightRadius: radius.xl + 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  heading: {...typography.overline, color: colors.accent},
  titleInput: {
    fontFamily,
    color: colors.text,
    fontSize: 20,
    fontWeight: '400',
    paddingVertical: spacing.md,
  },
  chips: {marginTop: spacing.xs},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {opacity: 0.35},
});
