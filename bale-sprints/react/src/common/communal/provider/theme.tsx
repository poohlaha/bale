/**
 * @fileOverview themes, switch theme
 * @date 2023-04-21
 * @author poohlaha
 */
import React from 'react'
import { useStore } from '@stores/index'

const ThemeContext = React.createContext<null>(null) // CONSTANT.SKINS

const ThemeProvider = ({ children }: any) => {
  const { commonStore } = useStore()
  return (
    <ThemeContext.Provider value={commonStore.skin}>
      <div className="wrapper wh100">{children}</div>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
