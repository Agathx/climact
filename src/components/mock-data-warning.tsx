import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function MockDataWarning() {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-amber-800">
        <strong>Dados fictícios apenas para demonstração</strong> - Esta é uma versão de demonstração com dados simulados.
      </AlertDescription>
    </Alert>
  );
}