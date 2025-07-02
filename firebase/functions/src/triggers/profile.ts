import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

const db = getFirestore();
const auth = getAuth();

/**
 * Trigger automático: Atualizar custom claims quando perfil do usuário é alterado (RN01, RN04)
 */
export const onUserProfileUpdated = onDocumentUpdated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) {
    return;
  }

  try {
    // Verificar se houve mudança no role
    if (beforeData.role !== afterData.role) {
      logger.info('User role changed, updating custom claims', { 
        userId, 
        oldRole: beforeData.role, 
        newRole: afterData.role 
      });

      // Atualizar custom claims no Firebase Auth
      await auth.setCustomUserClaims(userId, {
        role: afterData.role,
        isApproved: afterData.isApproved ?? false,
        permissions: getRolePermissions(afterData.role),
        updatedAt: new Date().toISOString(),
      });

      // Registrar log da mudança
      await db.collection('auditLogs').add({
        type: 'role_change',
        userId,
        oldRole: beforeData.role,
        newRole: afterData.role,
        changedBy: afterData.lastModifiedBy || 'system',
        timestamp: new Date(),
        metadata: {
          isApproved: afterData.isApproved,
          profileComplete: afterData.profileComplete,
        },
      });

      // Notificar usuário sobre mudança de perfil
      await notifyUserOfRoleChange(userId, beforeData.role, afterData.role);
    }

    // Verificar se houve mudança no status de aprovação
    if (beforeData.isApproved !== afterData.isApproved) {
      logger.info('User approval status changed', { 
        userId, 
        approved: afterData.isApproved 
      });

      // Atualizar custom claims
      await auth.setCustomUserClaims(userId, {
        role: afterData.role,
        isApproved: afterData.isApproved,
        permissions: getRolePermissions(afterData.role),
        updatedAt: new Date().toISOString(),
      });

      // Notificar usuário sobre aprovação/rejeição
      await notifyUserOfApprovalChange(userId, afterData.isApproved, afterData.role);
    }

    // Verificar se usuário foi suspenso
    if (!beforeData.isSuspended && afterData.isSuspended) {
      logger.info('User suspended', { userId });

      // Revogar custom claims
      await auth.setCustomUserClaims(userId, {
        role: 'suspended',
        isApproved: false,
        permissions: [],
        suspendedAt: new Date().toISOString(),
      });

      // Notificar usuário sobre suspensão
      await notifyUserOfSuspension(userId, afterData.suspensionReason);
    }

    logger.info('Profile update trigger completed', { userId });

  } catch (error) {
    logger.error('Error in profile update trigger', { userId, error });
  }
});

/**
 * Obter permissões baseadas no role
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    cidadao: ['submit_report', 'view_public_content', 'use_chat'],
    voluntario: ['submit_report', 'view_public_content', 'use_chat', 'respond_donations', 'access_volunteer_features'],
    ong: ['submit_report', 'view_public_content', 'use_chat', 'create_donations', 'manage_donations', 'access_ong_features'],
    defesa_civil: ['submit_report', 'view_all_reports', 'moderate_content', 'create_alerts', 'review_reports', 'access_admin_features'],
    admin: ['full_access', 'manage_users', 'view_analytics', 'moderate_all_content', 'manage_system'],
    suspended: [],
  };

  return permissions[role] || permissions.cidadao;
}

/**
 * Notificar usuário sobre mudança de role
 */
async function notifyUserOfRoleChange(userId: string, oldRole: string, newRole: string) {
  try {
    const roleNames: Record<string, string> = {
      cidadao: 'Cidadão',
      voluntario: 'Voluntário',
      ong: 'ONG',
      defesa_civil: 'Defesa Civil',
      admin: 'Administrador',
    };

    await db.collection('notifications').add({
      type: 'role_change',
      title: 'Perfil Atualizado',
      message: `Seu perfil foi alterado de ${roleNames[oldRole]} para ${roleNames[newRole]}`,
      uid: userId,
      priority: 'high',
      data: {
        oldRole,
        newRole,
        permissions: getRolePermissions(newRole),
      },
      createdAt: new Date(),
      isRead: false,
    });

    logger.info('User notified of role change', { userId, oldRole, newRole });
  } catch (error) {
    logger.error('Error notifying user of role change', { userId, error });
  }
}

/**
 * Notificar usuário sobre aprovação/rejeição
 */
async function notifyUserOfApprovalChange(userId: string, approved: boolean, role: string) {
  try {
    const title = approved ? 'Solicitação Aprovada' : 'Solicitação Rejeitada';
    const message = approved 
      ? `Sua solicitação para ${role} foi aprovada! Agora você tem acesso a novas funcionalidades.`
      : `Sua solicitação para ${role} foi rejeitada. Entre em contato com o suporte para mais informações.`;

    await db.collection('notifications').add({
      type: 'approval_change',
      title,
      message,
      uid: userId,
      priority: 'high',
      data: {
        approved,
        role,
        permissions: approved ? getRolePermissions(role) : [],
      },
      createdAt: new Date(),
      isRead: false,
    });

    logger.info('User notified of approval change', { userId, approved, role });
  } catch (error) {
    logger.error('Error notifying user of approval change', { userId, error });
  }
}

/**
 * Notificar usuário sobre suspensão
 */
async function notifyUserOfSuspension(userId: string, reason?: string) {
  try {
    await db.collection('notifications').add({
      type: 'suspension',
      title: 'Conta Suspensa',
      message: `Sua conta foi suspensa. Motivo: ${reason || 'Violação dos termos de uso'}`,
      uid: userId,
      priority: 'critical',
      data: {
        reason,
        suspendedAt: new Date().toISOString(),
      },
      createdAt: new Date(),
      isRead: false,
    });

    logger.info('User notified of suspension', { userId, reason });
  } catch (error) {
    logger.error('Error notifying user of suspension', { userId, error });
  }
}
