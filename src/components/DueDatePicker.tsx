import React, {useMemo, useState} from 'react';
import {Keyboard, ScrollView, StyleSheet, Text, View} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {PressableScale} from './PressableScale';
import {fontFamily, colors, radius, spacing} from '../theme';
import {formatDueDate, getQuickDueOptions} from '../utils/date';

const QUICK_ICONS: Record<string, string> = {
  tonight: 'weather-night',
  tomorrow: 'weather-sunny',
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
  /** Extra chips rendered before the date options. */
  leading?: React.ReactNode;
}

/**
 * A row of due date chips: "Pick date" (opens the native date & time
 * picker) first, then Tonight (9 PM) and Tomorrow (7 AM).
 */
/** A time that has already passed can't be reminded: move it to the next 5-minute mark. */
function notInPast(date: Date): Date {
  const now = Date.now();
  if (date.getTime() > now) {
    return date;
  }
  const FIVE_MIN = 5 * 60 * 1000;
  return new Date(Math.ceil((now + 1000) / FIVE_MIN) * FIVE_MIN);
}

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
        <Chip
          icon={hasCustom ? 'calendar-check' : 'calendar-edit'}
          label={hasCustom && value ? formatDueDate(value) : 'Pick date'}
          selected={hasCustom}
          onPress={() => {
            Keyboard.dismiss();
            setPickerVisible(true);
          }}
        />
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
        {value !== null ? (
          <Chip
            icon="close"
            label="Clear"
            onPress={() => onChange(null)}
            accessibilityLabel="Remove due date"
          />
        ) : null}
      </ScrollView>

      <DatePicker
        modal
        open={pickerVisible}
        mode="datetime"
        date={pickerDate}
        minimumDate={now}
        theme="dark"
        title="Pick date"
        confirmText="Done"
        cancelText="Cancel"
        minuteInterval={5}
        onConfirm={date => {
          setPickerVisible(false);
          onChange(notInPast(date).toISOString());
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
    borderColor: colors.accent,
  },
  chipLabel: {fontFamily, color: colors.text, fontWeight: '400', fontSize: 14},
  chipLabelSelected: {color: colors.accent},
  chipDetail: {
    fontFamily,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },
  summary: {flexDirection: 'row', alignItems: 'center', gap: 6},
  summaryText: {
    fontFamily,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '400',
  },
  summaryActive: {color: colors.textSecondary},
});
