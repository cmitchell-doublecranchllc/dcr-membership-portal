import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  backLink, 
  backLabel = "Back",
  action 
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {/* Logo */}
      <div className="mb-4">
        <img src="/logo-cc.png" alt="Double C Ranch" className="h-12" />
      </div>

      {/* Back button */}
      {backLink && (
        <Link href={backLink}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      )}

      {/* Title and action */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
