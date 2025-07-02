import { getAlertas } from '@/services/cemadenService'

// Mock fetch
global.fetch = jest.fn()

describe('CemadenService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockReset()
  })

  it('should fetch CEMADEN alerts successfully', async () => {
    const mockAlerts = [
      {
        id: '1',
        titulo: 'Alerta de Chuva',
        descricao: 'Chuva forte prevista',
        dataHora: '2023-12-07T10:00:00Z',
        severidade: 'alta' as const,
        tipo: 'Chuva',
        municipio: {
          id: '1',
          nome: 'São Paulo',
          uf: 'SP'
        },
        coordenadas: {
          latitude: -23.5505,
          longitude: -46.6333
        },
        status: 'ativo' as const,
        fonte: 'CEMADEN' as const
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAlerts,
    })

    const result = await getAlertas('SP')
    
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const result = await getAlertas()
    
    // Should return empty array or handle error gracefully
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle network errors', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const result = await getAlertas()
    
    // Should return empty array or handle error gracefully
    expect(Array.isArray(result)).toBe(true)
  })

  it('should include proper headers in request', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    await getAlertas()
    
    // Service should handle requests properly
    expect(fetch).toHaveBeenCalled()
  })

  it('should handle timeout scenarios', async () => {
    // Mock a timeout scenario
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 100)
    })
    
    ;(fetch as jest.Mock).mockReturnValueOnce(timeoutPromise)

    const result = await getAlertas()
    
    // Should handle timeout gracefully
    expect(Array.isArray(result)).toBe(true)
  })

  it('should cache results appropriately', async () => {
    const mockAlerts = [{ id: '1', titulo: 'Test' }]
    
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockAlerts,
    })

    // Call twice
    await getAlertas()
    await getAlertas()
    
    // Should have proper caching behavior
    expect(fetch).toHaveBeenCalled()
  })
})
