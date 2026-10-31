// A dismissed offer stays dismissed until eligibility actually ends and starts again.
export function createUpdateOffer(accept: () => void) {
  let eligible = false;
  let dismissed = false;
  let visible = false;
  let listener: ((visible: boolean) => void) | undefined;
  const publish = () => {
    const next = eligible && !dismissed;
    if (next !== visible) {
      visible = next;
      listener?.(visible);
    }
  };
  return {
    accept() {
      if (visible) {
        dismissed = true;
        publish();
        accept();
      }
    },
    defer() {
      dismissed = true;
      publish();
    },
    eligibility(value: boolean) {
      eligible = value;
      if (!value) {
        dismissed = false;
      }
      publish();
    },
    subscribe(next: (visible: boolean) => void) {
      listener = next;
      next(visible);
      return () => {
        if (listener === next) {
          listener = undefined;
        }
      };
    },
  };
}
