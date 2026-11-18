import type { ReactNode } from "react";
import { ShowcasePanel } from "./showcase-panel";

/** Two-column shell shared by the auth and onboarding screens: marketing panel + form. */
export function ShowcaseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] items-stretch gap-10 p-6 lg:p-10 xl:gap-[50px] xl:p-[60px]">
      <ShowcasePanel className="hidden max-w-[709px] min-w-0 flex-[0_0_53.7%] lg:flex" />
      <main className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-[561px]">{children}</div>
      </main>
    </div>
  );
}
