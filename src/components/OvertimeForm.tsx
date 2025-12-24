import { Button, Group, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

export function OvertimeForm() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      currentBalance: 0,
      workingHoursPerDay: 8,
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
  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Group>
        <TextInput
          label="Current Overtime Balance (hours)"
          {...form.getInputProps("currentBalance")}
          key={form.key("currentBalance")}
          w={250}
        />
      </Group>
      <Group mt="md">
        <TextInput
          label="Working Hours Per Day"
          {...form.getInputProps("workingHoursPerDay")}
          key={form.key("workingHoursPerDay")}
          w={250}
        />
      </Group>
      <Group mt="md">
        <Button type="submit">Submit</Button>
      </Group>
    </form>
  );
}
