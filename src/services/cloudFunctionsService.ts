// Firebase Cloud Functions Service
// Integração frontend-backend para ClimACT - FASE 4

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// ===== TIPOS PARA CLOUD FUNCTIONS =====

export interface CloudFunctionResult<T = any> {
  data: T;
  error?: string;
}

// Tipos para Profile Functions (RN01, RN10)
export interface ProfileUpgradeRequest {
  targetRole: 'voluntario' | 'ong' | 'defesa_civil';
  documents: {
    type: string;
    url: string;
    description: string;
  }[];
  justification: string;
  additionalInfo?: any;
}

export interface ProfileUpgradeResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

// Tipos para Report Functions (RN02)
export interface ReportSubmission {
  incidentType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  mediaUrls?: string[];
  isAnonymous?: boolean;
}

export interface ReportResponse {
  reportId: string;
  status: 'pendente_ia' | 'pendente_comunidade' | 'aprovado' | 'rejeitado_ia' | 'rejeitado_defesa_civil';
  aiAnalysis?: {
    score: number;
    recommendation: string;
    reasons: string[];
  };
}

// Tipos para Chat Functions (RN05)
export interface ChatMessage {
  channelId: string;
  message: string;
  type?: 'text' | 'image' | 'system';
}

export interface ChatResponse {
  messageId: string;
  status: 'active' | 'hidden' | 'blocked';
  timestamp: Date;
}

// ===== CLOUD FUNCTIONS =====

class CloudFunctionsService {
  // Profile Functions (RN01, RN10)
  async requestProfileUpgrade(request: ProfileUpgradeRequest): Promise<ProfileUpgradeResponse> {
    const callable = httpsCallable(functions, 'requestProfileUpgrade');
    const result = await callable(request);
    return result.data as ProfileUpgradeResponse;
  }

  async getUserProfile(userId?: string) {
    const callable = httpsCallable(functions, 'getUserProfile');
    const result = await callable({ userId });
    return result.data;
  }

  async updateUserProfile(profileData: any) {
    const callable = httpsCallable(functions, 'updateUserProfile');
    const result = await callable(profileData);
    return result.data;
  }

  async listProfileUpgradeRequests(status?: string) {
    const callable = httpsCallable(functions, 'listProfileUpgradeRequests');
    const result = await callable({ status });
    return result.data;
  }

  async reviewProfileUpgrade(requestId: string, decision: 'approve' | 'reject', notes?: string) {
    const callable = httpsCallable(functions, 'reviewProfileUpgrade');
    const result = await callable({ requestId, decision, notes });
    return result.data;
  }

  // Report Functions (RN02)
  async submitReport(report: ReportSubmission): Promise<ReportResponse> {
    const callable = httpsCallable(functions, 'submitReport');
    const result = await callable(report);
    return result.data as ReportResponse;
  }

  async validateReportCommunity(reportId: string, vote: 'up' | 'down') {
    const callable = httpsCallable(functions, 'validateReportCommunity');
    const result = await callable({ reportId, vote });
    return result.data;
  }

  async reviewReportDefesaCivil(reportId: string, decision: 'approve' | 'reject', reason?: string) {
    const callable = httpsCallable(functions, 'reviewReportDefesaCivil');
    const result = await callable({ reportId, decision, reason });
    return result.data;
  }

  async getReports(filters?: {
    status?: string;
    location?: { latitude: number; longitude: number };
    radius?: number;
    limit?: number;
  }) {
    const callable = httpsCallable(functions, 'getReports');
    const result = await callable(filters || {});
    return result.data;
  }

  // Chat Functions (RN05)
  async sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
    const callable = httpsCallable(functions, 'sendChatMessage');
    const result = await callable(message);
    return result.data as ChatResponse;
  }

  async getChatMessages(channelId: string, limit?: number, startAfter?: string) {
    const callable = httpsCallable(functions, 'getChatMessages');
    const result = await callable({ channelId, limit, startAfter });
    return result.data;
  }

  async reportChatMessage(messageId: string, reason: string) {
    const callable = httpsCallable(functions, 'reportChatMessage');
    const result = await callable({ messageId, reason });
    return result.data;
  }

  async createChatChannel(name: string, type: 'general' | 'emergency' | 'education' | 'support', settings?: any) {
    const callable = httpsCallable(functions, 'createChatChannel');
    const result = await callable({ name, type, settings });
    return result.data;
  }

  // Anonymous Reports (RN07)
  async submitAnonymousReport(report: {
    reportType: string;
    description: string;
    location?: { latitude: number; longitude: number; address: string };
    evidence?: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    const callable = httpsCallable(functions, 'submitAnonymousReport');
    const result = await callable(report);
    return result.data;
  }

  async getAnonymousReportStatus(protocol: string) {
    const callable = httpsCallable(functions, 'getAnonymousReportStatus');
    const result = await callable({ protocol });
    return result.data;
  }

  // Education & Alerts (RN03, RN11)
  async startEducationalTrail(trailId: string) {
    const callable = httpsCallable(functions, 'startEducationalTrail');
    const result = await callable({ trailId });
    return result.data;
  }

  async completeModule(trailId: string, moduleId: string, score: number, answers: any[]) {
    const callable = httpsCallable(functions, 'completeModule');
    const result = await callable({ trailId, moduleId, score, answers });
    return result.data;
  }

  async getActiveOfficialAlerts(userLocation?: { latitude: number; longitude: number }) {
    const callable = httpsCallable(functions, 'getActiveOfficialAlerts');
    const result = await callable({ userLocation });
    return result.data;
  }

  async markAlertAsRead(alertId: string) {
    const callable = httpsCallable(functions, 'markAlertAsRead');
    const result = await callable({ alertId });
    return result.data;
  }

  async createOfficialAlert(alert: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    targetAreas: any[];
    expiresAt: Date;
  }) {
    const callable = httpsCallable(functions, 'createOfficialAlert');
    const result = await callable(alert);
    return result.data;
  }

  // Donation System (RN06)
  async createDonationRequest(request: {
    title: string;
    description: string;
    category: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    location: { latitude: number; longitude: number; address: string };
    requestedItems: { item: string; quantity: number; unit: string; }[];
  }) {
    const callable = httpsCallable(functions, 'createDonationRequest');
    const result = await callable(request);
    return result.data;
  }

  async searchDonationRequests(filters?: {
    category?: string;
    urgency?: string;
    location?: { latitude: number; longitude: number };
    radius?: number;
  }) {
    const callable = httpsCallable(functions, 'searchDonationRequests');
    const result = await callable(filters || {});
    return result.data;
  }

  async respondToDonationRequest(requestId: string, message: string, offeredItems: any[]) {
    const callable = httpsCallable(functions, 'respondToDonationRequest');
    const result = await callable({ requestId, message, offeredItems });
    return result.data;
  }

  // LGPD Functions (RN08, RN12)
  async requestDataExport() {
    const callable = httpsCallable(functions, 'requestDataExport');
    const result = await callable({});
    return result.data;
  }

  async getDataExportStatus(requestId: string) {
    const callable = httpsCallable(functions, 'getDataExportStatus');
    const result = await callable({ requestId });
    return result.data;
  }

  async getUserHistory(startDate?: Date, endDate?: Date) {
    const callable = httpsCallable(functions, 'getUserHistory');
    const result = await callable({ startDate, endDate });
    return result.data;
  }

  // Admin Functions
  async getAILogs(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const callable = httpsCallable(functions, 'getAILogs');
    const result = await callable(filters || {});
    return result.data;
  }

  async reviewAIDecision(logId: string, humanReview: {
    decision: 'approve' | 'reject' | 'escalate';
    notes: string;
    newAction?: string;
  }) {
    const callable = httpsCallable(functions, 'reviewAIDecision');
    const result = await callable({ logId, humanReview });
    return result.data;
  }

  // Anonymous Reports Admin
  async listAnonymousReports(filters?: {
    status?: string;
    reportType?: string;
    severity?: string;
    limit?: number;
  }) {
    const callable = httpsCallable(functions, 'listAnonymousReports');
    const result = await callable(filters || {});
    return result.data;
  }

  async updateAnonymousReportStatus(reportId: string, status: string, response?: string) {
    const callable = httpsCallable(functions, 'updateAnonymousReportStatus');
    const result = await callable({ reportId, status, response });
    return result.data;
  }

  async getAnonymousReportsStats() {
    const callable = httpsCallable(functions, 'getAnonymousReportsStats');
    const result = await callable({});
    return result.data;
  }
}

// Instância singleton
export const cloudFunctionsService = new CloudFunctionsService();

// Export individual functions para compatibilidade
export const {
  requestProfileUpgrade,
  getUserProfile,
  updateUserProfile,
  submitReport,
  validateReportCommunity,
  sendChatMessage,
  getChatMessages,
  submitAnonymousReport,
  getAnonymousReportStatus,
  startEducationalTrail,
  completeModule,
  getActiveOfficialAlerts,
  createDonationRequest,
  searchDonationRequests,
  requestDataExport,
  getUserHistory
} = cloudFunctionsService;

export default cloudFunctionsService;
