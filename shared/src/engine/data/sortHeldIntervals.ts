interface HeldIntervalLinks {
  get(index: number): { start: number; next: number };
}

/** Bottom-up merge sort over connector-owned links; no fixed-size level buffer. */
export function sortHeldIntervals(head: number, links: HeldIntervalLinks): number {
  let runSize = 1;
  while (true) {
    let current = head;
    let output = -1;
    let tail = -1;
    let merges = 0;
    while (current >= 0) {
      merges++;
      let right = current;
      let leftCount = 0;
      for (let i = 0; i < runSize && right >= 0; i++) {
        leftCount++;
        right = links.get(right).next;
      }
      let rightCount = runSize;
      while (leftCount > 0 || (rightCount > 0 && right >= 0)) {
        let selected = -1;
        if (leftCount > 0 && (rightCount === 0 || right < 0 || links.get(current).start <= links.get(right).start)) {
          selected = current;
          current = links.get(current).next;
          leftCount--;
        } else {
          selected = right;
          right = links.get(right).next;
          rightCount--;
        }
        if (tail >= 0) links.get(tail).next = selected;
        else output = selected;
        tail = selected;
      }
      current = right;
    }
    if (tail >= 0) links.get(tail).next = -1;
    head = output;
    if (merges <= 1) return head;
    runSize *= 2;
  }
}
