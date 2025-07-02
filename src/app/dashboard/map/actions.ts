'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const HelpRequestSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high'], { required_error: 'Por favor, selecione a urgência.' }),
  items: z.array(z.string()).min(1, { message: 'Selecione pelo menos um item.' }),
  description: z.string().optional(),
  location: z.string().min(3, { message: 'A localização é obrigatória.' }),
});

type State = {
  errors?: {
    urgency?: string[];
    items?: string[];
    description?: string[];
    location?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function requestHelp(
  prevState: State,
  formData: FormData
): Promise<State> {
  const items = formData.getAll('items');
  const validatedFields = HelpRequestSchema.safeParse({
    urgency: formData.get('urgency'),
    items: items,
    description: formData.get('description'),
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro: Verifique os campos do formulário.',
      success: false,
    };
  }
  
  // In a real app, you would save this request to Firestore
  // and trigger notifications (RF19).
  console.log('New Help Request:', validatedFields.data);


  revalidatePath('/dashboard/map');
  return {
    message: 'Seu pedido de ajuda foi enviado com sucesso! As equipes de apoio foram notificadas.',
    success: true,
  };
}
