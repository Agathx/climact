'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestHelp } from './actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const itemsNeeded = [
  { id: 'agua', label: 'Água Potável' },
  { id: 'alimento', label: 'Alimentos Não Perecíveis' },
  { id: 'abrigo', label: 'Abrigo Temporário' },
  { id: 'medicamentos', label: 'Medicamentos / Primeiros Socorros' },
  { id: 'higiene', label: 'Itens de Higiene' },
  { id: 'roupas', label: 'Roupas e Cobertores' },
  { id: 'resgate', label: 'Resgate de Pessoas/Animais' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Enviando Pedido...' : 'Enviar Pedido de Ajuda'}
    </Button>
  );
}

export function SosDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const initialState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(requestHelp, initialState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success, onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-destructive flex items-center gap-2">
            <AlertCircle className="h-7 w-7" />
            Pedido de Ajuda Emergencial
          </DialogTitle>
          <DialogDescription>
            Use este formulário apenas em caso de necessidade real e imediata.
            Sua localização será compartilhada com as equipes de resgate.
          </DialogDescription>
        </DialogHeader>

        {state.success ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-bold">Pedido Enviado!</h3>
            <p className="text-muted-foreground">{state.message}</p>
          </div>
        ) : (
          <form action={dispatch} className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="urgency">Nível de Urgência</Label>
              <Select name="urgency" required>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Selecione o quão urgente é seu pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <span className="font-bold text-destructive">ALTA - Risco Imediato</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="font-bold text-yellow-600">MÉDIA - Necessidade Importante</span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="font-bold text-green-600">BAIXA - Precaução / Apoio</span>
                  </SelectItem>
                </SelectContent>
              </Select>
               {state.errors?.urgency && <p className="text-sm text-destructive">{state.errors.urgency[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label>Itens Necessários (selecione ao menos um)</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-4">
                {itemsNeeded.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox id={`item-${item.id}`} name="items" value={item.id} />
                    <Label htmlFor={`item-${item.id}`} className="font-normal">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
              {state.errors?.items && <p className="text-sm text-destructive">{state.errors.items[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Sua Localização Atual</Label>
              <Input
                id="location"
                name="location"
                placeholder="Ex: Rua Exemplo, 123 (ou ponto de referência)"
                required
              />
              {state.errors?.location && <p className="text-sm text-destructive">{state.errors.location[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Adicional (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva a situação, quantas pessoas precisam de ajuda, etc."
              />
            </div>

            {state.message && !state.success && (
                <div className="text-sm text-destructive font-medium">{state.message}</div>
            )}
            
            <DialogFooter className="sm:justify-start">
              <SubmitButton />
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
