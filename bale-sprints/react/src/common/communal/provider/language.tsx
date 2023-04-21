/**
 * @fileOverview language context
 * @date 2023-04-21
 * @author poohlaha
 */
import React from 'react'
import { useStore } from '@stores/index'

export const LanguageContext = React.createContext<null>(null) // CONSTANT.LANGUAGES

export const LanguageProvider = ({ children }: any) => {
  const { commonStore } = useStore()
  return <LanguageContext.Provider value={commonStore.language}>{children}</LanguageContext.Provider>
}
