import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { TextLink } from "@/components/ui/text-link";
import { ADMIN_ROUTES } from "@/config/routes";

/**
 * Shown when a staff member opens a section their roles do not include, for
 * example from a saved link. The API refuses the data either way; this just
 * says so plainly instead of showing an empty or broken page.
 */
export function NoAccess({ section }: { section: string }) {
  return (
    <>
      <PageHeader title={section} />
      <Card className="flex flex-col gap-3">
        <p className="font-display text-xl leading-6 font-semibold text-foreground">
          You do not have access to this section
        </p>
        <p className="text-base text-muted-foreground">
          Your roles do not include {section}. If you need it, ask the person
          who created your account.
        </p>
        <p className="text-base font-semibold">
          <TextLink href={ADMIN_ROUTES.home}>Back to the dashboard</TextLink>
        </p>
      </Card>
    </>
  );
}
