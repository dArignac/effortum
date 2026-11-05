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
    const today = dayjs().format("YYYY-MM-DD");
    setSelectedDateRange([today, today]);
  }, [setSelectedDateRange]);

  const handleDateChange = async (value: [string | null, string | null]) => {
    setSelectedDateRange(value || [null, null]);

    if (!value || !value[0] || !value[1]) {
      return;
    }

    try {
      useEffortumStore.setState({ isDataLoading: true });
      const tasks = await LazyDataLoader.loadTasksForDateRange(
        value[0],
        value[1],
      );
      useEffortumStore.setState({ tasks, isDataLoading: false });
    } catch (error) {
      console.error("Failed to load data for date range:", error);
      useEffortumStore.setState({ isDataLoading: false });
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
  );
}
