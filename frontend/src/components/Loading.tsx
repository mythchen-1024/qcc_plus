import type { FC } from 'react'

type LoadingProps = {
  message?: string
}

// Simple loading fallback used by Suspense and protected route guard
const Loading: FC<LoadingProps> = ({ message = '加载中...' }) => {
  return <div className="page-loading">{message}</div>
}

export default Loading
