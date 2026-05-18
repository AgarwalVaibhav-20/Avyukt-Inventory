import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-2xl shadow-xl border border-slate-100", className)}
      classNames={{
        selected: "bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:bg-indigo-600",
        today: "bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-lg",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4 text-slate-500", chevronClassName)} {...chevronProps} />;
          }
          if (orientation === "right") {
            return <ChevronRight className={cn("h-4 w-4 text-slate-500", chevronClassName)} {...chevronProps} />;
          }
          return null;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
