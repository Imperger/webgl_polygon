export async function EventWaiter<T extends keyof HTMLElementEventMap>(target: EventTarget, event: T) {
    return new Promise(ok => target.addEventListener(event, ok, { once: true }));
}
