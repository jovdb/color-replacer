
export function showColorPickerAsync(initialColor: string) {
  return new Promise<string | undefined>((resolve) => {
    const colorEl = document.createElement("input");
    colorEl.type = "color";
    colorEl.value = initialColor ?? "";
    const onInput = () => {
      colorEl.removeEventListener("input", onInput);
      resolve(colorEl.value || undefined);
    };
    colorEl.value = initialColor || "";
    colorEl.addEventListener("input", onInput);
    colorEl.click();
  });
}
