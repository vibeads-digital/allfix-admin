import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { PageHeader } from "./PageHeader";
import { Plus, Download } from "lucide-react";

export function PageStub({
  title,
  description,
  icon: Icon,
  sections,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  sections: { label: string; desc: string }[];
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="size-4 mr-2" />Export</Button>
            <Button size="sm"><Plus className="size-4 mr-2" />New</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Card key={s.label} className="p-5 gap-2 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Icon className="size-4" />
              </div>
              <div className="font-semibold">{s.label}</div>
            </div>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </Card>
        ))}
      </div>
    </>
  );
}