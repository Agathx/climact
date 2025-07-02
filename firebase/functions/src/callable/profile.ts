import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Tipos locais para evitar problemas de importação
interface UserProfile {
  uid: string;
  role: string;
  status: string;
  [key: string]: any;
}

interface ProfileUpgradeRequest {
  id?: string;
  uid: string;
  currentRole: string;
  requestedRole: string;
  status: string;
  requestData: any;
  documentsUrls: { [key: string]: string };
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  rejectionReason?: string;
}

const db = getFirestore();
const auth = getAuth();

/**
 * RN01: Solicitação de evolução de perfil
 * Permite que cidadãos solicitem evolução para voluntário, ONG ou defesa civil
 */
export const requestProfileUpgrade = onCall(async (request: any) => {
  const { uid } = request.auth ?? {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { requestedRole, requestData, documentsUrls } = request.data;

  // Validar se a evolução é permitida
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuário não encontrado');
  }

  const currentUser = userDoc.data() as UserProfile;
  
  // RN01: Verificar se já existe uma solicitação pendente
  const existingRequest = await db
    .collection('profileUpgradeRequests')
    .where('uid', '==', uid)
    .where('status', '==', 'pendente')
    .get();

  if (!existingRequest.empty) {
    throw new HttpsError('already-exists', 'Já existe uma solicitação pendente');
  }

  // RN01: Validar regras de evolução - apenas cidadãos podem solicitar
  if (currentUser.role !== 'cidadao') {
    throw new HttpsError('permission-denied', 'Apenas cidadãos podem solicitar evolução de perfil');
  }

  if (!['voluntario', 'ong', 'defesa_civil'].includes(requestedRole)) {
    throw new HttpsError('invalid-argument', 'Tipo de perfil solicitado não é válido');
  }

  // Criar solicitação
  const upgradeRequest: Omit<ProfileUpgradeRequest, 'id'> = {
    uid,
    currentRole: currentUser.role,
    requestedRole,
    status: 'pendente',
    requestData,
    documentsUrls: documentsUrls ?? {},
    submittedAt: new Date(),
  };

  const docRef = await db.collection('profileUpgradeRequests').add(upgradeRequest);

  logger.info(`Profile upgrade requested: ${uid} -> ${requestedRole}`, {
    userId: uid,
    requestId: docRef.id,
    requestedRole,
  });

  return { success: true, requestId: docRef.id };
});

/**
 * RN01: Aprovar/rejeitar solicitação de perfil (apenas admins)
 */
export const reviewProfileUpgrade = onCall(async (request) => {
  const { uid } = request.auth ?? {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const adminDoc = await db.collection('users').doc(uid).get();
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem revisar solicitações');
  }

  const { requestId, approved, rejectionReason } = request.data;

  const requestDoc = await db.collection('profileUpgradeRequests').doc(requestId).get();
  if (!requestDoc.exists) {
    throw new HttpsError('not-found', 'Solicitação não encontrada');
  }

  const upgradeRequest = requestDoc.data() as ProfileUpgradeRequest;
  
  if (upgradeRequest.status !== 'pendente') {
    throw new HttpsError('failed-precondition', 'Solicitação já foi processada');
  }

  const batch = db.batch();

  // Atualizar status da solicitação
  batch.update(requestDoc.ref, {
    status: approved ? 'aprovado' : 'rejeitado',
    reviewedAt: new Date(),
    reviewedBy: uid,
    rejectionReason: approved ? null : rejectionReason,
  });

  if (approved) {
    // RN01: Atualizar perfil do usuário e status
    const userRef = db.collection('users').doc(upgradeRequest.uid);
    const profileField = `${upgradeRequest.requestedRole}Profile`;
    
    batch.update(userRef, {
      role: upgradeRequest.requestedRole,
      status: 'active', // Usuário aprovado fica ativo
      [profileField]: upgradeRequest.requestData,
      updatedAt: new Date(),
    });

    // Atualizar custom claims no Auth
    await auth.setCustomUserClaims(upgradeRequest.uid, {
      role: upgradeRequest.requestedRole,
      status: 'active',
    });
  }

  await batch.commit();

  logger.info(`Profile upgrade ${approved ? 'approved' : 'rejected'}`, {
    requestId,
    userId: upgradeRequest.uid,
    reviewerId: uid,
    newRole: approved ? upgradeRequest.requestedRole : null,
  });

  return { success: true };
});

/**
 * Obter perfil completo do usuário
 */
export const getUserProfile = onCall(async (request) => {
  const { uid } = request.auth ?? {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Perfil não encontrado');
  }

  return userDoc.data();
});

/**
 * Atualizar perfil do usuário
 */
export const updateUserProfile = onCall(async (request) => {
  const { uid } = request.auth ?? {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { profileData } = request.data;

  // Remover campos sensíveis que não podem ser atualizados diretamente
  const safeFields = { ...profileData };
  delete safeFields.role;
  delete safeFields.uid;
  delete safeFields.createdAt;

  await db.collection('users').doc(uid).update({
    ...safeFields,
    updatedAt: new Date(),
  });

  logger.info(`User profile updated: ${uid}`);

  return { success: true };
});

/**
 * Listar solicitações de evolução de perfil (apenas admins)
 */
export const listProfileUpgradeRequests = onCall(async (request) => {
  const { uid } = request.auth ?? {};
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Verificar se é admin
  const adminDoc = await db.collection('users').doc(uid).get();
  if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Apenas administradores podem listar solicitações');
  }

  const { status = 'pendente', limit = 50 } = request.data ?? {};

  const requestsQuery = db
    .collection('profileUpgradeRequests')
    .where('status', '==', status)
    .orderBy('submittedAt', 'desc')
    .limit(limit);

  const requestsSnapshot = await requestsQuery.get();
  const requests = requestsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { requests };
});
