import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface EducationModuleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  progress: number;
}

export function EducationModule({ title, description, icon: Icon, progress }: EducationModuleProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Can add more content here later */}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <div className="w-full">
          <span className="text-xs text-muted-foreground">Progresso: {progress}%</span>
          <Progress value={progress} aria-label={`${progress}% complete`} />
        </div>
        <Button className="w-full mt-2">
          {progress > 0 ? "Continuar" : "Começar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
