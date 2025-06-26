import React, { Component, ErrorInfo, ReactNode } from 'react';
import { QrCode } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class QRCodeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QRCode rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
          <QrCode className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Unable to display QR code. Please use the manual entry method.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default QRCodeErrorBoundary;
