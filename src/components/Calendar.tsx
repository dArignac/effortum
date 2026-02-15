import { useEffortumStore } from "@/store";
import { Indicator } from "@mantine/core";
import { DatePicker, DatePickerProps } from "@mantine/dates";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { useEffect } from "react";

dayjs.extend(isToday);

export function Calendar() {
  const selectedDateRange = useEffortumStore(
    (state) => state.selectedDateRange,
  );
  const setSelectedDateRange = useEffortumStore(
    (state) => state.setSelectedDateRange,
  );

  useEffect(() => {
    setSelectedDateRange([
      dayjs().format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ]);
  }, [setSelectedDateRange]);

  const dayRenderer: DatePickerProps["renderDay"] = (date) => {
    const day = dayjs(date).date();
    return (
      <Indicator
        size={6}
        position="bottom-center"
        color="green"
        disabled={!dayjs(date).isToday()}
      >
        <div>{day}</div>
      </Indicator>
    );
  };

  return (
    <>
      <DatePicker
        type="range"
        allowSingleDateInRange
        value={selectedDateRange}
        onChange={(value) => setSelectedDateRange(value || [null, null])}
        size="xs"
        renderDay={dayRenderer}
        data-testid="summary-date-picker"
      />
    </>
  );
}
