import { useNotification, useTransactionPopup } from '@blockscout/app-sdk'
import { useEffect, useState } from 'react'

/**
 * Safe wrapper for useNotification that handles SSR gracefully
 * Returns the real hook when mounted on client, fallback during SSR
 */
export function useNotificationSafe() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  try {
    const notification = useNotification()
    return isMounted ? notification : getFallbackNotification()
  } catch (error) {
    // During SSR or when NotificationProvider is not available, return a fallback
    console.warn('NotificationProvider not available, using fallback')
    return getFallbackNotification()
  }
}

/**
 * Safe wrapper for useTransactionPopup that handles SSR gracefully
 * Returns the real hook when mounted on client, fallback during SSR
 */
export function useTransactionPopupSafe() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  try {
    const transactionPopup = useTransactionPopup()
    return isMounted ? transactionPopup : getFallbackTransactionPopup()
  } catch (error) {
    // During SSR or when TransactionPopupProvider is not available, return a fallback
    console.warn('TransactionPopupProvider not available, using fallback')
    return getFallbackTransactionPopup()
  }
}

function getFallbackNotification() {
  return {
    openTxToast: () => {
      console.log('Toast would be shown here')
    }
  }
}

function getFallbackTransactionPopup() {
  return {
    openPopup: () => {
      console.log('Transaction popup would be opened here')
    }
  }
} 