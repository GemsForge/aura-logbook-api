import { DateTimePicker } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";

/** Compact, keyboard-editable occurrence control shared by the entry header and edit modal. */
export function MoodDateTimeField({ value, onChange, disabled = false, error = false }: {
  value: Dayjs | null; onChange: (value: Dayjs | null) => void; disabled?: boolean; error?: boolean;
}) {
  return <DateTimePicker
    value={value}
    onChange={onChange}
    disableFuture
    disabled={disabled}
    format="MMM D, h:mm A"
    // A compact calendar and one short clock list replace the three tall time columns.
    desktopModeMediaQuery="@media (min-width: 0px)"
    thresholdToRenderTimeInASingleColumn={300}
    timeSteps={{ minutes: 5 }}
    minutesStep={1}
    yearsPerRow={3}
    slotProps={{
      toolbar: { hidden: true },
      tabs: { hidden: true },
      actionBar: { actions: ["accept"], sx: { minHeight: 34, p: .5, "& .MuiButton-root": { minWidth: 44, py: .25, px: 1, fontSize: ".75rem" } } },
      popper: { modifiers: [{ name: "preventOverflow", options: { padding: 8 } }] },
      desktopPaper: { sx: { maxWidth: "calc(100vw - 16px)" } },
      mobilePaper: { sx: { maxWidth: "calc(100vw - 16px)" } },
      layout: { sx: {
        maxWidth: "calc(100vw - 16px)",
        "& .MuiDateCalendar-root": { width: { xs: 204, sm: 244 }, height: 272, maxHeight: 272 },
        "& .MuiPickersCalendarHeader-root": { minHeight: 34, height: 34, mt: .5, mb: 0, px: 1 },
        "& .MuiPickersCalendarHeader-label": { fontSize: ".8rem" },
        "& .MuiPickersCalendarHeader-root .MuiIconButton-root": { width: 28, height: 28, p: .25 },
        "& .MuiDayCalendar-weekDayLabel": { width: { xs: 24, sm: 28 }, height: 24, fontSize: ".7rem" },
        "& .MuiPickersDay-root": { width: { xs: 24, sm: 28 }, height: 28, fontSize: ".75rem" },
        "& .MuiDayCalendar-weekContainer": { my: .125 },
        "& .MuiDayCalendar-slideTransition": { minHeight: 192 },
        "& .MuiYearCalendar-root, & .MuiMonthCalendar-root": { width: "100%", maxHeight: 238 },
        "& .MuiDigitalClock-root": { width: { xs: 88, sm: 112 }, height: 272, maxHeight: "272px !important" },
        "& .MuiDigitalClock-item": { minHeight: 28, py: .25, px: .75, fontSize: ".75rem", mx: .5 },
      } },
      textField: {
      size: "small", hiddenLabel: true, ...(error ? { error: true } : {}),
      InputProps: { "aria-label": "Entry date and time" },
      sx: { width: { xs: 168, sm: 190 }, flex: "0 0 auto", "& .MuiPickersInputBase-root": { height: 32, minHeight: 32, fontSize: ".75rem", px: .5, borderRadius: ".35rem" }, "& .MuiPickersSectionList-root": { py: .5 }, "& .MuiInputAdornment-root": { ml: 0, mr: 0 }, "& .MuiIconButton-root": { width: 28, height: 28, p: .5, m: 0 }, "& .MuiSvgIcon-root": { fontSize: 16 } },
    } }}
  />;
}
