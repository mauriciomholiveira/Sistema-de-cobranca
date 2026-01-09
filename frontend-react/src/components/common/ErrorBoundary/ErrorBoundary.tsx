import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error reporting service
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <h2>Algo deu errado</h2>
            <p>Ocorreu um erro inesperado. Por favor, tente novamente.</p>
            {this.state.error && (
              <details>
                <summary>Detalhes do erro</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <button onClick={this.handleReset} className="btn-reset">
              Tentar Novamente
            </button>
            <button onClick={() => window.location.href = '/'} className="btn-home">
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
