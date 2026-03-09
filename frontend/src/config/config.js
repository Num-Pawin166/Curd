import { lazy } from 'react'
import locales from './locales'
import routes from './routes'
import themes from './themes'
import parseLanguages from '../utils/locale'
import Loading from '../components/Loading/Loading'
import defaultRoutes from './defaultRoutes'

const config = {
  getDefaultRoutes: defaultRoutes,
  locale: {
    locales,
    defaultLocale: parseLanguages(['en', 'de', 'ru'], 'en'),
    onError: (e) => {
      // Here we warn the user about translation error
      //console.warn(e)
      return
    },
  },  
  auth: {
    persistKey: 'base-shell:auth',
    signInURL: '/signin',
    redirectTo: '/',
  },
  routes,
  menu: {
    width: 240,
    offlineIndicatorHeight: 12,
    initialAuthMenuOpen: false,
    initialMiniMode: false,
    initialMenuOpen: true,
    initialMobileMenuOpen: false,
    initialMiniSwitchVisibility: true,
    MenuHeader: lazy(() =>
      import('../components/MenuHeader/MenuHeader')
    ),
    MenuContent: lazy(() => import('../components/Menu/MenuContent')),
    useWindowWatcher: false,
  },
  components: {
    Menu: lazy(() => import('../containers/Menu/Menu')),
    Loading,
  },
  containers: {
    LayoutContainer: lazy(() => import('../containers/LayoutContainer/LayoutContainer')
    ),
  },
  pages: {
    LandingPage: lazy(() => import('../pages/LandingPage/LandingPage')),
    PageNotFound: lazy(() => import('../pages/PageNotFound/PageNotFound')),
  },
  theme: {
    themes,
    defaultThemeID: 'default',
    defaultIsDarkMode: false,
    defaultIsRTL: false, //change this to true for default Right to Left Language support
  },
}

export default config
