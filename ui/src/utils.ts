import { AsyncSignal, AsyncState, Signal } from '@darksoil-studio/holochain-signals';

export function lazyLoadAndPoll<T>(
	task: () => Promise<T>,
	intervalMs: number,
): AsyncSignal<T> {
	let watched = false;
	const signal = new AsyncState<T>(
		{ status: 'pending' },
		{
			[Signal.subtle.watched]: () => {
				watched = true;

				const request = () => {
					if (watched)
						task()
							.then(value => {
								if (watched)
									signal.set({
										status: 'completed',
										value,
									});
							})
							.catch(error => {
								if (watched) {
									signal.set({
										status: 'error',
										error,
									});
								}
							})
							.finally(() => {
								if (watched) {
									setTimeout(() => request(), intervalMs);
								}
							});
				};
				request();
			},
			[Signal.subtle.unwatched]: () => {
				watched = false;
				signal.set({
					status: 'pending',
				});
			},
		},
	);
	return signal;
}

// NOTE: This scheduling logic is too basic to be useful. Do not copy/paste.
// This function would usually live in a library/framework, not application code
let pending = false;

const w = new Signal.subtle.Watcher(() => {
	if (!pending) {
		pending = true;
		queueMicrotask(() => {
			pending = false;
			for (const s of w.getPending()) s.get();
			w.watch();
		});
	}
});

// TODO: why do we need to use this complicated effect method?
// An effect effect Signal which evaluates to cb, which schedules a read of
// itself on the microtask queue whenever one of its dependencies might change
export function effect(cb: () => unknown) {
	let destructor: () => void | unknown;
	const c = new Signal.Computed(() => {
		if (typeof destructor === 'function') {
			destructor();
		}
		destructor = cb() as () => void | unknown;
	});
	w.watch(c);
	c.get();
	return () => {
		if (typeof destructor === 'function') {
			destructor();
		}
		w.unwatch(c);
	};
}
