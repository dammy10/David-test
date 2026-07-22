import Link from "next/link";
import NavLinks from "@/app/ui/dashboard/nav-links";
import AcmeLogo from "@/app/ui/acme-logo";
import { PowerIcon } from "@heroicons/react/24/outline";
import { signOut } from "@/auth";

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-500 px-4 py-5 text-white shadow-md md:mb-8">
        <div className="flex items-center gap-3">
          <AcmeLogo />
        </div>
      </div>
      <div className="flex grow flex-col justify-between space-y-4 md:space-y-6">
        <NavLinks />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:px-4">
            <PowerIcon className="w-6" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
