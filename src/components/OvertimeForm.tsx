import { useEffortumStore } from "@/store";
import { Alert, Button, Group, NumberInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect } from "react";

export function OvertimeForm() {
  const overtime = useEffortumStore((state) => state.overtime.at(0));
  const updateOvertime = useEffortumStore((state) => state.updateOvertime);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      currentBalance: overtime ? overtime.currentBalance : 0,
      workingHoursPerDay: overtime ? overtime.workingHoursPerDay : 8,
    },
    validate: {
      currentBalance: (value) => (isNaN(value) ? "Must be a number" : null),
      workingHoursPerDay: (value) =>
        isNaN(value) || value <= 0
          ? "Must be a positive number"
          : value > 24
            ? "A day has only 24 hours"
            : null,
    },
  });

  useEffect(() => {
    if (overtime) {
      form.setValues({
        currentBalance: overtime.currentBalance,
        workingHoursPerDay: overtime.workingHoursPerDay,
      });
    }
  }, [overtime?.currentBalance, overtime?.workingHoursPerDay]);

  return (
    <>
      <Title order={3} mb="md">
        Overtime Settings
      </Title>
      <form
        onSubmit={form.onSubmit((values) => {
          updateOvertime(values.currentBalance, values.workingHoursPerDay);
          notifications.show({
            message: "Overtime settings updated successfully!",
            color: "green",
          });
        })}
      >
        <Alert
          variant="outline"
          color="yellow"
          title="Important Note"
          icon={<IconInfoCircle />}
          mb={"xl"}
        >
          Overtime values are currently only stored, but not yet handled. This
          will be added in a future version.
        </Alert>
        <Group>
          <NumberInput
            label="Current Overtime Balance (hours)"
            {...form.getInputProps("currentBalance")}
            w={250}
            data-testid="overtime-input-current-balance"
          />
        </Group>
        <Group mt="md">
          <NumberInput
            label="Working Hours Per Day"
            {...form.getInputProps("workingHoursPerDay")}
            w={250}
            data-testid="overtime-input-working-hours"
          />
        </Group>
        <Group mt="md">
          <Button type="submit" data-testid="overtime-submit-button">
            Submit
          </Button>
        </Group>
      </form>
    </>
  );
}
