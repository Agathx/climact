import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin
initializeApp();

// Configurar Firestore
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// Exportar todas as funções

// Profile Functions (RN01 - Evolução de perfil)
export {
  requestProfileUpgrade,
  reviewProfileUpgrade,
  getUserProfile,
  updateUserProfile,
  listProfileUpgradeRequests
} from './callable/profile';

// Report Functions (RN02 - Validação de relatórios)
export {
  submitReport,
  analyzeReportWithAI,
  validateReportCommunity,
  reviewReportDefesaCivil,
  getReports
} from './callable/report';

// Chat Functions (RN05 - Moderação de chat)
export {
  sendChatMessage,
  moderateChatMessage,
  reportChatMessage,
  moderateMessage,
  getChatMessages,
  createChatChannel
} from './callable/chat';

// Anonymous Reports (RN07 - Denúncia anônima)
export {
  submitAnonymousReport,
  getAnonymousReportStatus,
  listAnonymousReports,
  updateAnonymousReportStatus,
  respondToAnonymousReport,
  getAnonymousReportsStats
} from './callable/anonymous-reports';

// Dashboard Functions
export {
  getUserDashboardStats,
  getUserRecentActivity
} from './callable/dashboard';

// Education & Alerts (RN03, RN11 - Trilhas educacionais e alertas oficiais)
export {
  createEducationalTrail,
  startEducationalTrail,
  completeModule,
  createOfficialAlert,
  getActiveOfficialAlerts,
  markAlertAsRead,
  expireOfficialAlerts,
  getEducationalContent
} from './callable/education-alerts';

// Additional Features (RN06, RN08, RN09, RN12)
export {
  createDonationRequest,
  searchDonationRequests,
  respondToDonationRequest,
  requestDataExport,
  getDataExportStatus,
  getUserHistory,
  getAILogs,
  reviewAIDecision
} from './callable/additional-features';

// Triggers automáticos
export {
  onReportCreated
} from './triggers/report';

export {
  onChatMessageCreated
} from './triggers/chat';

export {
  onUserProfileUpdated
} from './triggers/profile';

// Placeholder para futuras implementações
// RN04: Controle de acesso (implementado via Security Rules)
// RN10: Processo de voluntários (parte do RN01)
