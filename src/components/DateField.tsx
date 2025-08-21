import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import React from "react";

export function DateSelectionField(props: {
  value: string | null;
  onChange: (value: string | null) => void;
  error?: React.ReactNode | undefined;
  dataTestId: string;
}) {
  return (
    <DatePickerInput
      defaultDate={dayjs().format("YYYY-MM-DD")}
      placeholder="Pick date"
      value={props.value}
      onChange={props.onChange}
      valueFormat="YYYY-MM-DD"
      presets={[
        {
          value: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
          label: "Yesterday",
        },
        { value: dayjs().format("YYYY-MM-DD"), label: "Today" },
        {
          value: dayjs().add(1, "day").format("YYYY-MM-DD"),
          label: "Tomorrow",
        },
      ]}
      size="xs"
      error={props.error}
      data-testid={props.dataTestId}
    />
  );
}
