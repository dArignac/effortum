import { useEffortumStore } from "@/store";
import { Indicator } from "@mantine/core";
import { DatePicker, DatePickerProps } from "@mantine/dates";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { useEffect } from "react";
import { LazyDataLoader } from "../services/lazyDataLoader";

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

  const handleDateChange = async (value: [string | null, string | null]) => {
    // Update the selected date range in store
    setSelectedDateRange(value || [null, null]);

    if (!value || !value[0] || !value[1]) {
      return;
    }

    try {
      // Load data for the selected date range - but only tasks need to be updated here
      // Projects, overtime, and settings are typically loaded once at app startup
      const { tasks } = await LazyDataLoader.loadDataForDateRange(
        value[0],
        value[1],
      );

      // Only update tasks in store (projects, etc. remain the same)
      useEffortumStore.setState({ tasks });
    } catch (error) {
      console.error("Failed to load data for date range:", error);
      // Optionally show a notification to the user
    }
  };

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
        onChange={handleDateChange}
        size="xs"
        renderDay={dayRenderer}
        getDayProps={(date) => ({
          "data-testid": `summary-date-day-${dayjs(date).format("YYYY-MM-DD")}`,
        })}
        data-testid="summary-date-picker"
      />
    </>
  );
}
