import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();

/**
 * Trigger automático: Análise de IA quando novo relatório é criado (RN02)
 */
export const onReportCreated = onDocumentCreated('reports/{reportId}', async (event) => {
  const reportId = event.params.reportId;
  const reportData = event.data?.data();

  if (!reportData) {
    logger.error('Report data not found', { reportId });
    return;
  }

  try {
    logger.info('Starting AI analysis for report', { reportId });

    // Análise de IA simplificada (em produção usar Google AI ou similar)
    const aiAnalysis = await analyzeContentWithAI(
      reportData.description,
      reportData.incidentType
    );

    // Atualizar relatório com análise IA
    await db.collection('reports').doc(reportId).update({
      aiAnalysis: {
        ...aiAnalysis,
        processedAt: new Date(),
      },
      status: aiAnalysis.score > 0.7 ? 'aprovado' : 
              aiAnalysis.score < 0.3 ? 'rejeitado_ia' : 'pendente_comunidade',
      updatedAt: new Date(),
    });

    // Registrar log de IA (RN09)
    await db.collection('aiLogs').add({
      type: 'report_analysis',
      entityId: reportId,
      entityType: 'report',
      aiDecision: {
        score: aiAnalysis.score,
        recommendation: aiAnalysis.recommendation,
        reasons: aiAnalysis.reasons,
      },
      metadata: {
        incidentType: reportData.incidentType,
        description: reportData.description.substring(0, 100),
        location: reportData.location,
      },
      processedAt: new Date(),
      confidence: aiAnalysis.score,
    });

    // Notificar Defesa Civil se alta criticidade
    if (aiAnalysis.score > 0.8) {
      await notifyDefesaCivil(reportId, reportData, aiAnalysis);
    }

    logger.info('AI analysis completed for report', { 
      reportId, 
      score: aiAnalysis.score,
      recommendation: aiAnalysis.recommendation 
    });

  } catch (error) {
    logger.error('Error in AI analysis trigger', { reportId, error });
    
    // Em caso de erro, marcar para revisão manual
    await db.collection('reports').doc(reportId).update({
      status: 'pendente_comunidade',
      aiAnalysis: {
        error: 'Falha na análise automática',
        processedAt: new Date(),
      },
      updatedAt: new Date(),
    });
  }
});

/**
 * Análise de conteúdo com IA (função auxiliar)
 */
async function analyzeContentWithAI(description: string, incidentType: string): Promise<{
  score: number;
  recommendation: string;
  reasons: string[];
}> {
  // Implementação simplificada - em produção usar Google AI Platform
  const emergencyKeywords = [
    'fogo', 'incêndio', 'enchente', 'alagamento', 'deslizamento',
    'urgente', 'emergência', 'socorro', 'perigo', 'risco',
    'evacuação', 'feridos', 'mortos', 'destruição'
  ];

  const suspiciousKeywords = [
    'fake', 'mentira', 'brincadeira', 'teste', 'falso',
    'spam', 'propaganda', 'venda', 'compra', 'dinheiro'
  ];

  let score = 0.5; // Score neutro
  const reasons: string[] = [];

  // Análise por palavras-chave de emergência
  const emergencyMatches = emergencyKeywords.filter(keyword => 
    description.toLowerCase().includes(keyword)
  ).length;
  
  if (emergencyMatches > 0) {
    score += emergencyMatches * 0.15;
    reasons.push(`Contém ${emergencyMatches} palavras de emergência`);
  }

  // Análise por palavras suspeitas
  const suspiciousMatches = suspiciousKeywords.filter(keyword => 
    description.toLowerCase().includes(keyword)
  ).length;
  
  if (suspiciousMatches > 0) {
    score -= suspiciousMatches * 0.2;
    reasons.push(`Contém ${suspiciousMatches} palavras suspeitas`);
  }

  // Análise de comprimento e detalhamento
  if (description.length < 20) {
    score -= 0.3;
    reasons.push('Descrição muito curta');
  } else if (description.length > 100) {
    score += 0.2;
    reasons.push('Descrição detalhada');
  }

  // Análise por tipo de incidente
  const highPriorityTypes = ['incendio', 'enchente', 'deslizamento', 'acidente'];
  if (highPriorityTypes.includes(incidentType)) {
    score += 0.2;
    reasons.push('Tipo de incidente de alta prioridade');
  }

  // Normalizar score entre 0 e 1
  score = Math.max(0, Math.min(1, score));

  let recommendation: string;
  if (score > 0.7) {
    recommendation = 'aprovar_automaticamente';
  } else if (score < 0.3) {
    recommendation = 'rejeitar_automaticamente';
  } else {
    recommendation = 'enviar_validacao_comunitaria';
  }

  return { score, recommendation, reasons };
}

/**
 * Notificar Defesa Civil sobre relatório crítico
 */
async function notifyDefesaCivil(reportId: string, reportData: any, aiAnalysis: any) {
  try {
    await db.collection('notifications').add({
      type: 'critical_report',
      title: 'Relatório Crítico Detectado',
      message: `Relatório de ${reportData.incidentType} com alta criticidade detectado pela IA`,
      targetRoles: ['defesa_civil', 'admin'],
      priority: 'critical',
      data: {
        reportId,
        incidentType: reportData.incidentType,
        location: reportData.location,
        aiScore: aiAnalysis.score,
      },
      createdAt: new Date(),
      isRead: false,
    });

    logger.info('Defesa Civil notified of critical report', { reportId });
  } catch (error) {
    logger.error('Error notifying Defesa Civil', { reportId, error });
  }
}
