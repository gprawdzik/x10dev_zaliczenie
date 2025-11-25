import { onBeforeUnmount, ref } from 'vue'

export interface NavigationService {
  navigate: (url: string) => void
  navigateDelayed: (url: string, delayMs: number) => number
  cancelNavigation: (handle: number) => void
}

/**
 * Default implementation for production use.
 * Uses window.location for navigation.
 */
const defaultNavigationService: NavigationService = {
  navigate: (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
  },
  navigateDelayed: (url: string, delayMs: number) => {
    if (typeof window === 'undefined') return -1
    return window.setTimeout(() => {
      window.location.href = url
    }, delayMs)
  },
  cancelNavigation: (handle: number) => {
    if (typeof window !== 'undefined' && handle !== -1) {
      window.clearTimeout(handle)
    }
  },
}

let navigationService = defaultNavigationService

/**
 * Composable for testable navigation.
 * Provides methods to navigate immediately or with a delay.
 * Handles cleanup automatically on component unmount.
 *
 * @example
 * ```ts
 * const { navigate, navigateDelayed } = useNavigation();
 *
 * // Immediate navigation
 * navigate('/dashboard');
 *
 * // Delayed navigation (cleaned up automatically)
 * navigateDelayed('/dashboard', 1000);
 * ```
 */
export function useNavigation() {
  const pendingNavigations = ref<number[]>([])

  const navigate = (url: string) => {
    navigationService.navigate(url)
  }

  const navigateDelayed = (url: string, delayMs: number) => {
    const handle = navigationService.navigateDelayed(url, delayMs)
    if (handle !== -1) {
      pendingNavigations.value.push(handle)
    }
    return handle
  }

  const cancelNavigation = (handle: number) => {
    navigationService.cancelNavigation(handle)
    pendingNavigations.value = pendingNavigations.value.filter((h) => h !== handle)
  }

  const cancelAll = () => {
    pendingNavigations.value.forEach((handle) => {
      navigationService.cancelNavigation(handle)
    })
    pendingNavigations.value = []
  }

  // Automatically clean up on unmount
  onBeforeUnmount(() => {
    cancelAll()
  })

  return {
    navigate,
    navigateDelayed,
    cancelNavigation,
    cancelAll,
  }
}

/**
 * For testing: allows injection of mock navigation service.
 * Use in test setup to intercept navigation calls.
 */
export function setNavigationService(service: NavigationService) {
  navigationService = service
}

/**
 * For testing: resets to default navigation service.
 * Use in test teardown to restore original behavior.
 */
export function resetNavigationService() {
  navigationService = defaultNavigationService
}

