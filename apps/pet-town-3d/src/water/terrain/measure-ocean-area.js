/** Only count wet columns connected to the outer sea, excluding enclosed lakes. */
export function measureOceanArea(island, surface) {
  const size = island.size;
  const visited = new Uint8Array(size * size);
  const queue = new Int32Array(size * size);
  let tail = 0;
  const enqueue = (index) => {
    if (visited[index] || island.heights[index] > surface) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let i = 0; i < size; i++) {
    enqueue(i);
    enqueue((size - 1) * size + i);
    enqueue(i * size);
    enqueue(i * size + size - 1);
  }
  for (let head = 0; head < tail; head++) {
    const index = queue[head];
    const x = index % size;
    if (x > 0) enqueue(index - 1);
    if (x < size - 1) enqueue(index + 1);
    if (index >= size) enqueue(index - size);
    if (index < size * (size - 1)) enqueue(index + size);
  }
  return tail;
}
