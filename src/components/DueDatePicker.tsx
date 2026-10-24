import React, {useMemo, useState} from 'react';
import {Keyboard, ScrollView, StyleSheet, Text, View} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {PressableScale} from './PressableScale';
import {colors, radius, spacing} from '../theme';
import {formatDueDate, getQuickDueOptions} from '../utils/date';

const QUICK_ICONS: Record<string, string> = {
  today: 'weather-sunset',
  later: 'clock-fast',
  tomorrow: 'weather-sunny',
  nextWeek: 'calendar-arrow-right',
};

interface ChipProps {
  icon: string;
  label: string;
  detail?: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function Chip({
  icon,
  label,
  detail,
  selected,
  onPress,
  accessibilityLabel,
}: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{selected}}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Icon
        name={icon}
        size={16}
        color={selected ? colors.accent : colors.textSecondary}
      />
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
      {detail ? <Text style={styles.chipDetail}>{detail}</Text> : null}
    </PressableScale>
  );
}

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
  /** Extra chips rendered before the date options (e.g. "Notes"). */
  leading?: React.ReactNode;
}

/**
 * A row of one-tap due date chips (Today / Tomorrow / Next week) plus a
 * "Pick date" chip that opens the native date & time picker.
 */
export function DueDatePicker({value, onChange, leading}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);
  // Computed once per mount so a selected chip stays selected while the
  // screen is open. Parents re-mount this component each time they open.
  const quickOptions = useMemo(() => getQuickDueOptions(new Date()), []);

  const selectedQuick = quickOptions.find(
    o => value !== null && o.date.toISOString() === value,
  );
  const hasCustom = value !== null && !selectedQuick;

  const now = new Date();
  const pickerDate = value && new Date(value) > now ? new Date(value) : now;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.row}>
        {leading}
        {quickOptions.map(option => {
          const selected = selectedQuick?.key === option.key;
          return (
            <Chip
              key={option.key}
              icon={QUICK_ICONS[option.key]}
              label={option.label}
              detail={option.detail}
              selected={selected}
              accessibilityLabel={`Due ${option.label} at ${option.detail}`}
              onPress={() =>
                onChange(selected ? null : option.date.toISOString())
              }
            />
          );
        })}
        <Chip
          icon={hasCustom ? 'calendar-check' : 'calendar-edit'}
          label={hasCustom && value ? formatDueDate(value) : 'Pick date'}
          selected={hasCustom}
          onPress={() => {
            Keyboard.dismiss();
            setPickerVisible(true);
          }}
        />
        {value !== null ? (
          <Chip
            icon="close"
            label="Clear"
            onPress={() => onChange(null)}
            accessibilityLabel="Remove due date"
          />
        ) : null}
      </ScrollView>

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="datetime"
        date={pickerDate}
        minimumDate={now}
        isDarkModeEnabled
        accentColor={colors.accent}
        buttonTextColorIOS={colors.accent}
        onConfirm={date => {
          setPickerVisible(false);
          onChange(date.toISOString());
        }}
        onCancel={() => setPickerVisible(false)}
      />
    </>
  );
}

export function DueDateSummary({value}: {value: string | null}) {
  return (
    <View style={styles.summary}>
      <Icon
        name={value ? 'bell-ring-outline' : 'bell-off-outline'}
        size={15}
        color={value ? colors.accent : colors.textMuted}
      />
      <Text style={[styles.summaryText, value ? styles.summaryActive : null]}>
        {value ? `Reminder · ${formatDueDate(value)}` : 'No reminder'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {gap: spacing.sm, paddingVertical: 2},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(0,230,204,0.45)',
  },
  chipLabel: {color: colors.text, fontWeight: '600', fontSize: 14},
  chipLabelSelected: {color: colors.accent},
  chipDetail: {color: colors.textMuted, fontSize: 12, fontWeight: '500'},
  summary: {flexDirection: 'row', alignItems: 'center', gap: 6},
  summaryText: {color: colors.textMuted, fontSize: 13, fontWeight: '500'},
  summaryActive: {color: colors.textSecondary},
});
