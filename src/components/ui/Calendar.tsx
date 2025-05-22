"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { DateRange } from "react-day-picker";
import { useTheme } from '@mui/material/styles';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const theme = useTheme();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      style={{ padding: theme.spacing(2) }}
      classNames={{
        months: '',
        month: '',
        caption: '',
        caption_label: '',
        nav: '',
        nav_button: '',
        nav_button_previous: '',
        nav_button_next: '',
        table: '',
        head_row: '',
        head_cell: '',
        row: '',
        cell: '',
        day: '',
        day_selected: '',
        day_today: '',
        day_outside: '',
        day_disabled: '',
        day_range_middle: '',
        day_hidden: '',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar }; 