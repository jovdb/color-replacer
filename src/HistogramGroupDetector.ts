import * as HistogramData from "./HistogramData";

function getSpikeRange(histogram: HistogramData.IHistogram, startIndex: number, doesRotate: boolean, minNumberOfPixels: number): IGroup {

  let min = startIndex;
  let max = startIndex;

  const getValue = (index: number) => {
    if (doesRotate) {
      index = (index % histogram.nbrOfSamples + histogram.nbrOfSamples) % histogram.nbrOfSamples;
    }
    return histogram.samples[index] ? histogram.samples[index].value : 0;
  };

  function isGroup(previousIndex: number, currentIndex: number) {
    // const prevValue = getValue(previousIndex);
    const currentValue = getValue(currentIndex);
    return currentValue > minNumberOfPixels;
  }

  while (isGroup(min, min - 1)) { min -= 1; }
  while (isGroup(max, max + 1)) { max += 1; }

  /*
  let minLum = 1;
  let maxLum = 0;
  for (var i = min; i < max; i++) {
    const info = histogram.samples[i];
    if (!info) continue;
    if (info.minLum > minLum) info.minLum = minLum;
    if (info.maxLum < maxLum) info.maxLum = maxLum;
  }*/

  return {
    hue: startIndex,
    hueMax: max,
    hueMin: min,
    lumMax: 0.95,
    lumMethod: "clip",
    lumMin: 0.05,
    satMax: 0.95,
    satMethod: "clip",
    satMin: 0.05,
  };

}
/*

function median(histogram: IHistogram, half = 0.5) {
  let total = 0;
  let count = 0;

  const sorted = getHistogramItems(histogram)
    .map(([, item]) => item)
    .sort((a, b) => b.hueCount > a.hueCount ? 1 : -1);
  return sorted[Math.floor(sorted.length * half)].hueCount as number;
}

function spreadGroups(ranges: ReadonlyArray<IHueRange>) {

  if (!ranges.length) return [];

  if (ranges.length === 1) {
    return [{
      min: 0,
      deg: ranges[0].deg,
      max: 360,
      minLum: ranges[0].minLum,
      maxLum: ranges[0].maxLum,
    } as IHueRange];
  } else {

    const newRanges = ranges
      .map(r => ({...r})) // clone
      .sort((a, b) => a.deg < b.deg ? -1 : 1) // Order by hueRanges

    for (var i = 1; i < newRanges.length; i++) { // skip first
      const range = newRanges[i];
      const prevRange = newRanges[i - 1];

      const halfBetween = Math.ceil(prevRange.max + (range.min - prevRange.max) / 2);
      prevRange.max = halfBetween - 1;
      range.min = halfBetween;
    }

    // fix first and last
    const lastRange = newRanges[newRanges.length - 1];
    const firstRange = newRanges[0];
    const lastMax = lastRange.max;
    const firstMin = newRanges[0].min;
    const halfBetween = Math.ceil(lastMax + (360 + firstMin - lastMax) / 2);

    lastRange.max =  (halfBetween - 1  < lastRange.deg) ? 360 + halfBetween - 1 : halfBetween;
    firstRange.min = (halfBetween > firstRange.deg) ? halfBetween - 360 : halfBetween;
    return newRanges;
  }
}*/

export function detectGroups(histogram: HistogramData.IHistogram | undefined, options: {
    minNumberOfPixels: number;
    maxNumberOfGroups: number;
    shouldSpreadGroups: boolean;
    doesRotate: boolean;
}) {

  if (!histogram) return undefined;

  const {
    minNumberOfPixels,
    shouldSpreadGroups = true,
    doesRotate = false,
    maxNumberOfGroups = 10,
  } = options;

  histogram = HistogramData.clone(histogram); // work on a copy

  const shouldStop = (value: number, deg: number) => value < 0 || deg < 0 || value < minNumberOfPixels;

  const groups: IGroup[] = [];
  for (let i = 0; i < maxNumberOfGroups; i++) { // Max 20 colors

    const max = HistogramData.getEntryWithMaxValue(histogram);
    if (!max) break;

    // Stop searching?
    if (shouldStop(max.item.value, max.index)) break;

    const group = getSpikeRange(histogram, max.index, doesRotate, minNumberOfPixels);

    groups.push(group);

    // Remove handled groups from histogram
    for (let index = group.hueMin; index <= group.hueMax; index++) {
      delete histogram.samples[index];
    }
  }

  // Spread groups?
  /*
  if (shouldSpreadGroups) {
    groups = spreadGroups(groups);
  }*/

  return groups;

}
