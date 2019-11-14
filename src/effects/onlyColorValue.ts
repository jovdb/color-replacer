export function onlyColorValue(imageData: ImageData, opts: {
  color: "r" | "g" | "b";
}) {
  const { color } = opts;

  const data = imageData.data;
  const len = data.length;

  const inputIndex =
    color === "r" ? 0 :
    color === "g" ? 1 :
    color === "b" ? 2 :
    0;

  for (let i = 0; i < len; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 255 - data[i + inputIndex];
  }

  return imageData;
}
