import { generateYAxis } from "@/app/lib/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";
import { fetchRevenue } from "@/app/lib/data";
import { Revenue } from "@/app/lib/definitions";

// This component is representational only.
// For data visualization UI, check out:
// https://www.tremor.so/
// https://www.chartjs.org/
// https://airbnb.io/visx/

export default async function RevenueChart() {
  const revenue: Revenue[] = await fetchRevenue();

  const chartHeight = 350;
  const { yAxisLabels, topLabel } = generateYAxis(revenue);

  if (!revenue || revenue.length === 0) {
    return <p className="mt-4 text-gray-400">No data available.</p>;
  }

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Recent Revenue
      </h2>
      {/* NOTE: Uncomment this code in Chapter 7 */}

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="sm:grid-cols-13 mt-0 grid grid-cols-12 items-end gap-2 rounded-md bg-white p-4 md:gap-4">
          <div
            className="mb-6 hidden flex-col justify-between text-sm text-gray-400 sm:flex"
            style={{ height: `${chartHeight}px` }}
          >
            {yAxisLabels.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>

          {revenue.map((month) => (
            <div key={month.month} className="flex flex-col items-center gap-2">
              <div
                className="flex h-[350px] w-full items-end justify-center gap-1"
                role="img"
                aria-label={`${month.month}: $${month.paid.toLocaleString("en-US")} paid, $${month.pending.toLocaleString("en-US")} pending`}
                title={`${month.month}: $${month.paid.toLocaleString("en-US")} paid, $${month.pending.toLocaleString("en-US")} pending`}
              >
                <div
                  className="w-1/2 rounded-t-sm bg-blue-500"
                  style={{
                    height: `${Math.min(
                      chartHeight,
                      Math.max(0, (chartHeight / topLabel) * month.paid),
                    )}px`,
                  }}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-gray-300"
                  style={{
                    height: `${Math.min(
                      chartHeight,
                      Math.max(0, (chartHeight / topLabel) * month.pending),
                    )}px`,
                  }}
                />
              </div>
              <p className="-rotate-90 text-sm text-gray-400 sm:rotate-0">
                {month.month}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-2 pt-6">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h3 className="ml-2 text-sm text-gray-500">Last 12 months</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-sm bg-blue-500" />
            Paid
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-sm bg-gray-300" />
            Pending
          </div>
        </div>
      </div>
    </div>
  );
}
