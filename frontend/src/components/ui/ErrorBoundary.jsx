import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      if (this.props.silent) {
        return null
      }
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#060205] text-white">
          <div className="max-w-xl w-full p-8 rounded-2xl bg-[#12060E] border border-crimson/30 shadow-[0_0_50px_rgba(255,42,85,0.15)] text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-crimson/10 border border-crimson/30 flex items-center justify-center text-crimson text-xl font-bold">
              !
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {this.props.title || 'Interface Rendering Notice'}
            </h2>
            <p className="text-white/60 text-sm mb-6">
              {this.props.message || 'A component encountered a rendering issue. You can reload or proceed.'}
            </p>
            <div className="text-left bg-black/60 rounded-xl p-4 mb-6 border border-white/10 font-mono text-xs text-crimson/90 overflow-x-auto max-h-48">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack && (
                <div className="text-white/40 mt-2 text-[10px]">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-crimson hover:bg-crimson/90 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,42,85,0.3)]"
            >
              Reload Interface
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
