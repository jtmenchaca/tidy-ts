/**
 * Minimal anywidget implementation for Deno Jupyter kernel.
 * Extracted from @anywidget/deno to reduce dependencies.
 */

import { currentRuntime, Runtime } from "@tidy-ts/shims";

// Buffer handling utility
function remove_buffers<T extends Record<string, unknown>>(
  state: T,
): {
  state: { [K in keyof T]: T[K] extends Uint8Array ? null : T[K] };
  buffers: Array<Uint8Array>;
  buffer_paths: Array<[string]>;
} {
  const buffers: Array<Uint8Array> = [];
  const buffer_paths: Array<[string]> = [];
  const out: Record<string, unknown> = {};
  for (const key in state) {
    if (state[key] instanceof Uint8Array) {
      out[key] = null;
      buffers.push(state[key]);
      buffer_paths.push([key]);
    } else {
      out[key] = state[key];
    }
  }
  return {
    // @ts-expect-error - we know the type
    state: out,
    buffers,
    buffer_paths,
  };
}

// Get Jupyter broadcast function (with fallback for non-Jupyter environments)
const jupyter_broadcast = (() => {
  try {
    if (currentRuntime === Runtime.Deno) {
      // @ts-ignore - Deno.jupyter is Deno-specific
      const deno = (globalThis as {
        Deno?: {
          jupyter?: { broadcast?: (...args: unknown[]) => Promise<void> };
        };
      }).Deno;
      return deno?.jupyter?.broadcast ?? (async () => {});
    }
    return async () => {};
  } catch (_) {
    return async () => {};
  }
})();

const ANYWIDGET_SEMVER_VERSION = "~0.9.*";
const COMMS = new WeakMap<object, Comm>();
const init_promise_symbol = Symbol("init_promise");

type ChangeEvents<State> = {
  [K in string & keyof State as `change:${K}`]: State[K];
};

class Comm {
  #id: string;
  #anywidget_version: string;
  #protocol_version_major: number;
  #protocol_version_minor: number;

  constructor({ anywidget_version }: { anywidget_version?: string }) {
    this.#id = crypto.randomUUID();
    this.#anywidget_version = anywidget_version ?? ANYWIDGET_SEMVER_VERSION;
    this.#protocol_version_major = 2;
    this.#protocol_version_minor = 1;
  }

  get id(): string {
    return this.#id;
  }

  init(data: Record<string, unknown> = {}): Promise<void> {
    const { state, buffers, buffer_paths } = remove_buffers(data);
    return jupyter_broadcast(
      "comm_open",
      {
        comm_id: this.id,
        target_name: "jupyter.widget",
        data: {
          state: {
            _model_module: "anywidget",
            _model_name: "AnyModel",
            _model_module_version: this.#anywidget_version,
            _view_module: "anywidget",
            _view_name: "AnyView",
            _view_module_version: this.#anywidget_version,
            _view_count: null,
            ...state,
          },
          buffer_paths: buffer_paths,
        },
      },
      {
        buffers: buffers,
        metadata: {
          version:
            `${this.#protocol_version_major}.${this.#protocol_version_minor}.0`,
        },
      },
    );
  }

  send_state(data: Record<string, unknown>): Promise<void> {
    const { state, buffers, buffer_paths } = remove_buffers(data);
    return jupyter_broadcast(
      "comm_msg",
      {
        comm_id: this.id,
        data: {
          method: "update",
          state: state,
          buffer_paths: buffer_paths,
        },
      },
      {
        buffers: buffers,
      },
    );
  }

  mimebundle() {
    return {
      "application/vnd.jupyter.widget-view+json": {
        version_major: this.#protocol_version_major,
        version_minor: this.#protocol_version_minor,
        model_id: this.id,
      },
    };
  }
}

/** A BackboneJS-like model for the anywidget. */
export class Model<State> {
  private _state: State;
  private _target: EventTarget;

  constructor(state: State) {
    this._state = state;
    this._target = new EventTarget();
  }

  get<K extends keyof State>(key: K): State[K] {
    return this._state[key];
  }

  set<K extends keyof State>(key: K, value: State[K]): void {
    this._state[key] = value;
    this._target.dispatchEvent(
      new CustomEvent(`change:${key as string}`, { detail: value }),
    );
  }

  on<Event extends keyof ChangeEvents<State>>(
    name: Event,
    callback: () => void,
  ): void {
    this._target.addEventListener(name as string, callback);
  }
}

/** The front end variant of the model. */
export type FrontEndModel<State> = Model<State> & {
  /** Sync changes with the Deno kernel. */
  save_changes(): void;
};

// Requires mod user to include lib DOM in their compiler options if they want to use this type.
type HTMLElement = typeof globalThis extends {
  HTMLElement: { new (): infer T };
} ? T
  : unknown;

function to_esm<State>({
  imports = "",
  render,
}: Pick<WidgetOptions<State>, "imports" | "render">) {
  return `${imports}\nexport default { render: ${render.toString()} }`;
}

type Awaitable<T> = T | Promise<T>;

/** The options bag to pass to the {@link widget} method. */
export interface WidgetOptions<State> {
  /** The initial widget state. */
  state: State;
  /** A function that renders the widget. This function is serialized and sent to the front end. */
  render: (context: {
    model: FrontEndModel<State>;
    el: HTMLElement;
  }) => Awaitable<(() => Awaitable<void>) | void>;
  /** The imports required for the front-end function. */
  imports?: string;
  /** The version of the anywidget front end to use. */
  version?: string;
}

/**
 * Creates an anywidget for the Deno Jupyter kernel.
 */
export function widget<State>(options: WidgetOptions<State>): Model<State> {
  const { state, render, imports, version } = options;
  const comm = new Comm({ anywidget_version: version });
  const init_promise = comm.init({
    ...state,
    _esm: to_esm({ imports, render }),
  });
  const model = new Model(state);
  for (const key in state) {
    // @ts-expect-error - TS can't infer this is correctly keyof ChangeEvents<State>
    model.on(`change:${key}`, () => {
      comm.send_state({ [key]: model.get(key) });
    });
  }
  const obj = new Proxy(model, {
    get(target, prop, receiver) {
      if (prop === init_promise_symbol) {
        return init_promise;
      }
      if (prop === Symbol.for("Jupyter.display")) {
        return async () => {
          await init_promise;
          return comm.mimebundle();
        };
      }
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (prop === Symbol.for("Jupyter.display")) {
        return true;
      }
      return Reflect.has(target, prop);
    },
  });
  COMMS.set(obj, comm);
  return obj;
}
