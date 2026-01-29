import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    console.error('ErrorBoundary caught error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <div className="mb-4">
            <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm text-red-700 dark:text-red-400">{String(this.state.error && this.state.error.toString())}</pre>
          </div>
          <details className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm">
            <summary className="font-semibold">Error details</summary>
            <pre className="whitespace-pre-wrap mt-2 text-xs text-gray-700 dark:text-gray-300">{this.state.info && this.state.info.componentStack}</pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
