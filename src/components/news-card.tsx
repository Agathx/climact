import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NewsCardProps {
  title: string;
  snippet: string;
  source: string;
  date: string;
  imageUrl: string;
  imageHint: string;
  link: string;
}

export function NewsCard({ title, snippet, source, date, imageUrl, imageHint, link }: NewsCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader>
        <div className="relative aspect-video w-full">
            <Image
              src={imageUrl}
              alt={title}
              data-ai-hint={imageHint}
              fill
              className="object-cover rounded-t-lg"
            />
        </div>
        <CardTitle className="pt-4">{title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{source}</Badge>
          <span>{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{snippet}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={link}>Ler mais</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
