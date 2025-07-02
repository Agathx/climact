import { reportService } from '@/services/reportService'

// Mock Firestore
const mockFirestore = {
  collection: jest.fn(() => ({
    add: jest.fn(),
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
}

jest.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: jest.fn(() => mockFirestore.collection()),
  doc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}))

describe('Firebase Firestore Integration - Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Create Report', () => {
    it('should create a new report successfully', async () => {
      const mockReport = {
        tipo: 'Alagamento',
        descricao: 'Alagamento na Rua Principal',
        localizacao: { lat: -23.5505, lng: -46.6333 },
        usuario: 'test-user-id',
        status: 'pendente',
        timestamp: new Date().toISOString(),
      }

      const mockDocRef = { id: 'new-report-id' }
      mockFirestore.collection().add.mockResolvedValueOnce(mockDocRef)

      const result = await reportService.createReport(mockReport)
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('reports')
      expect(result).toEqual(mockDocRef)
    })

    it('should handle report creation errors', async () => {
      const mockReport = {
        tipo: 'Alagamento',
        descricao: 'Test report',
        localizacao: { lat: 0, lng: 0 },
        usuario: 'test-user-id',
      }

      mockFirestore.collection().add.mockRejectedValueOnce(
        new Error('Firestore error')
      )

      await expect(
        reportService.createReport(mockReport)
      ).rejects.toThrow('Firestore error')
    })
  })

  describe('Get Reports', () => {
    it('should fetch reports successfully', async () => {
      const mockReports = [
        {
          id: 'report-1',
          tipo: 'Alagamento',
          descricao: 'Test report 1',
          status: 'pendente',
        },
        {
          id: 'report-2',
          tipo: 'Deslizamento',
          descricao: 'Test report 2',
          status: 'resolvido',
        },
      ]

      const mockSnapshot = {
        docs: mockReports.map(report => ({
          id: report.id,
          data: () => report,
        })),
      }

      mockFirestore.collection().orderBy().limit().get.mockResolvedValueOnce(mockSnapshot)

      const result = await reportService.getReports()
      
      expect(mockFirestore.collection).toHaveBeenCalledWith('reports')
      expect(result).toHaveLength(2)
    })

    it('should handle empty report list', async () => {
      const mockSnapshot = { docs: [] }
      
      mockFirestore.collection().orderBy().limit().get.mockResolvedValueOnce(mockSnapshot)

      const result = await reportService.getReports()
      
      expect(result).toEqual([])
    })
  })

  describe('Update Report Status', () => {
    it('should update report status successfully', async () => {
      const reportId = 'test-report-id'
      const newStatus = 'resolvido'

      mockFirestore.collection().doc().update.mockResolvedValueOnce(undefined)

      await reportService.updateReportStatus(reportId, newStatus)
      
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith({
        status: newStatus,
        updatedAt: expect.any(String),
      })
    })

    it('should handle update errors', async () => {
      const reportId = 'test-report-id'
      const newStatus = 'resolvido'

      mockFirestore.collection().doc().update.mockRejectedValueOnce(
        new Error('Update failed')
      )

      await expect(
        reportService.updateReportStatus(reportId, newStatus)
      ).rejects.toThrow('Update failed')
    })
  })

  describe('Delete Report', () => {
    it('should delete report successfully', async () => {
      const reportId = 'test-report-id'

      mockFirestore.collection().doc().delete.mockResolvedValueOnce(undefined)

      await reportService.deleteReport(reportId)
      
      expect(mockFirestore.collection().doc().delete).toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      const reportId = 'test-report-id'

      mockFirestore.collection().doc().delete.mockRejectedValueOnce(
        new Error('Delete failed')
      )

      await expect(
        reportService.deleteReport(reportId)
      ).rejects.toThrow('Delete failed')
    })
  })
})
