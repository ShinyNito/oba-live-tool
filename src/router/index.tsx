import { createHashRouter, Navigate } from 'react-router'
import AIChat from '@/pages/AIChat'
import AutoPopUp from '@/pages/AutoPopUp'
import LiveControl from '@/pages/LiveControl'
import LiveInteraction from '@/pages/LiveInteraction'
import Settings from '@/pages/SettingsPage'
import App from '../App'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <LiveControl />,
      },
      {
        path: '/interaction',
        element: <LiveInteraction />,
      },
      // 自动发言、自动回复已合并为直播互动
      ...['/auto-message', '/auto-reply', '/auto-reply/settings'].map(path => ({
        path,
        element: <Navigate to="/interaction" replace />,
      })),
      {
        path: '/auto-popup',
        element: <AutoPopUp />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
      {
        path: '/ai-chat',
        element: <AIChat />,
      },
    ],
  },
])
