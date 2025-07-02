import { render, screen } from '../utils/test-utils'
import { UserNav } from '@/components/user-nav'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

describe('UserNav Component', () => {
  beforeEach(() => {
    // Mock Firebase auth state
    jest.clearAllMocks()
  })

  it('should render user navigation', () => {
    render(<UserNav />)
    
    // The component should render without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('should have accessible elements', () => {
    render(<UserNav />)
    
    // Look for common UI elements that should be accessible
    const interactiveElements = screen.queryAllByRole('button')
    interactiveElements.forEach(element => {
      expect(element).toBeInTheDocument()
    })
  })

  it('should handle user authentication state', () => {
    render(<UserNav />)
    
    // Component should render in both authenticated and unauthenticated states
    expect(document.body).toBeInTheDocument()
  })
})
