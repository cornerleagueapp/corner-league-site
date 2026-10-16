import {
  Component,
  lazy,
  Suspense,
  type ComponentProps,
  type ReactNode,
} from "react";

// Phaser and the race scenes load only when a visitor actually starts a game.
// This also works when ArcadePage is already a lazy route in App.tsx.
const GameCanvas = lazy(() => import("./ArcadeGameCanvas"));
type Props = ComponentProps<typeof import("./ArcadeGameCanvas").default>;

class CanvasBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="p-6 text-cl-ink">
          <p role="alert">
            The game could not load. Return to the arcade, or reload the page
            and try again.
          </p>
          <button
            type="button"
            onClick={this.props.onExit}
            className="mt-4 min-h-11 rounded-lg border border-cl-border px-4 focus-visible:outline focus-visible:outline-2"
          >
            Back to arcade
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function DeferredArcadeCanvas(props: Props) {
  return (
    <CanvasBoundary onExit={props.onExit}>
      <Suspense
        fallback={
          <div className="p-6 text-cl-ink">
            <p role="status">Loading game…</p>
            <button
              type="button"
              onClick={props.onExit}
              className="mt-4 min-h-11 rounded-lg border border-cl-border px-4 focus-visible:outline focus-visible:outline-2"
            >
              Back to arcade
            </button>
          </div>
        }
      >
        <GameCanvas {...props} />
      </Suspense>
    </CanvasBoundary>
  );
}
