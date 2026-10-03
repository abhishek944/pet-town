const chains = new WeakMap();

/** Input owners can leave in any order without restoring disposed wrappers. */
export function addPlayerInputFilter(input, filter) {
  let chain = chains.get(input);
  if (!chain) {
    chain = { base: input.poll, filters: new Map() };
    chain.poll = function (dt) {
      let sample = chain.base.call(this, dt);
      for (const callback of chain.filters.values()) sample = callback(sample, dt);
      return sample;
    };
    chains.set(input, chain);
    input.poll = chain.poll;
  }
  const token = Symbol("player-input-owner");
  chain.filters.set(token, filter);
  return () => {
    if (!chain.filters.delete(token)) return;
    if (!chain.filters.size) {
      if (input.poll === chain.poll) input.poll = chain.base;
      chains.delete(input);
    }
  };
}
