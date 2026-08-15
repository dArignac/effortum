import { useEffortumStore } from "@/store";
import { Button, Group, Switch, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

export function SettingsForm() {
  const settings = useEffortumStore((state) => state.settings.at(0));
  const updateSettings = useEffortumStore((state) => state.updateSettings);

  const form = useForm({
    mode: "controlled",
    initialValues: {
      roundToNearest5Minutes: settings
        ? settings.roundToNearest5Minutes
        : false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.setValues({
        roundToNearest5Minutes: settings.roundToNearest5Minutes,
      });
    }
  }, [settings]);

  return (
    <>
      <Title order={3} mb="md">
        General Settings
      </Title>
      <form
        onSubmit={form.onSubmit((values) => {
          updateSettings(values.roundToNearest5Minutes);
          notifications.show({
            message: "Settings updated successfully!",
            color: "green",
          });
        })}
      >
        <Group>
          <Switch
            label="Round times to the nearest 5 minutes"
            data-testid="settings-input-round-to-nearest-5-minutes"
            {...form.getInputProps("roundToNearest5Minutes", {
              type: "checkbox",
            })}
          />
        </Group>
        <Group mt="md" mb="xl">
          <Button type="submit" data-testid="settings-submit-button">
            Submit
          </Button>
        </Group>
      </form>
    </>
  );
}
