'use server';

// Temporarily disabled AI imports for FASE 4 integration
// import {
//   triageIncidentReport,
//   type TriageIncidentReportOutput,
// } from '@/ai/flows/triage-incident-reports';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const ReportSchema = z.object({
  incidentType: z.string().min(1, { message: 'Incident type is required.' }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.'),
  location: z.string().min(3, 'Location is required.'),
});

// Temporarily disabled AI types for FASE 4 integration
type TriageIncidentReportOutput = {
  severity: string;
  category: string;
  confidence: number;
};

type State = {
  errors?: {
    incidentType?: string[];
    description?: string[];
    location?: string[];
    media?: string[];
  };
  message?: string | null;
  data?: TriageIncidentReportOutput | null;
};

export async function submitReport(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = ReportSchema.safeParse({
    incidentType: formData.get('incidentType'),
    description: formData.get('description'),
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Erro: Por favor, verifique os campos do formulário.',
    };
  }

  const mediaFile = formData.get('media') as File | null;
  let imageDataUri: string | undefined = undefined;

  if (mediaFile && mediaFile.size > 0) {
    if (!mediaFile.type.startsWith('image/')) {
      return {
        errors: { media: ['Apenas arquivos de imagem são permitidos.'] },
        message: 'Erro: Tipo de arquivo inválido.',
      };
    }
    const buffer = await mediaFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    imageDataUri = `data:${mediaFile.type};base64,${base64}`;
  }

  try {
    // Temporarily simulate AI triage for FASE 4 integration
    const aiResult = {
      severity: 'medium',
      category: validatedFields.data.incidentType,
      confidence: 0.85
    };

    // TODO: Integrate with Cloud Functions backend
    console.log('Report submitted:', validatedFields.data);
    console.log('Simulated AI Result:', aiResult);

    revalidatePath('/dashboard/report');
    return {
      message: `Relatório enviado com sucesso! Criticidade avaliada: ${aiResult.severity}`,
      data: aiResult,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Falha ao enviar o reporte devido a um erro no serviço de IA.',
    };
  }
}
