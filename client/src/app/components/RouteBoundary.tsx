import { Component, type PropsWithChildren } from 'react';

export class RouteBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="p-8 text-center">
          This screen could not load.{' '}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </div>
      );
    return this.props.children;
  }
}
