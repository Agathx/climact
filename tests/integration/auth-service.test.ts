import { authService } from '@/services/authService'

// Mock Firebase Auth
const mockAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: null,
}

jest.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))

describe('Firebase Auth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
      }

      mockAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      })

      const result = await authService.register('test@example.com', 'password123')
      
      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      )
      expect(result).toBeDefined()
    })

    it('should handle registration errors', async () => {
      mockAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Email already in use')
      )

      await expect(
        authService.register('existing@example.com', 'password123')
      ).rejects.toThrow('Email already in use')
    })
  })

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true,
      }

      mockAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      })

      const result = await authService.login('test@example.com', 'password123')
      
      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      )
      expect(result).toBeDefined()
    })

    it('should handle login errors', async () => {
      mockAuth.signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Invalid credentials')
      )

      await expect(
        authService.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      mockAuth.signOut.mockResolvedValueOnce(undefined)

      await authService.logout()
      
      expect(mockAuth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      mockAuth.signOut.mockRejectedValueOnce(new Error('Logout failed'))

      await expect(authService.logout()).rejects.toThrow('Logout failed')
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state changes', () => {
      const mockCallback = jest.fn()
      
      authService.onAuthStateChanged(mockCallback)
      
      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(mockCallback)
    })

    it('should return current user', () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' }
      mockAuth.currentUser = mockUser

      const currentUser = authService.getCurrentUser()
      
      expect(currentUser).toEqual(mockUser)
    })
  })
})
