import { render } from '../utils/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Navigation Components', () => {
    it('MainNav should be accessible', async () => {
      const { container } = render(<MainNav />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('UserNav should be accessible', async () => {
      const { container } = render(<UserNav />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('should have proper form labels and structure', async () => {
      const TestForm = () => (
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required />
          
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required />
          
          <button type="submit">Submit</button>
        </form>
      )

      const { container } = render(<TestForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should handle error states accessibly', async () => {
      const ErrorForm = () => (
        <form>
          <label htmlFor="email-error">Email</label>
          <input 
            id="email-error" 
            type="email" 
            aria-invalid="true"
            aria-describedby="email-error-text"
          />
          <div id="email-error-text" role="alert">
            Please enter a valid email address
          </div>
          
          <button type="submit">Submit</button>
        </form>
      )

      const { container } = render(<ErrorForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Interactive Elements', () => {
    it('buttons should be accessible', async () => {
      const ButtonTest = () => (
        <div>
          <button type="button">Regular Button</button>
          <button type="submit">Submit Button</button>
          <button type="button" aria-label="Close dialog">×</button>
          <button type="button" disabled>Disabled Button</button>
        </div>
      )

      const { container } = render(<ButtonTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('links should be accessible', async () => {
      const LinkTest = () => (
        <div>
          <a href="/home">Home</a>
          <a href="/about">About</a>
          <a href="https://external.com" target="_blank" rel="noopener noreferrer">
            External Link
          </a>
        </div>
      )

      const { container } = render(<LinkTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast and Visual Elements', () => {
    it('should have sufficient color contrast', async () => {
      const ColorTest = () => (
        <div>
          <div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            High contrast text
          </div>
          <button style={{ backgroundColor: '#007acc', color: '#ffffff' }}>
            Button with good contrast
          </button>
        </div>
      )

      const { container } = render(<ColorTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', async () => {
      const HeadingTest = () => (
        <div>
          <h1>Main Heading</h1>
          <h2>Section Heading</h2>
          <h3>Subsection Heading</h3>
          <p>Content paragraph</p>
        </div>
      )

      const { container } = render(<HeadingTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('ARIA Attributes', () => {
    it('should use proper ARIA labels and roles', async () => {
      const AriaTest = () => (
        <div>
          <nav role="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/home">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
          
          <main role="main">
            <h1>Page Title</h1>
            <section aria-labelledby="section-heading">
              <h2 id="section-heading">Section Title</h2>
              <p>Section content</p>
            </section>
          </main>
        </div>
      )

      const { container } = render(<AriaTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should handle dynamic content accessibly', async () => {
      const DynamicTest = () => (
        <div>
          <div aria-live="polite" aria-atomic="true">
            Status updates will appear here
          </div>
          
          <div aria-live="assertive">
            Error messages will appear here
          </div>
          
          <button aria-expanded="false" aria-controls="expandable-content">
            Toggle Content
          </button>
          
          <div id="expandable-content" hidden>
            This content can be toggled
          </div>
        </div>
      )

      const { container } = render(<DynamicTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const KeyboardTest = () => (
        <div>
          <button tabIndex={0}>First focusable</button>
          <a href="/link" tabIndex={0}>Focusable link</a>
          <input type="text" tabIndex={0} />
          <button tabIndex={0}>Last focusable</button>
        </div>
      )

      const { container } = render(<KeyboardTest />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
