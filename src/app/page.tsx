import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-medium tracking-widest text-primary uppercase">
        {siteConfig.name}
      </p>
      <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Trade with a plan, not a guess.
      </h1>
      <p className="mt-4 max-w-md text-base text-pretty text-muted-foreground">
        {siteConfig.description}
      </p>
    </main>
  );
}
