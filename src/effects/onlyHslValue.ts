import * as colorspaces from "../colorspaces";

export function onlyHue(imageData: ImageData, ignoreBelowSaturation: number = 0) {
  const data = imageData.data;
  const len = data.length;
  let hsl;

  for (let i = 0; i < len; i += 4) {
      hsl = colorspaces.rgbToHsl(data[i], data[i + 1], data[i + 2]);

      if (hsl.s > ignoreBelowSaturation) {
        hsl.s = 1;
        hsl.l = 0.5;
      } else {
        // Don't draw greys
        hsl.h = 0;
        hsl.s = 0;
        hsl.l = 1;
      }
      hsl.toRgb().toImageData(imageData, i);
  }
  return imageData;
}

export function onlySaturation(imageData: ImageData) {
  const data = imageData.data;
  const len = data.length;
  let hsl;

  for (let i = 0; i < len; i += 4) {
      hsl = colorspaces.rgbToHsl(data[i], data[i + 1], data[i + 2]);
      hsl.h = 0; // red
      hsl.l = 1 - hsl.s; // black = colorfull
      hsl.s = 0;
      hsl.toRgb().toImageData(imageData, i);
  }
  return imageData;
}

export function onlyLuminance(imageData: ImageData) {
  const data = imageData.data;
  const len = data.length;
  let hsl;

  for (let i = 0; i < len; i += 4) {
      hsl = colorspaces.rgbToHsl(data[i], data[i + 1], data[i + 2]);
      hsl.h = 0; // red
      hsl.s = 0;
      hsl.toRgb().toImageData(imageData, i);
  }
  return imageData;
}
