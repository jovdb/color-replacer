import { cloneElement } from "react";
import { colorspaces } from "./colorspaces";

export interface ISample {
  value: number;
}

export interface IHistogram {
  readonly samples: {
    [index: number]: ISample;
  };
  readonly nbrOfSamples: number;
  readonly maxSampleValue: number;
}

export function createHueHistogram(imageData: ImageData): IHistogram {

  // Collect data
  const samples: {[index: number]: ISample;} = {};
  const data = imageData.data;
  const len = data.length;

  const shouldExclude = (data2: Uint8ClampedArray, offset: number) => data2[offset] === data2[offset + 1] && data2[offset] === data2[offset + 2];

  let maxSampleValue = 0;
  for (let i = 0; i < len; i += 4) {

    // Temporary exclude greys, later in gray histogram
    // remark collect min/max lum of grays?
    if (shouldExclude(data, i)) continue;

    const hsl = colorspaces.rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // Ignore grey colors
    // if (hsl.s < 0.9) continue;

    const deg = Math.round(hsl.h * 360);
    const lum = hsl.l;

    const sample = samples[deg];
    if (!sample) {
      // First Sample value
      samples[deg] = {
        value: 1,
      };

    } else {
      sample.value += 1;
    }
  }

  // Get maxiumum value
  maxSampleValue = Math.max(...Object.keys(samples).map((index) => samples[+index].value));

  return {
    maxSampleValue,
    nbrOfSamples: 360,
    samples,
  };
}

export function getEntryWithMaxValue(histogram: IHistogram) {
  let max: ReturnType<typeof getSamples>[0] | undefined;
  for (const entry of getSamples(histogram)) {
    if (!max || (max.item.value <= entry.item.value)) {
      max = entry;
    }
  }
  return max;
}

export function getSamples(histogram: IHistogram): Array<{index: number; item: ISample}> {
  return (Object as any)
    .entries(histogram.samples)
    .map((entry: [string, ISample]) => ({
      index: +entry[0],
      item: entry[1],
    }));
}

export function clone(histogram: IHistogram): IHistogram {
  return {
    maxSampleValue: histogram.maxSampleValue,
    nbrOfSamples: histogram.nbrOfSamples,
    samples: Object.assign({}, histogram.samples),
  };
}

export function getTotalPixels(histogram: IHistogram) {
  return getSamples(histogram).reduce((totalPixels: number, {item}) => totalPixels += item.value, 0);
}
