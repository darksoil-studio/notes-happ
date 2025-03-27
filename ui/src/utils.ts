import { AsyncSignal, AsyncState, Signal } from '@tnesh-stack/signals';

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
