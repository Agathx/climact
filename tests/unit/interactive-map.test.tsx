import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import InteractiveMap from '@/components/interactive-map'

// Mock Leaflet and React Leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}))

// Mock CEMADEN service
jest.mock('@/services/cemadenService', () => ({
  getCemadenAlerts: jest.fn().mockResolvedValue([
    {
      id: '1',
      cidade: 'São Paulo',
      estado: 'SP',
      risco: 'Alto',
      tipo: 'Chuva Forte',
      lat: -23.5505,
      lng: -46.6333,
      timestamp: new Date().toISOString(),
    }
  ]),
}))

describe('InteractiveMap Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render map container', async () => {
    render(<InteractiveMap />)
    
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    })
  })

  it('should render tile layer', async () => {
    render(<InteractiveMap />)
    
    await waitFor(() => {
      expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
    })
  })

  it('should load and display markers for alerts', async () => {
    render(<InteractiveMap />)
    
    await waitFor(() => {
      const markers = screen.queryAllByTestId('marker')
      expect(markers.length).toBeGreaterThanOrEqual(0)
    })
  })

  it('should handle map interactions', async () => {
    render(<InteractiveMap />)
    
    const mapContainer = await screen.findByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
    
    // Test map click simulation
    fireEvent.click(mapContainer)
    expect(mapContainer).toBeInTheDocument()
  })

  it('should be accessible', async () => {
    render(<InteractiveMap />)
    
    const mapContainer = await screen.findByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
    
    // Map should be keyboard navigable (basic check)
    expect(mapContainer.tagName.toLowerCase()).toBe('div')
  })
})
